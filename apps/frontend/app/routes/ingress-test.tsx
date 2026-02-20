import type { Route } from "./+types/ingress-test";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "react-oidc-context";
import { api } from "~/lib/axios";
import { useAuthStore } from "~/store/authStore";

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "Ingress Validation Harness | ARC" },
        { name: "description", content: "Test Keycloak PKCE → APISIX → IAM pipeline" },
    ];
}

export default function IngressTest() {
    const auth = useAuth();
    const { token, setToken, clearToken, orgId } = useAuthStore();

    // Sync OIDC access token into Zustand store for Axios interceptor
    useEffect(() => {
        if (auth.isAuthenticated && auth.user?.access_token) {
            setToken(auth.user.access_token);
        }
        if (!auth.isAuthenticated) {
            clearToken();
        }
    }, [auth.isAuthenticated, auth.user, setToken, clearToken]);

    const { data, refetch, isFetching, isError, error } = useQuery({
        queryKey: ["testApi"],
        queryFn: async () => {
            const res = await api.get("/api/abc/test");
            return res.data;
        },
        enabled: false,
        retry: false,
    });

    // Decode JWT payload for display
    const decodedPayload = token
        ? (() => {
            try {
                return JSON.parse(atob(token.split(".")[1]));
            } catch {
                return null;
            }
        })()
        : null;

    if (auth.isLoading) {
        return (
            <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
                <p className="text-muted-foreground">Initializing OIDC...</p>
            </div>
        );
    }

    if (auth.error) {
        return (
            <div className="min-h-screen bg-background text-foreground p-8">
                <div className="max-w-3xl mx-auto border border-destructive/30 bg-destructive/5 rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-destructive mb-2">OIDC Error</h2>
                    <pre className="bg-muted p-4 rounded text-sm overflow-auto font-mono">
                        {auth.error.message}
                    </pre>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="max-w-3xl mx-auto p-8 space-y-8">
                {/* ── Header ───────────────────────────────── */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Ingress Validation Harness
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Keycloak (PKCE) → APISIX → Go Runner (JWT + RBAC) → IAM Service
                    </p>
                </div>

                {/* ── Auth Panel ──────────────────────────── */}
                {!auth.isAuthenticated ? (
                    <section className="border rounded-lg p-6 space-y-4">
                        <h2 className="text-lg font-semibold">1. Authenticate via Keycloak</h2>
                        <p className="text-sm text-muted-foreground">
                            Redirects to Keycloak using Authorization Code + PKCE flow.
                        </p>
                        <button
                            id="login-btn"
                            className="bg-primary text-primary-foreground px-4 py-2 rounded font-medium hover:opacity-90 transition-opacity"
                            onClick={() => void auth.signinRedirect()}
                        >
                            Login via Keycloak
                        </button>
                    </section>
                ) : (
                    <>
                        {/* ── Token Info ─────────────────────────── */}
                        <section className="border border-green-500/30 bg-green-500/5 rounded-lg p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-green-600">
                                    ✓ Authenticated (Auth Code + PKCE)
                                </h2>
                                <button
                                    id="logout-btn"
                                    onClick={() => void auth.signoutRedirect()}
                                    className="text-sm text-destructive hover:underline"
                                >
                                    Logout
                                </button>
                            </div>
                            {decodedPayload && (
                                <div className="text-sm space-y-1">
                                    <p>
                                        <span className="font-medium">sub:</span>{" "}
                                        <code className="bg-muted px-1 rounded">{decodedPayload.sub}</code>
                                    </p>
                                    <p>
                                        <span className="font-medium">preferred_username:</span>{" "}
                                        <code className="bg-muted px-1 rounded">
                                            {decodedPayload.preferred_username}
                                        </code>
                                    </p>
                                    <p>
                                        <span className="font-medium">email:</span>{" "}
                                        <code className="bg-muted px-1 rounded">
                                            {decodedPayload.email}
                                        </code>
                                    </p>
                                    <p>
                                        <span className="font-medium">exp:</span>{" "}
                                        <code className="bg-muted px-1 rounded">
                                            {new Date(decodedPayload.exp * 1000).toISOString()}
                                        </code>
                                    </p>
                                </div>
                            )}
                        </section>

                        {/* ── Gateway Request ─────────────────────── */}
                        <section className="border rounded-lg p-6 space-y-4">
                            <h2 className="text-lg font-semibold">2. Execute Gateway Request</h2>
                            <p className="text-sm text-muted-foreground">
                                Sends <code>GET /api/abc/test</code> through APISIX with the JWT
                                and <code>X-Organization-Id: {orgId}</code>
                            </p>
                            <button
                                id="gateway-request-btn"
                                className="bg-foreground text-background px-4 py-2 rounded font-medium hover:opacity-90 transition-opacity"
                                onClick={() => refetch()}
                                disabled={isFetching}
                            >
                                {isFetching ? "Executing..." : "Send Request"}
                            </button>
                        </section>
                    </>
                )}

                {/* ── Response ─────────────────────────────── */}
                {data && (
                    <section className="border border-green-500/30 bg-green-500/5 rounded-lg p-6 space-y-3">
                        <h2 className="text-lg font-semibold text-green-600">
                            Gateway Response (200 OK)
                        </h2>
                        <pre className="bg-muted p-4 rounded text-sm overflow-auto font-mono">
                            {JSON.stringify(data, null, 2)}
                        </pre>
                    </section>
                )}

                {isError && (
                    <section className="border border-destructive/30 bg-destructive/5 rounded-lg p-6 space-y-3">
                        <h2 className="text-lg font-semibold text-destructive">
                            Request Failed
                        </h2>
                        <pre className="bg-muted p-4 rounded text-sm overflow-auto font-mono">
                            {JSON.stringify(
                                {
                                    status: (error as any)?.response?.status,
                                    statusText: (error as any)?.response?.statusText,
                                    data: (error as any)?.response?.data,
                                    message: (error as any)?.message,
                                },
                                null,
                                2
                            )}
                        </pre>
                    </section>
                )}
            </div>
        </div>
    );
}
