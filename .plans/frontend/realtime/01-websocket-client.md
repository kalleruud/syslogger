# Feature: WebSocket Client

## Overview

WebSocket connection to the backend for receiving real-time log updates. New logs appear instantly without polling.

## Architecture Decision

- Native WebSocket API (no library needed)
- Connect to `/ws` endpoint on same origin
- Parse JSON messages from server
- Integrate with React state/context

## Dependencies

- **Features**: 01-backend/08-websocket-server
- **Packages**: React

## Key Files

- `frontend/src/hooks/useWebSocket.ts` - WebSocket hook
- `frontend/src/contexts/LogsContext.tsx` - State integration

## Implementation Notes

```tsx
const useWebSocket = (url: string) => {
  const [status, setStatus] = useState<
    'connecting' | 'connected' | 'disconnected'
  >('connecting')
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const ws = new WebSocket(url)

    ws.onopen = () => setStatus('connected')
    ws.onclose = () => setStatus('disconnected')
    ws.onerror = () => setStatus('disconnected')

    ws.onmessage = event => {
      const log = JSON.parse(event.data)
      appendLog(log)
    }

    wsRef.current = ws
    return () => ws.close()
  }, [url])

  return { status }
}
```

- URL: `ws://${window.location.host}/ws`
- Handle both secure (wss://) and insecure (ws://)
- Cleanup on component unmount

## Verification

1. WebSocket connects on page load
2. New syslog messages appear in real-time
3. Connection status reflects actual state
4. Clean disconnect on page close
