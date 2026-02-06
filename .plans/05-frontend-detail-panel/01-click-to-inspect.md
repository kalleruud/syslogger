# Feature: Click to Inspect

## Overview
Clicking any log row opens a detail panel showing full information about that log entry. The panel appears between the control bar and log table.

## Architecture Decision
- Single click selects and opens detail panel
- Store selected log ID in state
- Visual highlight on selected row
- Same click on selected row closes panel

## Dependencies
- **Features**: 03-frontend-core/03-terminal-log-table
- **Packages**: React

## Key Files
- `frontend/src/components/LogTable.tsx` - Click handler
- `frontend/src/components/DetailPanel.tsx` - Panel component
- `frontend/src/hooks/useSelectedLog.ts` - Selection state

## Implementation Notes
```tsx
const [selectedLogId, setSelectedLogId] = useState<number | null>(null)

const handleRowClick = (log: Log) => {
  setSelectedLogId(prev => prev === log.id ? null : log.id)
}

// Row highlight for selected
<LogRow
  className={log.id === selectedLogId ? 'bg-gray-800' : ''}
  onClick={() => handleRowClick(log)}
/>
```

- Cursor pointer on rows indicates clickable
- Subtle hover effect on rows
- Selected row has distinct background
- Click outside panel or on same row closes it

## Verification
1. Click row and verify panel opens
2. Selected row is visually highlighted
3. Click same row again closes panel
4. Click different row switches selection
