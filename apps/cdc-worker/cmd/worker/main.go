package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/jackc/pglogrepl"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgproto3"
	"go.uber.org/zap"

	"github.com/arc-self/apps/cdc-worker/internal/replication"
	"github.com/arc-self/packages/go-core/config"
	"github.com/arc-self/packages/go-core/natsclient"
)

const (
	slotName        = "outbox_slot"
	publicationName = "outbox_pub"
	outputPlugin    = "pgoutput"
	standbyTimeout  = 10 * time.Second
)

func main() {
	logger, _ := zap.NewProduction()
	defer logger.Sync()

	// --- Vault Secret Loading ---
	vaultAddr := os.Getenv("VAULT_ADDR")
	if vaultAddr == "" {
		vaultAddr = "http://localhost:8200"
	}
	vaultToken := os.Getenv("VAULT_TOKEN")
	if vaultToken == "" {
		vaultToken = "root"
	}
	secretPath := os.Getenv("VAULT_SECRET_PATH")
	if secretPath == "" {
		secretPath = "secret/data/arc/cdc-worker"
	}

	vaultManager, err := config.NewSecretManager(vaultAddr, vaultToken)
	if err != nil {
		logger.Fatal("Vault connection failed", zap.Error(err))
	}

	secrets, err := vaultManager.GetKV2(secretPath)
	if err != nil {
		logger.Fatal("Failed to load secrets from Vault", zap.Error(err))
	}

	pgURL := secrets["PG_URL"].(string)
	natsURL := secrets["NATS_URL"].(string)

	// pgconn (replication connection) needs replication=database in the DSN.
	// pgx (normal query connection) does NOT accept that param — it causes a
	// "syntax error at or near" postgres error.
	// Allow an explicit PG_REPLICATION_URL override; otherwise derive it by
	// appending the param to PG_URL and use the plain PG_URL for queries.
	pgReplicationURL := pgURL
	if v, ok := secrets["PG_REPLICATION_URL"]; ok {
		pgReplicationURL = v.(string)
	} else {
		// Append replication=database if not already present
		if !strings.Contains(pgURL, "replication=") {
			if strings.Contains(pgURL, "?") {
				pgReplicationURL = pgURL + "&replication=database"
			} else {
				pgReplicationURL = pgURL + "?replication=database"
			}
		}
	}
	// Strip replication=database from pgURL for normal pgx queries
	pgQueryURL := strings.ReplaceAll(pgURL, "?replication=database&", "?")
	pgQueryURL = strings.ReplaceAll(pgQueryURL, "&replication=database", "")
	pgQueryURL = strings.ReplaceAll(pgQueryURL, "?replication=database", "")


	// --- Graceful Shutdown Context ---
	// Fixes FLAW-2.4: the original loop ran with context.Background() and
	// had no signal handler, so deferred NATS/conn closes never ran cleanly.
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	// --- NATS JetStream ---
	natsClient, err := natsclient.NewClient(natsURL, logger)
	if err != nil {
		logger.Fatal("NATS connection failed", zap.Error(err))
	}
	defer natsClient.Close()

	if err := natsClient.ProvisionStreams(); err != nil {
		logger.Fatal("NATS stream provisioning failed", zap.Error(err))
	}

	// --- Postgres Replication Connection ---
	conn, err := pgconn.Connect(ctx, pgReplicationURL)
	if err != nil {
		logger.Fatal("failed to connect to postgres for replication", zap.Error(err))
	}
	defer conn.Close(ctx)
	logger.Info("connected to postgres for logical replication")

	// --- Create Replication Slot (idempotent) ---
	_, err = pglogrepl.CreateReplicationSlot(ctx, conn, slotName, outputPlugin,
		pglogrepl.CreateReplicationSlotOptions{Temporary: false},
	)
	if err != nil {
		logger.Warn("replication slot creation", zap.Error(err))
	} else {
		logger.Info("replication slot created", zap.String("slot", slotName))
	}

	// --- Start Replication ---
	sysident, err := pglogrepl.IdentifySystem(ctx, conn)
	if err != nil {
		logger.Fatal("IdentifySystem failed", zap.Error(err))
	}
	logger.Info("system identified",
		zap.String("systemID", sysident.SystemID),
		zap.String("timeline", fmt.Sprintf("%d", sysident.Timeline)),
		zap.String("xLogPos", sysident.XLogPos.String()),
	)

	// --- Resolve the confirmed flush LSN for this slot ---
	// Fixes FLAW-4.7: using sysident.XLogPos (the current WAL tip) as the
	// start position means all events between the last confirmed flush LSN
	// and now are permanently skipped on restart.
	//
	// We use a separate standard pgx connection to query pg_replication_slots
	// because the logical replication connection (pgconn) can only carry WAL
	// protocol messages and does not support SQL queries.
	var confirmedLSNStr *string // pointer — detects NULL from pg_replication_slots
	pgxConn, err := pgx.Connect(ctx, pgQueryURL)
	if err != nil {
		logger.Fatal("failed to open pgx connection for LSN resolution", zap.Error(err))
	}
	queryErr := pgxConn.QueryRow(ctx,
		"SELECT confirmed_flush_lsn::text FROM pg_replication_slots WHERE slot_name = $1",
		slotName,
	).Scan(&confirmedLSNStr)
	pgxConn.Close(ctx)
	if queryErr != nil {
		logger.Warn("LSN query failed, will use sysident.XLogPos", zap.Error(queryErr))
	}

	var startLSN pglogrepl.LSN
	if confirmedLSNStr != nil && *confirmedLSNStr != "" {
		startLSN, err = pglogrepl.ParseLSN(*confirmedLSNStr)
		if err != nil {
			logger.Warn("failed to parse confirmed_flush_lsn, falling back to sysident.XLogPos",
				zap.String("lsn", *confirmedLSNStr), zap.Error(err))
			startLSN = sysident.XLogPos
		} else {
			logger.Info("resuming replication from confirmed_flush_lsn",
				zap.String("lsn", *confirmedLSNStr))
		}
	} else {
		// Slot is brand new — no confirmed LSN yet; start from the system position.
		startLSN = sysident.XLogPos
		logger.Info("new slot: starting replication from sysident.XLogPos",
			zap.String("lsn", startLSN.String()))
	}

	pluginArgs := []string{
		"proto_version '2'",
		fmt.Sprintf("publication_names '%s'", publicationName),
	}

	err = pglogrepl.StartReplication(ctx, conn, slotName, startLSN,
		pglogrepl.StartReplicationOptions{PluginArgs: pluginArgs},
	)
	if err != nil {
		logger.Fatal("StartReplication failed", zap.Error(err))
	}
	logger.Info("logical replication started",
		zap.String("slot", slotName),
		zap.String("publication", publicationName),
	)

	// --- Replication Loop ---
	decoder := replication.NewDecoder(logger)
	clientXLogPos := startLSN
	nextStandbyDeadline := time.Now().Add(standbyTimeout)

	for {
		// Fixes FLAW-2.4: check for context cancellation (SIGTERM/SIGINT)
		// so the loop exits cleanly and deferred closes run.
		if ctx.Err() != nil {
			logger.Info("CDC worker shutting down gracefully")
			return
		}

		if time.Now().After(nextStandbyDeadline) {
			err = pglogrepl.SendStandbyStatusUpdate(ctx, conn,
				pglogrepl.StandbyStatusUpdate{WALWritePosition: clientXLogPos},
			)
			if err != nil {
				logger.Error("StandbyStatusUpdate failed", zap.Error(err))
			}
			nextStandbyDeadline = time.Now().Add(standbyTimeout)
		}

		rawMsg, err := conn.ReceiveMessage(ctx)
		if err != nil {
			logger.Error("ReceiveMessage failed", zap.Error(err))
			continue
		}

		errResp, ok := rawMsg.(*pgproto3.ErrorResponse)
		if ok {
			logger.Fatal("postgres WAL error",
				zap.String("severity", errResp.Severity),
				zap.String("message", errResp.Message),
			)
		}

		copyData, ok := rawMsg.(*pgproto3.CopyData)
		if !ok {
			continue
		}

		switch copyData.Data[0] {
		case pglogrepl.XLogDataByteID:
			xld, err := pglogrepl.ParseXLogData(copyData.Data[1:])
			if err != nil {
				logger.Error("ParseXLogData failed", zap.Error(err))
				continue
			}

			logicalMsg, err := pglogrepl.ParseV2(xld.WALData, false)
			if err != nil {
				logger.Error("ParseV2 failed", zap.Error(err))
				continue
			}

			switch msg := logicalMsg.(type) {
			case *pglogrepl.RelationMessageV2:
				decoder.RegisterRelation(msg)

			case *pglogrepl.InsertMessageV2:
				jsonPayload, err := decoder.DecodeInsert(msg)
				if err != nil {
					logger.Error("DecodeInsert failed", zap.Error(err))
					continue
				}

				_, err = natsClient.JS.Publish("outbox.abc", jsonPayload)
				if err != nil {
					logger.Error("NATS publish failed", zap.Error(err))
				} else {
					logger.Info("event published to NATS",
						zap.String("subject", "outbox.abc"),
						zap.Int("bytes", len(jsonPayload)),
					)
				}
			}

			clientXLogPos = xld.WALStart + pglogrepl.LSN(len(xld.WALData))

		case pglogrepl.PrimaryKeepaliveMessageByteID:
			pkm, err := pglogrepl.ParsePrimaryKeepaliveMessage(copyData.Data[1:])
			if err != nil {
				logger.Error("ParsePrimaryKeepaliveMessage failed", zap.Error(err))
				continue
			}
			if pkm.ReplyRequested {
				nextStandbyDeadline = time.Time{} // force immediate reply
			}

		default:
			logger.Warn("unknown copy data type", zap.Uint8("type", copyData.Data[0]))
		}
	}
}
