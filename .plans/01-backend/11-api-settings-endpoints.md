# Feature: API Settings Endpoints

## Overview
REST API endpoints for reading and updating application settings, primarily retention configuration. Settings persist to `config.json` file.

## Architecture Decision
- GET `/api/settings` returns current configuration
- PUT `/api/settings` updates configuration
- File-based storage in `config.json`
- Atomic write with temp file + rename
- Default values when config file missing

## Dependencies
- **Features**: 16-retention-cleanup-job (consumes retention settings)
- **Packages**: None

## Key Files
- `backend/src/api/settings.ts` - Endpoint handlers
- `backend/src/config/index.ts` - Config file operations
- `backend/config.json` - Persistent storage

## Implementation Notes
- Settings structure: `{ retention: { "0": null, "1": 90, ... } }`
- `null` means keep forever, number is days to retain
- Validate retention values: null or positive integer
- Return 400 for invalid settings
- Create default config if file doesn't exist
- Watch for external config changes (optional)

## Verification
1. GET settings returns current config
2. PUT settings updates config file
3. Verify changes persist across server restart
4. Test validation of invalid values
