# Feature: CORS Support

## Overview

Enable Cross-Origin Resource Sharing for development scenarios where frontend runs on a different port than the backend (e.g., Vite dev server on 5173, backend on 3000).

## Architecture Decision

- CORS headers only in development mode
- Allow all origins in development
- Production serves same-origin, no CORS needed
- Support preflight OPTIONS requests

## Dependencies

- **Features**: None
- **Packages**: None

## Key Files

- `backend/src/server/cors.ts` - CORS middleware
- `backend/src/index.ts` - Middleware integration

## Implementation Notes

- Headers: `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`
- Handle OPTIONS preflight requests with 204 response
- Allow methods: GET, POST, PUT, DELETE, OPTIONS
- Allow headers: Content-Type, Authorization
- Only enable when `NODE_ENV !== 'production'`

## Verification

1. Start frontend dev server and backend separately
2. Verify API calls work cross-origin
3. Check OPTIONS preflight requests succeed
4. Verify no CORS headers in production build
