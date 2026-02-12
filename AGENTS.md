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
├── src/
│   ├── syslogger.ts         # Main entry point
│   ├── backend/
│   │   ├── index.ts         # Bun.serve fullstack configuration
│   │   ├── websocket.ts     # WebSocket handlers
│   │   ├── managers/
│   │   │   ├── log.manager.ts    # Internal logging (DB + broadcasts)
│   │   │   └── syslog.manager.ts # UDP socket handler
│   │   ├── parsers/
│   │   │   ├── parser.ts         # Main parser orchestrator
│   │   │   ├── base.parser.ts    # RFC 5424/3164 parser
│   │   │   ├── docker.parser.ts  # Docker log parser
│   │   │   └── fallback.parser.ts # Severity extraction
│   │   ├── routes/
│   │   │   └── api.ts       # API route handlers
│   │   └── utils/
│   │       ├── api.ts       # API response helpers
│   │       └── shutdown.ts  # Graceful shutdown
│   ├── database/
│   │   ├── schema.ts        # Drizzle ORM schema (logs, tags, logs_tags)
│   │   ├── database.ts      # SQLite connection with WAL mode
│   │   └── queries.ts       # Type-safe query functions
│   ├── frontend/
│   │   ├── frontend.tsx     # React app entry point
│   │   ├── App.tsx          # Main app component
│   │   ├── components/      # React components
│   │   │   ├── TopBar.tsx   # Search, filters, column toggle
│   │   │   ├── LogRow.tsx   # Individual log row
│   │   │   ├── ColumnSelector.tsx
│   │   │   ├── LiveIndicator.tsx
│   │   │   ├── BrailleLoader.tsx
│   │   │   └── ui/          # shadcn/ui components
│   │   ├── contexts/        # React contexts
│   │   │   ├── ConnectionContext.tsx
│   │   │   └── DataContext.tsx
│   │   ├── hooks/
│   │   │   └── useColumnVisibility.ts
│   │   ├── lib/
│   │   │   └── api.ts       # API client functions
│   │   └── public/
│   │       ├── index.html   # HTML entry point
│   │       └── logo.svg
│   └── lib/                 # Shared utilities
│       ├── config.ts        # Configuration management
│       ├── facilities.ts    # Syslog facility mappings
│       ├── severities.ts    # Syslog severity mappings
│       └── utils.ts         # Shared utility functions
├── data/                    # SQLite database files
│   ├── syslogger.db
│   ├── syslogger.db-shm
│   └── syslogger.db-wal
├── drizzle/                 # Generated SQL migrations
│   ├── 0000_*.sql
│   └── meta/
└── dist/                    # Production build output (after build)
```

## Path Aliases

Configured in `tsconfig.json`:

- `@/*` → `./src/*` (points to src root, not frontend!)
- `@public/*` → `./src/frontend/public/*`

## Key Technical Details

- **Runtime**: Bun for backend, Bun.serve for fullstack integration
- **Database**: SQLite with Drizzle ORM, WAL mode
- **UI**: React 19 + TailwindCSS 4 + shadcn/ui + React Compiler
- **Ports**: UDP 5140 (syslog), HTTP 3000 (web)
- **Config**: `.env` for env vars, `src/lib/config.ts` for configuration management
- **Backend logging**: Always use the existing `logger` utility from `src/backend/managers/log.manager.ts`
- **Development**: Hot Module Reloading (HMR) + console streaming enabled
- **Production**: Ahead-of-time bundling with Bun bundler for optimal performance
