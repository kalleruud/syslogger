# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# IMPORTANT RULES

- Always use the [clean-code skill](.agents/skills/clean-code/SKILL.md) when writing code.
- Follow existing project structure, e.g. using managers on the backend.
- Always write comprehensive logs on the backend using the logger from `backend/managers/log.manager.ts`.

## Project Overview

Syslogger is a real-time syslog management system with a Bun/TypeScript backend and React frontend. It receives syslog messages via UDP, parses them (RFC 5424/3164), stores them in SQLite, and streams them to connected clients via WebSocket.

## Commands

```bash
# Development
bun install              # Install dependencies
bun dev                  # Start fullstack dev server with HMR
bun run check            # Run TypeScript, ESLint, and Prettier checks

# Database
bunx drizzle-kit generate   # Generate migrations from schema changes
bunx drizzle-kit migrate    # Apply migrations to database

# Production
bun run build            # Build fullstack app with Bun bundler
bun run start:dist       # Run production build
docker-compose up --build   # Build and run in Docker
```

## Architecture

```
├── backend/
│   ├── server.ts        # Main Bun.serve fullstack configuration
│   ├── server/
│   │   ├── api-routes.ts   # API route handlers for Bun.serve
│   │   ├── websocket.ts    # WebSocket handlers
│   │   ├── cors.ts         # CORS configuration
│   │   └── shutdown.ts     # Graceful shutdown
│   ├── database/
│   │   ├── schema.ts    # Drizzle ORM schema (logs, tags, logs_tags)
│   │   ├── database.ts  # Database connection
│   │   └── queries.ts   # Query functions
│   ├── syslog/          # Syslog receiver and parsers
│   └── managers/
│       └── log.manager.ts  # Internal logging that writes to DB + broadcasts
├── frontend/
│   ├── main.tsx         # React app entry point
│   ├── views/           # Page views (LogsView)
│   ├── components/      # React components
│   │   ├── TopBar.tsx   # Search, filters, column toggle
│   │   └── ui/          # shadcn/ui components
│   └── lib/utils.ts     # Utility functions (cn)
├── public/
│   └── index.html       # HTML entry point (imported by Bun.serve)
├── drizzle/             # Generated SQL migrations
├── dist/                # Production build output
└── data/                # SQLite database (db.sqlite)
```

## Path Aliases

Configured in `tsconfig.json` and `vite.config.ts`:

- `@/*` or `@frontend/*` → `./frontend/*`
- `@backend/*` → `./backend/*`
- `@database/*` → `./backend/database/*`

## Key Technical Details

- **Runtime**: Bun for backend, Bun.serve for fullstack integration
- **Database**: SQLite with Drizzle ORM, WAL mode
- **UI**: React 19 + TailwindCSS 4 + shadcn/ui + React Compiler
- **Ports**: UDP 5140 (syslog), HTTP 3000 (web)
- **Config**: `.env` for env vars, `backend/config.json` for retention settings
- **Backend logging**: Always use the existing `logger` utility from `/backend/managers/log.manager.ts`
- **Development**: Hot Module Reloading (HMR) + console streaming enabled
- **Production**: Ahead-of-time bundling with Bun bundler for optimal performance
