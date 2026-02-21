# Multi-stage Dockerfile for Syslogger
# Based on official Bun Docker guide: https://bun.sh/guides/ecosystem/docker

# Use the official Bun image
FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# Install dependencies into temp directory
# This will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# Install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# Copy node_modules from temp directory
# Then copy all (non-ignored) project files into the image
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# Build the frontend application
ENV NODE_ENV=production
RUN bun run build

# Copy production dependencies and source code into final image
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/src/app/dist ./dist
COPY --from=prerelease /usr/src/app/drizzle ./drizzle
COPY --from=prerelease /usr/src/app/src ./src
COPY --from=prerelease /usr/src/app/package.json .
COPY --from=prerelease /usr/src/app/tsconfig.json .
COPY --from=prerelease /usr/src/app/drizzle.config.ts .

# Create data directory for SQLite database and set ownership
RUN mkdir -p /usr/src/app/data && chown -R bun:bun /usr/src/app/data

# Expose ports
# 3791: HTTP server for web UI and API
# 5140: UDP port for syslog messages
EXPOSE 3791/tcp 5140/udp

# Run as bun user for security
USER bun

# Health check (runs inside container, uses internal port)
# Note: This checks the app's health from inside the container, not externally
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD bun -e "fetch('http://127.0.0.1:3791/').then(() => process.exit(0)).catch(() => process.exit(1))"

# Start the application
ENTRYPOINT [ "bun", "run", "src/syslogger.ts" ]
