# Feature: API Logs Endpoint

## Overview
REST API endpoint for fetching historical logs with filtering and pagination. Supports all filter combinations used by the frontend UI.

## Architecture Decision
- GET `/api/logs` with query parameters
- Pagination via limit/offset (cursor-based not needed for this use case)
- All filters are optional and combinable
- Return logs in reverse chronological order (newest first)
- Include related tags in response

## Dependencies
- **Features**: 02-database/08-query-functions
- **Packages**: None

## Key Files
- `backend/src/api/logs.ts` - Endpoint handler
- `backend/src/api/routes.ts` - Route registration
- `backend/src/db/queries.ts` - Database query functions

## Implementation Notes
- Query params: `limit`, `offset`, `severity`, `hostname`, `appname`, `tags`, `search`
- `severity` and `appname` accept comma-separated values
- `search` performs LIKE query on message, appname, hostname
- `tags` filters logs that have ALL specified tags
- Default limit: 100, max limit: 1000
- Return total count header for pagination UI

## Verification
1. Fetch logs without filters
2. Test each filter individually
3. Test combined filters
4. Verify pagination with limit/offset
5. Test search functionality
