FROM oven/bun:1 AS base
WORKDIR /opt/app

# Install dependencies
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Copy source code
COPY ./src ./src

# Build application
RUN bun build --target=bun --production --outdir=dist ./syslogger.ts

# Production stage
FROM oven/bun:1-slim
WORKDIR /opt/app
COPY --from=base /opt/app/dist ./
COPY --from=base /opt/app/public ./public

EXPOSE 3791

CMD ["bun", "syslogger.js"]
