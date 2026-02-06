# Feature: Graceful Shutdown

## Overview

Clean shutdown handling when the server receives termination signals. Properly close database connections, stop accepting new connections, and finish in-flight requests.

## Architecture Decision

- Listen for SIGINT and SIGTERM signals
- Close UDP socket first (stop receiving logs)
- Close WebSocket connections with close frame
- Finish pending database writes
- Close database connection last
- Exit with appropriate code

## Dependencies

- **Features**: All server components
- **Packages**: None

## Key Files

- `backend/src/server/shutdown.ts` - Shutdown handler
- `backend/src/index.ts` - Signal registration

## Implementation Notes

- Register handlers: `process.on('SIGINT', ...)` and `process.on('SIGTERM', ...)`
- Shutdown order: UDP → WebSocket → HTTP → Database
- Timeout for graceful shutdown (5 seconds)
- Force exit after timeout
- Log shutdown progress for debugging
- Return exit code 0 for clean shutdown

## Verification

1. Start server and send SIGINT (Ctrl+C)
2. Verify clean shutdown message
3. Verify database file is not corrupted
4. Test SIGTERM signal (Docker stop)
