# Feature: Multi-stage Build

## Overview

Docker multi-stage build strategy to minimize final image size and improve build caching. Separates build tools from runtime.

## Architecture Decision

- Stage 1: Install dependencies
- Stage 2: Build frontend
- Stage 3: Build backend
- Stage 4: Runtime with only necessary files

## Dependencies

- **Features**: 01-dockerfile
- **Packages**: Docker

## Key Files

- `Dockerfile` - Multi-stage definition

## Implementation Notes

```dockerfile
# Stage 1: Dependencies
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lockb ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN bun install --frozen-lockfile

# Stage 2: Build frontend
FROM deps AS frontend-builder
COPY frontend/ frontend/
RUN cd frontend && bun run build

# Stage 3: Build backend
FROM deps AS backend-builder
COPY backend/ backend/
RUN cd backend && bun run build

# Stage 4: Runtime
FROM oven/bun:1-slim AS runtime
WORKDIR /app

# Copy only production artifacts
COPY --from=backend-builder /app/backend/dist ./
COPY --from=frontend-builder /app/frontend/dist ./public
COPY --from=deps /app/node_modules ./node_modules

# Create non-root user
RUN adduser --disabled-password --gecos "" appuser
USER appuser

EXPOSE 3000 5140/udp
CMD ["bun", "run", "index.js"]
```

- Parallel frontend/backend builds
- Cached dependency layer
- Minimal runtime layer
- Security: non-root user

## Verification

1. Rebuild after code change uses cache
2. Final image contains only runtime files
3. Image runs as non-root user
4. Build time optimized with parallelism
