# Feature: Field Extraction

## Overview
Extract all standard syslog fields from parsed messages into a consistent structure for database storage. Normalize field values and handle missing fields gracefully.

## Architecture Decision
- Define canonical ParsedLog type with all possible fields
- Normalize timestamps to ISO 8601 format
- Map facility numbers to names for display
- Store both parsed fields and raw message
- Use null for missing optional fields, not empty strings

## Dependencies
- **Features**: 02-rfc5424-parser, 03-rfc3164-parser
- **Packages**: None

## Key Files
- `backend/src/syslog/types.ts` - ParsedLog type definition
- `backend/src/syslog/normalize.ts` - Field normalization

## Implementation Notes
- Required fields: timestamp, severity, message
- Optional fields: facility, hostname, appname, procid, msgid, structured_data
- Facility values: 0-23 (kernel, user, mail, daemon, auth, syslog, lpr, news, uucp, cron, authpriv, ftp, ntp, audit, alert, clock, local0-7)
- Timestamp normalization: convert all formats to ISO 8601 with timezone
- For RFC 3164 timestamps without year, use current year (handle year rollover)

## Verification
1. Verify all fields extracted from RFC 5424 messages
2. Verify all fields extracted from RFC 3164 messages
3. Test timestamp normalization across formats
4. Confirm null handling for missing fields
