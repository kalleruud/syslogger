# Feature: RFC 3164 Parser

## Overview
Parses legacy BSD syslog format (RFC 3164). Many systems and devices still use this older format, especially network equipment and legacy applications.

## Architecture Decision
- Regex-based parsing matching traditional BSD format
- More lenient parsing than RFC 5424 (format varies widely in practice)
- Fall back to this parser when RFC 5424 parsing fails
- Extract: priority, timestamp, hostname, tag/appname, message

## Dependencies
- **Features**: None (standalone parser)
- **Packages**: None (pure TypeScript implementation)

## Key Files
- `backend/src/syslog/parsers/rfc3164.ts` - Parser implementation
- `backend/src/syslog/parsers/index.ts` - Parser selection logic

## Implementation Notes
- RFC 3164 format: `<PRI>TIMESTAMP HOSTNAME TAG: MESSAGE`
- Timestamp is "Mmm dd hh:mm:ss" format (no year, no timezone)
- Hostname may be missing in some implementations
- TAG field often includes process ID in brackets: `appname[1234]`
- Message starts after first colon-space sequence
- No structured data support in this format

## Verification
1. Parse sample RFC 3164 messages from various sources
2. Test timestamp parsing for all months
3. Verify TAG extraction with and without PID
4. Test messages without hostname field
