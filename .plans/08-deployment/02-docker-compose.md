# Feature: Docker Compose

## Overview

Docker Compose configuration for easy development and deployment. Single command to start the complete stack.

## Architecture Decision

- Single service (all-in-one container)
- Volume for database persistence
- Environment variable configuration
- Port mapping for HTTP and UDP

## Dependencies

- **Features**: 01-dockerfile
- **Packages**: Docker Compose

## Key Files

- `docker-compose.yml` - Compose configuration
- `.env` - Environment variables (optional)

## Implementation Notes

```yaml
version: '3.8'

services:
  syslogger:
    build: .
    container_name: syslogger
    ports:
      - '3000:3000' # HTTP
      - '5140:5140/udp' # Syslog
    volumes:
      - ./data:/app/data # Database persistence
    environment:
      - HTTP_PORT=3000
      - SYSLOG_PORT=5140
      - DB_PATH=/app/data/logs.db
    restart: unless-stopped

volumes:
  data:
```

- Named volume for data persistence
- Restart policy for reliability
- Health check (optional)
- Resource limits (optional)

## Verification

1. `docker-compose up` starts container
2. Database persists across restarts
3. Logs accessible via `docker-compose logs`
4. `docker-compose down` cleans up
