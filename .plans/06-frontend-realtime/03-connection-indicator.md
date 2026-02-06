# Feature: Connection Indicator

## Overview

Visual indicator showing WebSocket connection status. Users know at a glance if real-time updates are working.

## Architecture Decision

- Small indicator in control bar
- Color-coded: green (connected), yellow (connecting), red (disconnected)
- Pulse animation when connected for "live" feel
- Tooltip with status details

## Dependencies

- **Features**: 01-websocket-client
- **Packages**: Tailwind CSS

## Key Files

- `frontend/src/components/ConnectionIndicator.tsx` - Component
- `frontend/src/hooks/useWebSocket.ts` - Status source

## Implementation Notes

```tsx
const statusConfig = {
  connected: {
    color: 'bg-green-500',
    pulse: true,
    label: 'Connected'
  },
  connecting: {
    color: 'bg-yellow-500',
    pulse: false,
    label: 'Connecting...'
  },
  disconnected: {
    color: 'bg-red-500',
    pulse: false,
    label: 'Disconnected'
  }
}

<div className="flex items-center gap-2">
  <span
    className={cn(
      'h-2 w-2 rounded-full',
      config.color,
      config.pulse && 'animate-pulse'
    )}
  />
  <span className="text-xs text-gray-500">{config.label}</span>
</div>
```

- Position: right side of control bar
- Click to force reconnect (optional)
- Show reconnect attempt count when applicable

## Verification

1. Green indicator when connected
2. Yellow during initial connection
3. Red when disconnected
4. Pulse animation visible
