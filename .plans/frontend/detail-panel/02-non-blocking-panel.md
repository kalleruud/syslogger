# Feature: Non-blocking Panel

## Overview

The detail panel appears inline without blocking interaction with the log table. Users can continue scrolling, clicking, and filtering while the panel is open.

## Architecture Decision

- Panel inserted between control bar and table
- Table height adjusts to accommodate panel
- No modal overlay or backdrop
- Scroll and interactions work normally

## Dependencies

- **Features**: 01-click-to-inspect, 03-frontend-core/01-spa-layout
- **Packages**: React

## Key Files

- `frontend/src/App.tsx` - Layout with conditional panel
- `frontend/src/components/DetailPanel.tsx` - Panel component

## Implementation Notes

```tsx
<div className='flex h-screen flex-col'>
  <ControlBar />
  {selectedLog && (
    <DetailPanel log={selectedLog} onClose={() => setSelectedLogId(null)} />
  )}
  <LogTable className='flex-1 overflow-auto' />
</div>
```

- Flexbox layout auto-adjusts heights
- Panel has max-height to prevent overwhelming
- Scrollable panel content if needed
- Close button in panel header

## Verification

1. Open panel and scroll log table
2. Click rows while panel is open
3. Apply filters while panel is open
4. Panel height doesn't block entire table
