# Feature: Severity Detection

## Overview

When syslog messages lack proper priority encoding or use non-standard formats, extract severity from message text using pattern matching. This ensures all logs have a meaningful severity level for filtering.

## Architecture Decision

- Regex patterns match common severity keywords in message text
- Case-insensitive matching for flexibility
- Check message start and bracketed tags first (higher confidence)
- Default to INFO (6) when no severity detected
- Priority field severity takes precedence over text detection

## Dependencies

- **Features**: 07-tag-extraction (severity keywords may appear as tags)
- **Packages**: None

## Key Files

- `backend/src/syslog/severity.ts` - Severity detection logic
- `backend/src/syslog/parsers/index.ts` - Integration point

## Implementation Notes

- Severity levels: 0=Emergency, 1=Alert, 2=Critical, 3=Error, 4=Warning, 5=Notice, 6=Info, 7=Debug
- Pattern examples: `[ERROR]`, `ERROR:`, `level=error`, `"level":"error"`
- Check for: error, err, warning, warn, info, debug, critical, crit, alert, emergency, emerg, notice
- JSON-formatted messages may have severity in a field
- Don't override valid priority-based severity

## Verification

1. Test detection of all severity keywords
2. Verify case-insensitive matching
3. Confirm priority field takes precedence
4. Test JSON-formatted log messages
