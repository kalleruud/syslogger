# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json* frontend/yarn.lock* ./
RUN npm ci 2>/dev/null || npm install

COPY frontend/ .
RUN npm run build

# Stage 2: Runtime
FROM oven/bun:latest
WORKDIR /app

# Copy backend source
COPY backend/package.json backend/package-lock.json* backend/bunfig.toml* ./
RUN bun install --production

COPY backend/src ./src

# Copy frontend dist from builder
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Create data directory
RUN mkdir -p /app/data

# Expose ports
EXPOSE 3000 5140/udp

# Start application
CMD ["bun", "run", "src/index.ts"]
