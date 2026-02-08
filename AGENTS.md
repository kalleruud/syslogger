# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Syslogger is a real-time syslog management system with a Bun/TypeScript backend and React frontend. It receives syslog messages via UDP, parses them (RFC 5424/3164), stores them in SQLite, and streams them to connected clients via WebSocket.

## Commands

```bash
# Development
bun install              # Install dependencies
bun dev                  # Start Vite dev server (frontend only)
bun run check            # Run TypeScript, ESLint, and Prettier checks

# Database
bunx drizzle-kit generate   # Generate migrations from schema changes
bunx drizzle-kit migrate    # Apply migrations to database

# Production
bun run build            # Build frontend (tsc + vite build)
docker-compose up --build   # Build and run in Docker
```

## Architecture

```
├── backend/
│   ├── database/
│   │   ├── schema.ts    # Drizzle ORM schema (logs, tags, logs_tags)
│   │   ├── database.ts  # Database connection
│   │   └── queries.ts   # Query functions
│   └── logger/
│       └── index.ts     # Internal logging that writes to DB + broadcasts
├── frontend/
│   ├── App.tsx          # Root component
│   ├── views/           # Page views (LogsView)
│   ├── components/      # React components
│   │   ├── TopBar.tsx   # Search, filters, column toggle
│   │   └── ui/          # shadcn/ui components
│   └── lib/utils.ts     # Utility functions (cn)
├── drizzle/             # Generated SQL migrations
└── data/                # SQLite database (db.sqlite)
```

## Path Aliases

Configured in `tsconfig.json` and `vite.config.ts`:

- `@/*` or `@frontend/*` → `./frontend/*`
- `@backend/*` → `./backend/*`
- `@database/*` → `./backend/database/*`

## Key Technical Details

- **Runtime**: Bun for backend, Vite for frontend dev
- **Database**: SQLite with Drizzle ORM, WAL mode
- **UI**: React 19 + TailwindCSS 4 + shadcn/ui + React Compiler
- **Ports**: UDP 5140 (syslog), HTTP 3000 (web)
- **Config**: `backend/.env` for env vars, `backend/config.json` for retention settings
  . **Backend logging**: Always use the existing `logger` utility from `/backend/managers/log.manager.ts`.
