-- Down Migration for Breaches and Audit Logs

DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS breaches CASCADE;
