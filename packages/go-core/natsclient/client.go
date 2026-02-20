package natsclient

import (
	"fmt"

	"github.com/nats-io/nats.go"
	"go.uber.org/zap"
)

// Client wraps a NATS connection and its JetStream context.
type Client struct {
	Conn *nats.Conn
	JS   nats.JetStreamContext
	Log  *zap.Logger
}

// NewClient connects to NATS and initialises a JetStream context.
func NewClient(url string, logger *zap.Logger) (*Client, error) {
	nc, err := nats.Connect(url, nats.RetryOnFailedConnect(true), nats.MaxReconnects(-1))
	if err != nil {
		return nil, fmt.Errorf("failed to connect to NATS: %w", err)
	}

	js, err := nc.JetStream()
	if err != nil {
		nc.Close()
		return nil, fmt.Errorf("failed to initialize JetStream: %w", err)
	}

	logger.Info("NATS JetStream connected", zap.String("url", url))
	return &Client{Conn: nc, JS: js, Log: logger}, nil
}

// Close drains and closes the underlying NATS connection.
// Drain() flushes all pending JetStream publish acknowledgments and
// outstanding subscription deliveries before closing — unlike Close()
// which drops in-flight messages immediately.
// Fixes: FLAW-4.8 — previously used Close() which dropped in-flight publishes.
func (c *Client) Close() {
	if c.Conn != nil {
		// Drain blocks until all messages are flushed; fall back to Close
		// if Drain itself errors (e.g. already disconnected).
		if err := c.Conn.Drain(); err != nil {
			c.Conn.Close()
		}
	}
}
