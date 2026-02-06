# Feature: Logs Table Schema

## Overview

Primary table storing all parsed syslog messages. Each row represents one log entry with all extracted fields and metadata.

## Architecture Decision

- Use SQLite with Drizzle ORM for type safety
- Auto-incrementing integer primary key for efficient indexing
- Store timestamp as ISO 8601 string for readability and sorting
- Nullable fields for optional syslog values
- Store raw message for debugging/reprocessing

## Dependencies

- **Features**: 06-migrations-setup
- **Packages**: drizzle-orm, better-sqlite3 (via Bun)

## Key Files

- `backend/src/db/schema.ts` - Table definition
- `backend/drizzle/` - Migration files

## Implementation Notes

```typescript
// Core schema structure
logs = sqliteTable('logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  timestamp: text('timestamp').notNull(),
  severity: integer('severity').notNull(),
  facility: integer('facility'),
  hostname: text('hostname'),
  appname: text('appname'),
  procid: text('procid'),
  msgid: text('msgid'),
  message: text('message').notNull(),
  raw: text('raw').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
})
```

## Verification

1. Run migrations and verify table created
2. Insert sample log and verify all fields stored
3. Query logs and verify data integrity
