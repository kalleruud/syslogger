# Feature: Migrations Setup

## Overview
Database schema migrations using Drizzle-kit. Enables version-controlled schema changes and automatic database setup on first run.

## Architecture Decision
- Use Drizzle-kit for migration generation
- Migrations stored in `backend/drizzle/` directory
- Run migrations automatically on server start
- Support both fresh database and upgrades

## Dependencies
- **Features**: None
- **Packages**: drizzle-orm, drizzle-kit

## Key Files
- `backend/drizzle.config.ts` - Drizzle-kit configuration
- `backend/drizzle/` - Generated migration files
- `backend/src/db/migrate.ts` - Migration runner

## Implementation Notes
```typescript
// drizzle.config.ts
export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  driver: 'better-sqlite3',
  dbCredentials: {
    url: './data/logs.db'
  }
}
```

- Generate migrations: `bunx drizzle-kit generate`
- Push changes: `bunx drizzle-kit push`
- Run on startup: `migrate(db, { migrationsFolder: './drizzle' })`

## Verification
1. Generate migration from schema
2. Run migration on fresh database
3. Modify schema and generate new migration
4. Apply migration to existing database
