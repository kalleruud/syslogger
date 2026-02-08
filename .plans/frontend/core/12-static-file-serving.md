# Feature: Static File Serving

## Overview

Serve the compiled React frontend from the backend server. The frontend is built into static files that the backend serves to browsers.

## Architecture Decision

- Serve files from `frontend/dist` directory
- Use Bun's built-in static file serving
- Set appropriate cache headers
- Gzip compression for text files
- Serve index.html for SPA routes

## Dependencies

- **Features**: 13-spa-routing
- **Packages**: None (Bun built-in)

## Key Files

- `backend/src/server/static.ts` - Static file handler
- `backend/src/index.ts` - Server configuration
- `frontend/dist/` - Built frontend files

## Implementation Notes

- Check if file exists in `frontend/dist`
- Set Content-Type based on file extension
- Cache headers: long cache for hashed assets, no-cache for index.html
- Fallback to index.html for non-file routes (SPA)
- Don't serve dotfiles or source maps in production

## Verification

1. Build frontend and start backend
2. Access root URL and verify app loads
3. Verify CSS/JS assets load correctly
4. Check cache headers on responses
