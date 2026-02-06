# Feature: RFC 5424 Parser

## Overview

Parses modern structured syslog messages following RFC 5424 specification. This format includes structured data elements, precise timestamps with timezone, and clearly defined fields.

## Architecture Decision

- Regex-based parsing for performance (avoid full grammar parser overhead)
- Extract all standard fields: priority, version, timestamp, hostname, appname, procid, msgid, structured-data, message
- Calculate facility and severity from priority value
- Return typed ParsedLog object

## Dependencies

- **Features**: None (standalone parser)
- **Packages**: None (pure TypeScript implementation)

## Key Files

- `backend/src/syslog/parsers/rfc5424.ts` - Parser implementation
- `backend/src/syslog/types.ts` - Shared types

## Implementation Notes

- RFC 5424 format: `<PRI>VERSION TIMESTAMP HOSTNAME APPNAME PROCID MSGID STRUCTURED-DATA MSG`
- Priority = (Facility \* 8) + Severity
- Structured data can be complex; store as string initially, parse on demand
- Timestamps are ISO 8601 format with optional microseconds and timezone
- Handle NILVALUE (`-`) for optional fields
- Message may be UTF-8 or contain BOM marker

## Verification

1. Parse sample RFC 5424 messages and verify all fields extracted correctly
2. Test edge cases: NILVALUE fields, structured data, Unicode messages
3. Verify facility/severity calculation: `<165>` = facility 20, severity 5
