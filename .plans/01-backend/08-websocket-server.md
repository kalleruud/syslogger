# Feature: WebSocket Server

## Overview
Real-time log streaming to connected browser clients using WebSocket. When new syslog messages are received, they are immediately broadcast to all connected clients for live monitoring.

## Architecture Decision
- Use Bun's native WebSocket support (fastest option)
- Pub/sub pattern: all clients receive all new logs
- Client-side filtering (server broadcasts everything)
- JSON message format for easy frontend parsing
- Heartbeat/ping for connection health

## Dependencies
- **Features**: 01-syslog-udp-receiver (source of new logs)
- **Packages**: None (Bun built-in WebSocket)

## Key Files
- `backend/src/websocket/server.ts` - WebSocket server setup
- `backend/src/websocket/broadcast.ts` - Message broadcasting
- `backend/src/index.ts` - Integration with HTTP server

## Implementation Notes
- Upgrade HTTP connections to WebSocket at `/ws` endpoint
- Track connected clients in a Set
- Remove clients on disconnect/error
- Broadcast parsed log with all fields as JSON
- Consider message batching for high-volume scenarios
- Log connection/disconnection events for debugging

## Verification
1. Connect WebSocket client and verify connection established
2. Send syslog message and confirm client receives it
3. Test multiple simultaneous clients
4. Verify clean disconnection handling
