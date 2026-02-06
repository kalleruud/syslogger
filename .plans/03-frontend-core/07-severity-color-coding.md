# Feature: Severity Color Coding

## Overview

Visual distinction of log entries by severity level using color coding. Critical issues immediately visible with red/orange colors, informational logs in cooler colors.

## Architecture Decision

- Color severity text/background in table rows
- Consistent color scheme across UI
- Accessible contrast ratios
- Match traditional syslog color conventions

## Dependencies

- **Features**: 03-terminal-log-table
- **Packages**: Tailwind CSS

## Key Files

- `frontend/src/utils/severityColors.ts` - Color mapping
- `frontend/src/components/LogRow.tsx` - Color application

## Implementation Notes

```typescript
const SEVERITY_COLORS = {
  0: 'text-red-500 bg-red-950', // Emergency
  1: 'text-red-400 bg-red-950', // Alert
  2: 'text-orange-500 bg-orange-950', // Critical
  3: 'text-orange-400', // Error
  4: 'text-yellow-400', // Warning
  5: 'text-blue-400', // Notice
  6: 'text-gray-400', // Info
  7: 'text-gray-500', // Debug
}
```

- Emergency/Alert: red with background highlight
- Critical/Error: orange shades
- Warning: yellow
- Notice/Info/Debug: blue to gray gradient
- Consider colorblind-friendly option

## Verification

1. Each severity level has distinct color
2. Colors visible on dark background
3. Sufficient contrast for readability
4. Colors consistent across all views
