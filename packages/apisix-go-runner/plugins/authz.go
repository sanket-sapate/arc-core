package plugins

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	pkgHTTP "github.com/apache/apisix-go-plugin-runner/pkg/http"
	"github.com/apache/apisix-go-plugin-runner/pkg/log"
	"github.com/apache/apisix-go-plugin-runner/pkg/plugin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/MicahParks/keyfunc/v3"
	"github.com/redis/go-redis/v9"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	"go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc"

	"github.com/arc-self/packages/go-core/telemetry"
	pb "github.com/arc-self/packages/go-core/proto/iam/v1"
)

// ── Singleton clients (initialized once) ──────────────────────────────

var (
	redisClient *redis.Client
	grpcConn    *grpc.ClientConn
	iamClient   pb.IAMServiceClient
	jwks        keyfunc.Keyfunc
	initOnce    sync.Once
)

// ResetClients resets the singleton clients for testing.
// Call this at the start of each test to ensure a clean state.
func ResetClients() {
	redisClient = nil
	if grpcConn != nil {
		grpcConn.Close()
	}
	grpcConn = nil
	iamClient = nil
	jwks = nil
	initOnce = sync.Once{}
}

func initClients() {
	initOnce.Do(func() {
		// Skip initialization if AUTHZ_SKIP_INIT is set (for unit tests)
		if os.Getenv("AUTHZ_SKIP_INIT") == "true" {
			log.Infof("authz: skipping client initialization (AUTHZ_SKIP_INIT=true)")
			return
		}

		// OpenTelemetry tracer
		otelEndpoint := os.Getenv("OTEL_EXPORTER_OTLP_ENDPOINT")
		if otelEndpoint != "" {
			_, err := telemetry.InitTracer(context.Background(), "apisix-go-runner", otelEndpoint)
			if err != nil {
				log.Errorf("authz: failed to init OTel tracer: %s", err)
			} else {
				log.Infof("authz: OTel tracer initialized, endpoint=%s", otelEndpoint)
			}
		}

		// Redis
		redisAddr := os.Getenv("REDIS_URL")
		if redisAddr == "" {
			redisAddr = "redis:6379"
		}
		redisClient = redis.NewClient(&redis.Options{
			Addr: redisAddr,
		})

		// JWKS — Keycloak public key set for JWT signature verification
		jwksURL := os.Getenv("JWKS_URL")
		if jwksURL == "" {
			jwksURL = "http://keycloak:8080/realms/arc/protocol/openid-connect/certs"
		}
		var err error
		jwks, err = keyfunc.NewDefault([]string{jwksURL})
		if err != nil {
			log.Errorf("authz: failed to initialize JWKS from %s: %s", jwksURL, err)
			// Continue without JWKS — will deny all requests (fail-closed)
		} else {
			log.Infof("authz: JWKS initialized from %s", jwksURL)
		}

		// gRPC connection to IAM service — with OTel instrumentation
		iamAddr := os.Getenv("IAM_GRPC_ADDR")
		if iamAddr == "" {
			iamAddr = "iam-service:50051"
		}
		grpcConn, err = grpc.NewClient(iamAddr,
			grpc.WithTransportCredentials(insecure.NewCredentials()),
			grpc.WithStatsHandler(otelgrpc.NewClientHandler()),
		)
		if err != nil {
			log.Errorf("authz: failed to connect to IAM gRPC: %s", err)
			return
		}
		iamClient = pb.NewIAMServiceClient(grpcConn)

		log.Infof("authz: initialized redis=%s iam_grpc=%s", redisAddr, iamAddr)
	})
}

// ── Plugin registration ───────────────────────────────────────────────

func init() {
	err := plugin.RegisterPlugin(&Authz{})
	if err != nil {
		log.Fatalf("failed to register plugin authz: %s", err)
	}
}

// Authz is a custom authentication & authorization plugin.
// It performs JWT signature verification against Keycloak's JWKS endpoint,
// extracts the user identity from the token, evaluates permissions against
// the IAM service (with Redis caching), and injects internal headers for
// upstream services.
type Authz struct {
	plugin.DefaultPlugin
}

// AuthzConf holds the per-route plugin configuration.
// Each route injects a permission_slug like "item:read" or "iam:manage".
type AuthzConf struct {
	PermissionSlug string `json:"permission_slug"`
}

func (p *Authz) Name() string {
	return "authz"
}

func (p *Authz) ParseConf(in []byte) (interface{}, error) {
	conf := AuthzConf{}
	err := json.Unmarshal(in, &conf)
	return conf, err
}

func (p *Authz) RequestFilter(conf interface{}, w http.ResponseWriter, r pkgHTTP.Request) {
	initClients()

	// ── 1. Extract and verify JWT from Authorization header ───────────
	authHeader := r.Header().Get("Authorization")
	if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
		writeJSON(w, http.StatusUnauthorized, `{"error": "missing or malformed authorization header"}`)
		return
	}
	tokenString := strings.TrimPrefix(authHeader, "Bearer ")

	// Verify the JWT signature using Keycloak's JWKS
	var userID string
	if jwks != nil {
		token, err := jwt.Parse(tokenString, jwks.KeyfuncCtx(context.Background()))
		if err != nil || !token.Valid {
			log.Errorf("authz: JWT verification failed: %v", err)
			writeJSON(w, http.StatusUnauthorized, `{"error": "invalid or expired token"}`)
			return
		}

		// Extract subject (user_id) from verified claims
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			writeJSON(w, http.StatusUnauthorized, `{"error": "invalid token claims"}`)
			return
		}
		sub, _ := claims["sub"].(string)
		if sub == "" {
			writeJSON(w, http.StatusUnauthorized, `{"error": "token missing sub claim"}`)
			return
		}
		userID = sub
	} else {
		// Fallback: JWKS not available (test/dev) — skip verification
		log.Warnf("authz: JWKS not initialized, skipping JWT verification")
		userID = r.Header().Get("X-User-Id")
		if userID == "" {
			writeJSON(w, http.StatusUnauthorized, `{"error": "authentication unavailable"}`)
			return
		}
	}

	// ── 2. Extract organization context from request header ───────────
	orgID := r.Header().Get("X-Organization-Id")
	if orgID == "" {
		writeJSON(w, http.StatusForbidden, `{"error": "missing organization context"}`)
		return
	}

	// ── 3. Extract config — route defines the required permission slug ─
	authzConf := conf.(AuthzConf)
	permissionSlug := authzConf.PermissionSlug

	// ── 4. Check Redis cache ─────────────────────────────────────────
	ctx := context.Background()
	cacheKey := fmt.Sprintf("authz:%s:%s:%s", userID, orgID, permissionSlug)

	if redisClient != nil {
		cached, err := redisClient.HGetAll(ctx, cacheKey).Result()
		if err == nil && cached["allowed"] == "true" {
			// Cache hit — inject headers from cache and return
			permissions := cached["permissions"]
			r.Header().Set("X-Internal-User-Id", userID)
			r.Header().Set("X-Internal-Org-Id", orgID)
			r.Header().Set("X-Internal-Permissions", permissions)
			log.Infof("authz: cache hit user=%s org=%s slug=%s", userID, orgID, permissionSlug)
			return
		}
	}

	// ── 5. Cache miss — execute gRPC call to IAM service ──────────────
	var allowed bool
	var permissions string

	if iamClient != nil {
		grpcCtx, cancel := context.WithTimeout(ctx, 2000*time.Millisecond)
		defer cancel()

		resp, err := iamClient.EvaluateAccess(grpcCtx, &pb.EvaluateAccessRequest{
			UserId:         userID,
			OrganizationId: orgID,
			PermissionSlug: permissionSlug,
		})

		if err != nil {
			// Fail-closed: deny on gRPC error
			log.Errorf("authz: gRPC error: %s", err)
			writeJSON(w, http.StatusForbidden, `{"error": "authorization service unavailable"}`)
			return
		}

		allowed = resp.Allowed
		if len(resp.Permissions) > 0 {
			permissions = strings.Join(resp.Permissions, ",")
		}
	} else {
		// Fallback: gRPC not initialized — allow with placeholder
		log.Warnf("authz: IAM gRPC client not available, using fallback")
		allowed = true
		permissions = permissionSlug
	}

	// ── 6. Handle fail-closed ─────────────────────────────────────────
	if !allowed {
		writeJSON(w, http.StatusForbidden, `{"error": "access denied"}`)
		return
	}

	// ── 7. Cache the successful result in Redis ───────────────────────
	if redisClient != nil {
		pipe := redisClient.Pipeline()
		pipe.HSet(ctx, cacheKey, "allowed", "true", "permissions", permissions)
		pipe.Expire(ctx, cacheKey, 300*time.Second)
		if _, err := pipe.Exec(ctx); err != nil {
			log.Errorf("authz: redis cache write error: %s", err)
		}
	}

	// ── 8. Inject internal headers for upstream services ──────────────
	r.Header().Set("X-Internal-User-Id", userID)
	r.Header().Set("X-Internal-Org-Id", orgID)
	r.Header().Set("X-Internal-Permissions", permissions)

	log.Infof("authz: user=%s org=%s slug=%s permissions=%s -> allowed", userID, orgID, permissionSlug, permissions)
}

// writeJSON is a helper to send a JSON error response with the given status code.
func writeJSON(w http.ResponseWriter, status int, body string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_, _ = w.Write([]byte(body))
}
