package replication

import (
	"encoding/json"
	"fmt"

	"github.com/jackc/pglogrepl"
	"go.uber.org/zap"
)

// OutboxRow is the canonical JSON structure published to NATS,
// matching the downstream audit-service's OutboxEvent.
type OutboxRow struct {
	ID            string          `json:"id"`
	AggregateType string          `json:"aggregate_type"`
	AggregateID   string          `json:"aggregate_id"`
	ActorID       string          `json:"actor_id"`
	Type          string          `json:"type"`
	Payload       json.RawMessage `json:"payload"`
}

// Decoder maintains a registry of RelationMessages keyed by relation ID
// so that InsertMessages can be decoded into structured JSON.
type Decoder struct {
	relations map[uint32]*pglogrepl.RelationMessageV2
	logger    *zap.Logger
}

// NewDecoder creates a Decoder with an empty relation registry.
func NewDecoder(logger *zap.Logger) *Decoder {
	return &Decoder{
		relations: make(map[uint32]*pglogrepl.RelationMessageV2),
		logger:    logger,
	}
}

// RegisterRelation stores a RelationMessage for later column lookups.
func (d *Decoder) RegisterRelation(msg *pglogrepl.RelationMessageV2) {
	d.relations[msg.RelationID] = msg
	d.logger.Debug("registered relation",
		zap.String("table", msg.RelationName),
		zap.Uint32("relationID", msg.RelationID),
	)
}

// DecodeInsert converts an InsertMessage into a JSON byte array
// by matching tuple columns against the stored RelationMessage.
func (d *Decoder) DecodeInsert(msg *pglogrepl.InsertMessageV2) ([]byte, error) {
	rel, ok := d.relations[msg.RelationID]
	if !ok {
		return nil, fmt.Errorf("unknown relation ID %d", msg.RelationID)
	}

	// Build a column-name → value map from the tuple data.
	values := make(map[string]string, len(msg.Tuple.Columns))
	for i, col := range msg.Tuple.Columns {
		if i >= len(rel.Columns) {
			break
		}
		colName := rel.Columns[i].Name
		switch col.DataType {
		case 't': // text
			values[colName] = string(col.Data)
		case 'n': // null
			values[colName] = ""
		default:
			values[colName] = string(col.Data)
		}
	}

	row := OutboxRow{
		ID:            values["id"],
		AggregateType: values["aggregate_type"],
		AggregateID:   values["aggregate_id"],
		ActorID:       values["actor_id"],
		Type:          values["type"],
		Payload:       json.RawMessage(values["payload"]),
	}

	data, err := json.Marshal(row)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal outbox row: %w", err)
	}

	d.logger.Debug("decoded insert",
		zap.String("id", row.ID),
		zap.String("type", row.Type),
		zap.String("aggregate_type", row.AggregateType),
	)

	return data, nil
}
