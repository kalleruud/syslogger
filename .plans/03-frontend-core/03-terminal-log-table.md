# Feature: Terminal Log Table

## Overview
Fixed-width character table displaying log entries in a terminal-inspired format. Columns have consistent widths with no gaps between cells.

## Architecture Decision
- TanStack Table for headless table logic
- Fixed character widths for each column
- No cell padding or margins (true terminal feel)
- Monospace font for alignment
- Horizontal scroll for overflow

## Dependencies
- **Features**: 04-virtual-scrolling
- **Packages**: @tanstack/react-table, Tailwind CSS

## Key Files
- `frontend/src/components/LogTable.tsx` - Table component
- `frontend/src/components/LogRow.tsx` - Row rendering
- `frontend/src/hooks/useLogTable.ts` - Table setup

## Implementation Notes
```tsx
// Column widths in characters
const COLUMN_WIDTHS = {
  timestamp: 24,   // "2024-01-15 10:30:45.123"
  severity: 8,     // "WARNING"
  hostname: 16,
  appname: 12,
  facility: 8,
  procid: 8,
  msgid: 12,
  message: 'flex'  // Remaining space
}
```

- Use `ch` units for character-width columns
- Message column takes remaining width
- Truncate with ellipsis for overflow
- No alternating row colors (terminal style)

## Verification
1. Columns align perfectly vertically
2. No gaps between cells
3. Monospace font renders correctly
4. Overflow handled with truncation
