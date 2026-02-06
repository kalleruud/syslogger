# Feature: Column Configuration

## Overview
Show/hide table columns via a popover menu in the control bar. Users can customize which fields are visible based on their needs.

## Architecture Decision
- Popover menu with checkboxes for each column
- State persisted in localStorage
- Message column always visible (can't hide)
- Column order fixed (matches schema order)

## Dependencies
- **Features**: 03-terminal-log-table
- **Packages**: shadcn/ui (Popover, Checkbox)

## Key Files
- `frontend/src/components/ColumnToggle.tsx` - Popover component
- `frontend/src/hooks/useColumnVisibility.ts` - State management
- `frontend/src/utils/localStorage.ts` - Persistence

## Implementation Notes
```tsx
const COLUMNS = [
  { id: 'timestamp', label: 'Timestamp', default: true },
  { id: 'severity', label: 'Severity', default: true },
  { id: 'hostname', label: 'Hostname', default: true },
  { id: 'appname', label: 'Application', default: true },
  { id: 'facility', label: 'Facility', default: false },
  { id: 'procid', label: 'ProcID', default: false },
  { id: 'msgid', label: 'MsgID', default: false },
  { id: 'message', label: 'Message', default: true, required: true }
]
```

- Button with Columns icon
- Popover with list of toggles
- Disabled checkbox for required columns
- Apply changes immediately

## Verification
1. Toggle visibility of each column
2. Changes reflected immediately in table
3. Settings persist across page reload
4. Message column cannot be hidden
