package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	db "github.com/arc-self/apps/privacy-service/internal/repository/db"
)

var (
	ErrInvalidToken = errors.New("invalid or expired token")
)

type PortalAuthService interface {
	RequestMagicLink(ctx context.Context, email string) error
	VerifyMagicLink(ctx context.Context, token string) (string, error)
}

type portalAuthService struct {
	pool    *pgxpool.Pool
	querier db.Querier
	jwtKey  []byte
}

func NewPortalAuthService(pool *pgxpool.Pool, q db.Querier, jwtSecret string) PortalAuthService {
	return &portalAuthService{
		pool:    pool,
		querier: q,
		jwtKey:  []byte(jwtSecret),
	}
}

func generateSecureToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func (s *portalAuthService) RequestMagicLink(ctx context.Context, email string) error {
	if email == "" {
		return fmt.Errorf("%w: email is required", ErrInvalidInput)
	}

	token, err := generateSecureToken()
	if err != nil {
		return fmt.Errorf("failed to generate token: %w", err)
	}

	expiresAt := time.Now().Add(15 * time.Minute)

	_, err = s.querier.CreateMagicToken(ctx, db.CreateMagicTokenParams{
		ID:        newUUID(),
		Email:     email,
		Token:     token,
		ExpiresAt: pgtype.Timestamptz{Time: expiresAt, Valid: true},
	})
	if err != nil {
		return fmt.Errorf("failed to save magic token: %w", err)
	}

	// In a real application, we would send an email here.
	// For this task, we just log it.
	fmt.Printf("[SIMULATED EMAIL] To: %s, Magic Link Token: %s\n", email, token)
	return nil
}

func (s *portalAuthService) VerifyMagicLink(ctx context.Context, token string) (string, error) {
	if token == "" {
		return "", fmt.Errorf("%w: token is required", ErrInvalidInput)
	}

	mt, err := s.querier.GetMagicToken(ctx, token)
	if err != nil {
		return "", ErrInvalidToken
	}

	// Token is valid, mark it as used
	if err := s.querier.MarkMagicTokenUsed(ctx, mt.ID); err != nil {
		return "", fmt.Errorf("failed to mark token as used: %w", err)
	}

	// Generate JWT
	claims := jwt.MapClaims{
		"email": mt.Email,
		"sub":   mt.Email,
		"exp":   time.Now().Add(24 * time.Hour).Unix(),
		"iat":   time.Now().Unix(),
	}

	jwtToken := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signedToken, err := jwtToken.SignedString(s.jwtKey)
	if err != nil {
		return "", fmt.Errorf("failed to sign jwt: %w", err)
	}

	return signedToken, nil
}
