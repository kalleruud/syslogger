# Feature: Severity Multi-select

## Overview
Dropdown filter allowing selection of multiple severity levels. Filter logs to show only selected severity levels (e.g., only errors and warnings).

## Architecture Decision
- Multi-select dropdown with checkboxes
- All levels selected by default (no filtering)
- Show selected count in button label
- Color-coded severity labels in dropdown

## Dependencies
- **Features**: 06-url-parameter-sync
- **Packages**: shadcn/ui (Popover, Checkbox)

## Key Files
- `frontend/src/components/SeverityFilter.tsx` - Component
- `frontend/src/hooks/useFilters.ts` - Filter state

## Implementation Notes
```tsx
const SEVERITY_LEVELS = [
  { value: 0, label: 'Emergency', color: 'red' },
  { value: 1, label: 'Alert', color: 'red' },
  { value: 2, label: 'Critical', color: 'orange' },
  { value: 3, label: 'Error', color: 'orange' },
  { value: 4, label: 'Warning', color: 'yellow' },
  { value: 5, label: 'Notice', color: 'blue' },
  { value: 6, label: 'Info', color: 'gray' },
  { value: 7, label: 'Debug', color: 'gray' }
]

// Button label
{selected.length === 8 ? 'All Severities' : `${selected.length} Severities`}
```

- Popover with checkbox list
- "Select All" / "Clear All" actions
- Close popover on click outside
- Immediate filter application

## Verification
1. Select/deselect severity levels
2. Verify logs filtered correctly
3. Button label updates with count
4. Selection persists in URL
