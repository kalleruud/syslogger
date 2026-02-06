# Feature: Dockerfile

## Overview

Docker image definition for containerized deployment. Multi-stage build for optimal image size and build caching.

## Architecture Decision

- Multi-stage build: build stage + runtime stage
- Bun as both build tool and runtime
- Include compiled frontend in image
- Minimal runtime image size

## Dependencies

- **Features**: 03-multi-stage-build
- **Packages**: Docker

## Key Files

- `Dockerfile` - Image definition
- `.dockerignore` - Exclude files from build

## Implementation Notes

```dockerfile
# Build stage
FROM oven/bun:1 AS builder
WORKDIR /app

# Install dependencies
COPY package.json bun.lockb ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN bun install

# Build frontend
COPY frontend/ frontend/
RUN cd frontend && bun run build

# Build backend
COPY backend/ backend/
RUN cd backend && bun run build

# Runtime stage
FROM oven/bun:1-slim
WORKDIR /app

COPY --from=builder /app/backend/dist ./
COPY --from=builder /app/frontend/dist ./public

EXPOSE 3000 5140/udp

CMD ["bun", "run", "index.js"]
```

- Use official Bun images
- Layer caching for dependencies
- Slim runtime image
- Non-root user (optional)

## Verification

1. Build image: `docker build -t syslogger .`
2. Image size is reasonable (<200MB)
3. Container starts correctly
4. Both HTTP and UDP ports work
