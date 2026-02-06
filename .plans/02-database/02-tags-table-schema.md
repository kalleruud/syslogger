# Feature: Tags Table Schema

## Overview

Table storing unique tag names extracted from log messages. Tags are normalized (lowercase, trimmed) and deduplicated across all logs.

## Architecture Decision

- Separate tags table enables efficient tag queries
- Unique constraint on name prevents duplicates
- Many-to-many relationship with logs via junction table
- Keep tag names short (max 50 characters)

## Dependencies

- **Features**: 06-migrations-setup
- **Packages**: drizzle-orm

## Key Files

- `backend/src/db/schema.ts` - Table definition
- `backend/drizzle/` - Migration files

## Implementation Notes

```typescript
tags = sqliteTable('tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
})
```

- Tag names are always lowercase
- Index on name for fast lookups
- Insert with `INSERT OR IGNORE` for deduplication

## Verification

1. Insert tag and verify unique constraint works
2. Attempt duplicate insert and verify no error (ignored)
3. Query all tags and verify sorted alphabetically
