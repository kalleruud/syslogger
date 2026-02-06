# Feature: API Tags Endpoint

## Overview
REST API endpoint returning all unique tags extracted from log messages. Used by the frontend to populate the tag filter dropdown.

## Architecture Decision
- GET `/api/tags` returns simple array of tag names
- Tags sorted alphabetically
- No pagination (tag count expected to be manageable)
- Cache response briefly for performance

## Dependencies
- **Features**: 02-database/02-tags-table-schema
- **Packages**: None

## Key Files
- `backend/src/api/tags.ts` - Endpoint handler
- `backend/src/api/routes.ts` - Route registration
- `backend/src/db/queries.ts` - Tag query function

## Implementation Notes
- Query: `SELECT DISTINCT name FROM tags ORDER BY name`
- Response: `["db", "error", "request", "timeout"]`
- Consider adding count per tag for UI display
- In-memory cache with 30-second TTL
- Invalidate cache when new tags are created

## Verification
1. Create logs with various tags
2. Fetch tags and verify all unique tags returned
3. Verify alphabetical sorting
4. Test empty state (no tags)
