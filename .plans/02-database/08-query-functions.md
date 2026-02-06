# Feature: Query Functions

## Overview
Drizzle ORM query functions for all database operations. Type-safe queries with proper filtering, pagination, and relationship loading.

## Architecture Decision
- Use Drizzle query builder for type safety
- Centralize all queries in dedicated module
- Support all filter combinations from API
- Efficient eager loading of related tags

## Dependencies
- **Features**: All table schemas (01-03), 04-performance-indexes
- **Packages**: drizzle-orm

## Key Files
- `backend/src/db/queries.ts` - Query functions
- `backend/src/db/index.ts` - Database connection

## Implementation Notes
```typescript
// Query with filters
async function getLogs(filters: LogFilters) {
  return db.select()
    .from(logs)
    .where(and(
      filters.severity ? inArray(logs.severity, filters.severity) : undefined,
      filters.hostname ? eq(logs.hostname, filters.hostname) : undefined,
      filters.search ? like(logs.message, `%${filters.search}%`) : undefined
    ))
    .orderBy(desc(logs.timestamp))
    .limit(filters.limit ?? 100)
    .offset(filters.offset ?? 0)
}
```

- Filter conditions combined with `and()`
- Undefined conditions are ignored
- Eager load tags with separate query or join
- Return count for pagination

## Verification
1. Query with no filters returns recent logs
2. Each filter correctly limits results
3. Combined filters work correctly
4. Pagination returns correct slices
