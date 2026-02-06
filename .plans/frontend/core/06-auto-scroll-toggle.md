# Feature: Auto-scroll Toggle

## Overview

Toggle button that enables automatic scrolling to show new logs as they arrive via WebSocket. When enabled, the view stays at the bottom; when disabled, user can browse history.

## Architecture Decision

- Toggle button in control bar
- Auto-scroll on by default
- Disable when user scrolls up manually
- Re-enable with button or scroll to bottom

## Dependencies

- **Features**: 06-frontend-realtime/01-websocket-client
- **Packages**: React

## Key Files

- `frontend/src/components/AutoScrollToggle.tsx` - Toggle button
- `frontend/src/hooks/useAutoScroll.ts` - Scroll behavior

## Implementation Notes

```tsx
// Auto-disable when user scrolls up
const handleScroll = () => {
  const isAtBottom =
    container.scrollHeight - container.scrollTop <= container.clientHeight + 50
  if (!isAtBottom && autoScroll) {
    setAutoScroll(false)
  }
}

// Scroll to bottom when new logs arrive
useEffect(() => {
  if (autoScroll && newLogs.length > 0) {
    container.scrollTo({ top: container.scrollHeight })
  }
}, [logs, autoScroll])
```

- Visual indicator when auto-scroll enabled
- Threshold of ~50px for "at bottom" detection
- Smooth scroll animation optional
- Keyboard shortcut for toggle (e.g., End key)

## Verification

1. New logs scroll into view when enabled
2. Scrolling up disables auto-scroll
3. Toggle button re-enables
4. Scrolling to bottom re-enables
