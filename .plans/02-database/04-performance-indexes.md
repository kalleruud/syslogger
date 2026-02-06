# Feature: Performance Indexes

## Overview
Database indexes on frequently queried columns to ensure fast filtering and sorting operations, even with millions of log entries.

## Architecture Decision
- Index on timestamp for chronological sorting
- Index on severity for level filtering
- Index on hostname for host filtering
- Index on appname for application filtering
- Composite indexes for common filter combinations

## Dependencies
- **Features**: 01-logs-table-schema
- **Packages**: drizzle-orm

## Key Files
- `backend/src/db/schema.ts` - Index definitions
- `backend/drizzle/` - Migration files

## Implementation Notes
```typescript
// Index definitions
timestampIdx = index('idx_logs_timestamp').on(logs.timestamp)
severityIdx = index('idx_logs_severity').on(logs.severity)
hostnameIdx = index('idx_logs_hostname').on(logs.hostname)
appnameIdx = index('idx_logs_appname').on(logs.appname)

// Composite for common queries
severityTimestampIdx = index('idx_logs_severity_timestamp')
  .on(logs.severity, logs.timestamp)
```

- SQLite automatically indexes primary keys
- Avoid over-indexing (slows writes)
- Consider covering indexes for read-heavy queries
- Monitor query plans with EXPLAIN QUERY PLAN

## Verification
1. Insert 100k+ logs
2. Query with filters and verify sub-second response
3. Check EXPLAIN QUERY PLAN shows index usage
4. Compare query time with and without indexes
