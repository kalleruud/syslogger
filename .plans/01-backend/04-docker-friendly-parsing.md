# Feature: Docker-friendly Parsing

## Overview
Handle syslog messages from containerized environments where the hostname field may be missing or contain container IDs instead of meaningful hostnames. Docker's syslog driver has specific formatting quirks.

## Architecture Decision
- Detect Docker-style messages by pattern matching
- Container ID as hostname is acceptable; don't try to resolve
- Support messages that skip hostname entirely
- Preserve container name from TAG field when available

## Dependencies
- **Features**: 03-rfc3164-parser (Docker typically uses BSD format)
- **Packages**: None

## Key Files
- `backend/src/syslog/parsers/docker.ts` - Docker-specific parsing logic
- `backend/src/syslog/parsers/index.ts` - Parser selection

## Implementation Notes
- Docker syslog driver format varies by configuration
- May send: `<PRI>TAG[PID]: MESSAGE` (no timestamp, no hostname)
- Container name often in TAG field
- Timestamp should default to receive time when missing
- Some setups include container ID as 12-char hex string
- Support both `--log-opt tag` custom formats and defaults

## Verification
1. Test with actual Docker container logs
2. Verify parsing when hostname is container ID
3. Test messages without timestamp (use receive time)
4. Confirm container name extraction from TAG
