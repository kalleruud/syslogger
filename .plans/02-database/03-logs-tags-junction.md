# Feature: Logs-Tags Junction Table

## Overview

Junction table implementing many-to-many relationship between logs and tags. Each row links one log to one tag.

## Architecture Decision

- Composite primary key on (log_id, tag_id)
- Foreign keys with CASCADE delete
- No additional metadata needed
- Enables efficient filtering by tag

## Dependencies

- **Features**: 01-logs-table-schema, 02-tags-table-schema
- **Packages**: drizzle-orm

## Key Files

- `backend/src/db/schema.ts` - Table definition
- `backend/drizzle/` - Migration files

## Implementation Notes

```typescript
logsTags = sqliteTable(
  'logs_tags',
  {
    logId: integer('log_id')
      .notNull()
      .references(() => logs.id, { onDelete: 'cascade' }),
    tagId: integer('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  table => ({
    pk: primaryKey(table.logId, table.tagId),
  })
)
```

- CASCADE delete removes relationships when log/tag deleted
- Index on tagId for filtering logs by tag
- Bulk insert for efficiency when log has multiple tags

## Verification

1. Create log with multiple tags
2. Verify junction table entries created
3. Delete log and verify junction entries removed
4. Query logs by tag and verify correct results
