FROM oven/bun:alpine AS builder
WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM oven/bun:alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production

COPY --from=builder /app/dist ./dist
COPY drizzle.config.ts .
COPY drizzle ./drizzle
RUN mkdir -p data && chown -R bun:bun data

VOLUME ["/app/data"]

ENTRYPOINT ["bun", "start"]
