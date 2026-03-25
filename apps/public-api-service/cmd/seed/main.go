// seed populates Redis with a demo banner configuration for local development.
// Usage: REDIS_URL=redis://localhost:6379 go run apps/public-api-service/cmd/seed/main.go
package main

import (
	"context"
	"fmt"
	"os"

	"github.com/redis/go-redis/v9"
)

const bannerJSON = `{
  "banner": {
    "enabled": true,
    "title": "We respect your privacy",
    "description": "We use cookies and collect data for the following purposes. Your consent is required before you can submit any forms on this page.",
    "purposes": [
      {"id": "strictly_necessary", "label": "Strictly Necessary", "description": "Essential for the website to function. Cannot be disabled.", "required": true},
      {"id": "functional",         "label": "Functional",         "description": "Enables enhanced functionality like live chat and form submissions.", "required": true},
      {"id": "analytics",          "label": "Analytics",          "description": "Helps us understand how visitors interact with our website.", "required": false},
      {"id": "marketing",          "label": "Marketing",          "description": "Used to deliver relevant ads and measure campaign effectiveness.", "required": false}
    ]
  },
  "rules": [],
  "categories": ["strictly_necessary", "functional", "analytics", "marketing"]
}`

func main() {
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "redis://localhost:6379"
	}

	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to parse REDIS_URL: %v\n", err)
		os.Exit(1)
	}

	rdb := redis.NewClient(opts)
	defer rdb.Close()
	ctx := context.Background()

	// Keys: widget:banner:{org_id}:{domain}
	// Seed the demo API key for both localhost and 127.0.0.1
	const demoAPIKey = "f8c965ecdf3499ed9fb3343a303b8f9df5ff01e4746c4dd562f86d9635cb47df"
	domains := []string{"localhost", "127.0.0.1", "arc.rnrtechs.com"}

	for _, domain := range domains {
		key := fmt.Sprintf("widget:banner:%s:%s", demoAPIKey, domain)
		if err := rdb.Set(ctx, key, bannerJSON, 0).Err(); err != nil {
			fmt.Fprintf(os.Stderr, "failed to SET %s: %v\n", key, err)
			os.Exit(1)
		}
		fmt.Printf("✅ Seeded key: %s\n", key)
	}

	fmt.Println("Done. Banner config is now available in Redis.")
}
