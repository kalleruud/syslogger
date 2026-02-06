# Feature: Syslog UDP Receiver

## Overview

Listens for incoming syslog messages on a configurable UDP port (default 5140). This is the primary entry point for all log data into the system, receiving messages from network devices, servers, and containers.

## Architecture Decision

- Use Bun's native `Bun.udpSocket()` API for UDP server
- Single-threaded event loop handles all incoming packets
- Messages are immediately parsed and stored, then broadcast via WebSocket
- Port configurable via `SYSLOG_PORT` environment variable

## Dependencies

- **Features**: 02-rfc5424-parser, 03-rfc3164-parser (for parsing received messages)
- **Packages**: None (uses Bun built-in UDP support)

## Key Files

- `backend/src/syslog/receiver.ts` - UDP server implementation
- `backend/src/index.ts` - Server startup and integration

## Implementation Notes

- UDP is connectionless; handle each datagram independently
- No acknowledgment sent to senders (standard syslog behavior)
- Buffer size should handle typical syslog message sizes (up to 2048 bytes for RFC 3164, 8192+ for RFC 5424)
- Log received message count for monitoring
- Handle malformed packets gracefully without crashing

## Verification

1. Start the server and verify it binds to the configured port
2. Send test messages: `echo "<14>Test message" | nc -u localhost 5140`
3. Confirm messages appear in database and WebSocket clients receive them
