package config

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/hashicorp/vault/api"
)

// SecretManager wraps the Vault API client for reading secrets.
type SecretManager struct {
	client    *api.Client
	transport *http.Transport // retained for Close()
}

// NewSecretManager creates a Vault client pointed at the given address
// and authenticated with the provided token.
func NewSecretManager(address, token string) (*SecretManager, error) {
	cfg := api.DefaultConfig()
	cfg.Address = address

	// Use an explicit transport so we can close idle connections on shutdown,
	// preventing the keep-alive goroutines from becoming zombies.
	transport := &http.Transport{
		MaxIdleConns:        10,
		IdleConnTimeout:     30 * time.Second,
		TLSHandshakeTimeout: 10 * time.Second,
	}
	cfg.HttpClient = &http.Client{
		Transport: transport,
		Timeout:   30 * time.Second,
	}

	client, err := api.NewClient(cfg)
	if err != nil {
		return nil, fmt.Errorf("vault client initialization failed: %w", err)
	}
	client.SetToken(token)

	return &SecretManager{client: client, transport: transport}, nil
}

// NewSecretManagerWithContext is like NewSecretManager but ties the client
// lifecycle to the given context.  When ctx is cancelled the idle connections
// are drained automatically, eliminating zombie keep-alive goroutines.
func NewSecretManagerWithContext(ctx context.Context, address, token string) (*SecretManager, error) {
	sm, err := NewSecretManager(address, token)
	if err != nil {
		return nil, err
	}
	go func() {
		<-ctx.Done()
		sm.Close()
	}()
	return sm, nil
}

// Close drains idle connections on the underlying HTTP transport.
// Call this during service shutdown (or use NewSecretManagerWithContext).
func (s *SecretManager) Close() {
	if s.transport != nil {
		s.transport.CloseIdleConnections()
	}
}

// GetSecret reads a secret at the given path and returns the raw data map.
// For KV v2 backends the caller must unwrap the nested "data" key.
func (s *SecretManager) GetSecret(path string) (map[string]interface{}, error) {
	secret, err := s.client.Logical().Read(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read secret at %s: %w", path, err)
	}
	if secret == nil || secret.Data == nil {
		return nil, fmt.Errorf("no data found at %s", path)
	}
	return secret.Data, nil
}

// GetKV2 is a convenience wrapper that reads from a KV v2 backend and
// returns the inner "data" map, unwrapping the v2 envelope automatically.
func (s *SecretManager) GetKV2(path string) (map[string]interface{}, error) {
	raw, err := s.GetSecret(path)
	if err != nil {
		return nil, err
	}
	data, ok := raw["data"].(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("unexpected data format at %s", path)
	}
	return data, nil
}
