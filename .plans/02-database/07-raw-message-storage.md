# Feature: Raw Message Storage

## Overview
Store the original, unparsed syslog message alongside parsed fields. Enables debugging of parsing issues and full message display in the UI.

## Architecture Decision
- Store raw message as TEXT field in logs table
- Preserve exact bytes received (no normalization)
- Display in log detail panel for debugging
- Enable reprocessing if parser is updated

## Dependencies
- **Features**: 01-logs-table-schema
- **Packages**: None

## Key Files
- `backend/src/db/schema.ts` - Raw field definition
- `backend/src/syslog/receiver.ts` - Message capture

## Implementation Notes
- `raw` column stores original UDP datagram content
- Decode as UTF-8 with replacement for invalid bytes
- Maximum syslog message size: 8KB (RFC 5424)
- Consider compression for storage efficiency (future)
- Useful for debugging parser issues

## Verification
1. Send syslog message with special characters
2. Retrieve raw message and verify exact match
3. Compare parsed fields with raw content
4. Display in UI detail panel
