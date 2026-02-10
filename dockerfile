# Multi-stage build for production deployment
# Stage 1: Dependencies
FROM oven/bun:alpine AS deps
WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Stage 2: Builder
FROM oven/bun:alpine AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY package.json bun.lock* ./

# Copy source code
COPY backend ./backend
COPY frontend ./frontend
COPY public ./public
COPY drizzle ./drizzle
COPY drizzle.config.ts ./
COPY tsconfig.json ./
COPY bunfig.toml ./

# Build the fullstack application
# This bundles the backend with embedded frontend assets
RUN bun build --target=bun --production --outdir=dist ./backend/server.ts

# Stage 3: Production runner
FROM oven/bun:alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HTTP_PORT=3000
ENV SYSLOG_PORT=5140

# Copy necessary files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./
COPY --from=builder /app/public ./public
COPY package.json ./

# Install only production dependencies (if needed for runtime)
COPY --from=deps /app/node_modules ./node_modules

# Create data directory for SQLite database
RUN mkdir -p data && chown -R bun:bun data

# Set user to non-root
USER bun

# Expose ports
EXPOSE 3000 5140/udp

# Volume for persistent data
VOLUME ["/app/data"]

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun -e "fetch('http://localhost:3000/api/stats').then(r => r.ok ? process.exit(0) : process.exit(1))" || exit 1

# Start the server using the bundled output
CMD ["bun", "dist/server.js"]
