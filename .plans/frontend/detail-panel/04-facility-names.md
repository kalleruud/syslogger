# Feature: Facility Names

## Overview

Display numeric syslog facility codes as human-readable names. Makes facility values meaningful without requiring RFC knowledge.

## Architecture Decision

- Map facility numbers 0-23 to standard names
- Show both name and number in detail panel
- Use name in display, number in filters

## Dependencies

- **Features**: 03-field-display
- **Packages**: None

## Key Files

- `frontend/src/utils/syslogFacilities.ts` - Facility mapping
- `frontend/src/components/DetailPanel.tsx` - Usage

## Implementation Notes

```typescript
const FACILITY_NAMES: Record<number, string> = {
  0: 'kernel',
  1: 'user',
  2: 'mail',
  3: 'daemon',
  4: 'auth',
  5: 'syslog',
  6: 'lpr',
  7: 'news',
  8: 'uucp',
  9: 'cron',
  10: 'authpriv',
  11: 'ftp',
  12: 'ntp',
  13: 'audit',
  14: 'alert',
  15: 'clock',
  16: 'local0',
  17: 'local1',
  18: 'local2',
  19: 'local3',
  20: 'local4',
  21: 'local5',
  22: 'local6',
  23: 'local7',
}

// Display: "daemon (3)" or just "daemon"
const formatFacility = (num: number) =>
  `${FACILITY_NAMES[num] ?? 'unknown'} (${num})`
```

## Verification

1. All facility numbers 0-23 show names
2. Unknown numbers show "unknown (N)"
3. Format consistent in detail panel
