package worker

import "github.com/google/uuid"

// uuidV7String returns a new UUIDv7 as a string.
// Placed in a separate file so the shim can be swapped in tests.
func uuidV7String() (string, error) {
	id, err := uuid.NewV7()
	if err != nil {
		return "", err
	}
	return id.String(), nil
}
