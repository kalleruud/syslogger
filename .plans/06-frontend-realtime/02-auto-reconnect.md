# Feature: Auto-reconnect

## Overview
Automatic WebSocket reconnection with exponential backoff when connection is lost. Ensures resilience against network interruptions.

## Architecture Decision
- Exponential backoff: 1s, 2s, 4s, 8s, 16s, 32s (max)
- Maximum 10 reconnection attempts
- Reset attempt count on successful connection
- Manual reconnect option after max attempts

## Dependencies
- **Features**: 01-websocket-client
- **Packages**: React

## Key Files
- `frontend/src/hooks/useWebSocket.ts` - Reconnection logic

## Implementation Notes
```tsx
const MAX_ATTEMPTS = 10
const BASE_DELAY = 1000

const [attempts, setAttempts] = useState(0)

const connect = useCallback(() => {
  const ws = new WebSocket(url)

  ws.onopen = () => {
    setAttempts(0) // Reset on success
    setStatus('connected')
  }

  ws.onclose = () => {
    setStatus('disconnected')
    if (attempts < MAX_ATTEMPTS) {
      const delay = Math.min(BASE_DELAY * Math.pow(2, attempts), 32000)
      setTimeout(() => {
        setAttempts(a => a + 1)
        connect()
      }, delay)
    }
  }
}, [url, attempts])
```

- Show reconnecting status with attempt count
- Clear timeout on unmount
- Jitter optional to prevent thundering herd

## Verification
1. Disconnect server and verify reconnection attempts
2. Verify exponential delay between attempts
3. Reconnection succeeds when server returns
4. Stops after 10 attempts
