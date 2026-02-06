# Feature: SPA Routing

## Overview
Proper handling of client-side routes for the single-page application. All non-API, non-file routes should return index.html so React Router can handle them.

## Architecture Decision
- Check if request is for API route first
- Check if request matches a static file
- All other GET requests return index.html
- Preserve query parameters and fragments

## Dependencies
- **Features**: 12-static-file-serving
- **Packages**: None

## Key Files
- `backend/src/server/router.ts` - Route handling logic
- `backend/src/index.ts` - Request handling

## Implementation Notes
- API routes: `/api/*`, `/ws`
- Static files: check file existence in `frontend/dist`
- Everything else: serve `frontend/dist/index.html`
- Don't modify the URL; client-side router reads it
- Return 404 for API routes that don't exist

## Verification
1. Access `/` - should load app
2. Access `/some/deep/route` - should load app (React handles route)
3. Access `/api/logs` - should return JSON
4. Refresh on deep route - should still work
