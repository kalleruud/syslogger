# Feature: WAL Mode

## Overview
Enable Write-Ahead Logging mode in SQLite for better concurrent read/write performance. Essential for a logging application with continuous writes and concurrent reads.

## Architecture Decision
- Enable WAL mode at database connection time
- WAL allows readers and writers to work simultaneously
- Better write performance for high-throughput scenarios
- Checkpoint automatically or on clean shutdown

## Dependencies
- **Features**: 06-migrations-setup
- **Packages**: None (SQLite feature)

## Key Files
- `backend/src/db/index.ts` - Database initialization
- `backend/src/db/config.ts` - SQLite configuration

## Implementation Notes
```typescript
// Enable WAL mode on connection
db.run('PRAGMA journal_mode = WAL')
db.run('PRAGMA synchronous = NORMAL')
db.run('PRAGMA busy_timeout = 5000')
```

- `journal_mode = WAL` enables write-ahead logging
- `synchronous = NORMAL` balances safety and speed
- `busy_timeout` prevents "database locked" errors
- WAL creates `-wal` and `-shm` files alongside database
- Checkpoint consolidates WAL into main database

## Verification
1. Check journal_mode after connection: `PRAGMA journal_mode`
2. Verify `-wal` file created after writes
3. Test concurrent read while writing
4. Verify no "database locked" errors under load
