# Syslogger - Real-time Syslog Management System

A full-stack syslog management system with real-time log streaming, filtering, and analysis. Features a minimal, terminal-inspired single-page interface. Built with Bun/TypeScript backend and React frontend.

## Features

### Syslog Reception & Parsing

- [x] **Real-time UDP Reception**: Listen for syslog messages on port 5140 (configurable)
- [ ] **RFC 5424 Support**: Parse modern structured syslog format
- [ ] **RFC 3164 Support**: Parse legacy BSD syslog format
- [x] **Docker-friendly Parsing**: Handle containerized logs without hostname field
- [x] **Automatic Severity Detection**: Fallback regex-based severity extraction from message text
- [x] **Complete Field Extraction**: Facility, severity, timestamp, hostname, appname, procid, msgid, and message
- [x] **Automatic Tag Extraction**: Text within square brackets (e.g., `[ERROR]`, `[DB]`) is extracted as tags

### Tags

- [x] **Automatic Extraction**: Tags are extracted from text within square brackets (e.g., `[ERROR]`, `[REQUEST]`)
- [x] **Normalized Storage**: Tags are stored lowercase and trimmed of whitespace
- [x] **Many-to-Many Relationship**: A log can have multiple tags, and a tag can appear on multiple logs
- [x] **Deduplication**: Tags are never duplicated; new logs are related to existing tags
- [x] **Examples**: `Connection [TIMEOUT] from [DB]` extracts tags: `timeout`, `db`

### Database & Storage

- [x] **SQLite with Drizzle ORM**: Type-safe database operations with zero runtime overhead
- [x] **Automatic Migrations**: Database schema managed via Drizzle-kit
- [x] **Performance Indexes**: Optimized queries with indexes on timestamp, severity, hostname, and appname
- [x] **WAL Mode**: Write-Ahead Logging for better concurrency
- [x] **Raw Message Storage**: Original syslog messages preserved for debugging
- [x] **Tag Tables**: Separate `tags` table with junction table for efficient many-to-many relationships

### Real-time Features

- [x] **WebSocket Streaming**: Instant log delivery to all connected clients using bun websockets
- [x] **Auto-reconnect**: Automatic websocket reconnection
- [x] **Connection Status Indicator**: Visual feedback with pulse animation

### Filtering & Search

- [ ] **Full-text Search**: Search across message, appname, and hostname fields (300ms debounce)
- [ ] **Severity Multi-select**: Filter by any combination of severity levels (0-7)
- [ ] **Application Multi-select**: Filter by dynamically-loaded application names
- [ ] **Tag Multi-select**: Filter by dynamically-loaded tags extracted from log messages
- [ ] **Hostname Filtering**: Filter by exact hostname match
- [ ] **URL Parameter Persistence**: Filters all saved in URL for bookmarking and sharing
- [ ] **Browser History Support**: Back/forward navigation works with filters

### User Interface

- [x] **Single Page Application**: Minimal, terminal-inspired design on a single page
- [ ] **Top Control Bar**: Search input, filter dropdowns, column visibility toggle, and settings button in one row
- [x] **Terminal-style Log Table**: Fixed-width character columns with no gaps or margins between cells
- [x] **Column Visibility Toggle**: Show/hide columns via multi-select dropdown
- [ ] **Settings Button**: Opens a popup to configure retention settings per severity level
- [x] **Severity Color Coding**: Visual distinction by log level (red/orange/yellow/blue)
- [ ] **Virtual Scrolling**: Efficient rendering of large datasets with @tanstack/react-virtual
- [ ] **Infinite Scroll**: Load older logs automatically when scrolling up
- [ ] **Auto scroll**: When the screen is scrolled all the way to the bottom, auto scrolling on new incoming logs is enabled.

### Log Detail Panel

- [ ] **Click-to-inspect**: Click any row to open the detail panel below the top bar
- [ ] **Non-blocking**: Log table remains fully interactable while the detail panel is open
- [ ] **Full Field Display**: All syslog fields with human-readable labels
- [ ] **Facility Names**: Numeric facilities shown as readable names (kernel, user, mail, daemon, etc.)
- [ ] **Tag Display**: Shows all extracted tags in the detail view
- [ ] **Raw Message View**: Original unparsed syslog message
- [ ] **Keyboard Support**: Press Escape to close the panel, cmd + k to search. Display hotkey helpers.

### Log Retention

- [ ] **Settings Popup**: Adjust retention days per severity via the settings button in the UI
- [ ] **Per-Severity Retention**: Configure retention period (in days) for each severity level independently
- [ ] **Persistent Configuration**: Settings stored in `config.json` and persist across restarts
- [ ] **Automatic Cleanup**: Daily cleanup job removes old logs

### Deployment

- [x] **Docker Ready**: Multi-stage build with docker-compose
- [x] **Static File Serving**: Backend serves compiled frontend
- [x] **SPA Routing**: Proper handling of client-side routes
- [x] **CORS Support**: Configurable cross-origin requests
- [x] **Graceful Shutdown**: Clean database and socket cleanup

## Project Structure

```
syslogger/
├── src/
│   ├── syslogger.ts           # Main entry point
│   ├── backend/
│   │   ├── index.ts           # Bun.serve fullstack configuration
│   │   ├── websocket.ts       # WebSocket handlers
│   │   ├── managers/
│   │   │   ├── syslog.manager.ts   # UDP socket handler
│   │   │   └── log.manager.ts      # Internal logging (DB + broadcasts)
│   │   ├── parsers/
│   │   │   ├── parser.ts           # Main parser orchestrator
│   │   │   ├── base.parser.ts      # RFC 5424/3164 parser
│   │   │   ├── docker.parser.ts    # Docker log parser
│   │   │   └── fallback.parser.ts  # Severity extraction fallback
│   │   ├── routes/
│   │   │   └── api.ts              # API route handlers
│   │   └── utils/
│   │       ├── api.ts              # API response helpers
│   │       └── shutdown.ts         # Graceful shutdown
│   ├── database/
│   │   ├── schema.ts          # Drizzle schema (logs, tags, logs_tags)
│   │   ├── database.ts        # SQLite connection with WAL mode
│   │   └── queries.ts         # Type-safe database queries
│   ├── frontend/
│   │   ├── frontend.tsx       # React app entry point
│   │   ├── App.tsx            # Main app component
│   │   ├── components/        # React components
│   │   │   ├── TopBar.tsx     # Search, filters, column toggle
│   │   │   ├── LogRow.tsx     # Individual log row
│   │   │   ├── ColumnSelector.tsx
│   │   │   ├── LiveIndicator.tsx
│   │   │   ├── BrailleLoader.tsx
│   │   │   └── ui/            # shadcn/ui components
│   │   ├── contexts/          # React contexts
│   │   │   ├── ConnectionContext.tsx
│   │   │   └── DataContext.tsx
│   │   ├── hooks/
│   │   │   └── useColumnVisibility.ts
│   │   ├── lib/
│   │   │   └── api.ts         # API client functions
│   │   └── public/
│   │       ├── index.html     # HTML entry point
│   │       └── logo.svg
│   └── lib/                   # Shared utilities
│       ├── config.ts          # Configuration management
│       ├── facilities.ts      # Syslog facility mappings
│       ├── severities.ts      # Syslog severity mappings
│       └── utils.ts           # Shared utility functions
├── data/
│   ├── syslogger.db           # SQLite database (WAL mode)
│   ├── syslogger.db-shm       # Shared memory file
│   └── syslogger.db-wal       # Write-ahead log
├── drizzle/                   # Generated migrations
│   ├── 0000_*.sql
│   └── meta/
├── dist/                      # Production build output
└── package.json
```

## Architecture

```
┌───────────────────────────────────────────┐
│         Syslog Devices (UDP)              │
└────────────────┬──────────────────────────┘
                 │
                 ▼
┌───────────────────────────────────────────┐
│    Backend (Bun/TypeScript)               │
│  ┌─────────────────────────────────────┐  │
│  │ ✅ Syslog Receiver (UDP 5140)       │  │
│  │ ✅ Syslog Parser (RFC 5424/3164)    │  │
│  │ ✅ SQLite + Drizzle ORM + WAL       │  │
│  │ ✅ Tag extraction & storage         │  │
│  │ ✅ Advanced query functions         │  │
│  │ ✅ WebSocket Server (Pub/Sub)       │  │
│  │ ❌ REST API routes                  │  │
│  │ ❌ Settings API (config.json)       │  │
│  │ ❌ Log Retention Cleanup            │  │
│  │ ✅ Bun.serve for fullstack          │  │
│  └─────────────────────────────────────┘  │
└────────────────┬──────────────────────────┘
                 │
                 ▼
┌───────────────────────────────────────────┐
│    Frontend (React 19 + Bun)              │
│  ┌─────────────────────────────────────┐  │
│  │ ✅ Minimal terminal-style UI        │  │
│  │ ❌ Top bar: search, filters, etc    │  │
│  │ ❌ Settings popup for retention     │  │
│  │ 🚧 Log table with virtual scroll    │  │
│  │ ❌ Click-to-inspect detail panel    │  │
│  │ 🚧 WebSocket Client (auto-reconnect)│  │
│  │ ❌ URL-synced filter state          │  │
│  └─────────────────────────────────────┘  │
└───────────────────────────────────────────┘

Legend: ✅ Complete | 🚧 In Progress | ❌ Not Started
```

## Technology Stack

### Backend

- **Bun** - Fast TypeScript runtime
- **TypeScript** - Type-safe development
- **Drizzle ORM** - Type-safe SQL with zero overhead
- **SQLite** - Embedded database with WAL mode

### Frontend

- **React 19** - UI framework with React Compiler
- **Bun** - Build tool with HMR (replaces Vite)
- **Tailwind CSS 4** - Utility-first styling
- **shadcn/ui** - Component library
- **Lucide React** - Icon library

### Retention Settings

Retention settings will be managed via `src/lib/config.ts` and configurable via the settings popup in the UI:

```json
{
  "retention": {
    "0": null, // Emergency - keep forever (null = no expiry)
    "1": null, // Alert - keep forever
    "2": null, // Critical - keep forever
    "3": 90, // Error - 90 days
    "4": 60, // Warning - 60 days
    "5": 30, // Notice - 30 days
    "6": 14, // Info - 14 days
    "7": 7 // Debug - 7 days
  }
}
```

Set a severity to `null` to keep logs of that level indefinitely.

> **Note**: Retention cleanup is not yet implemented.

## API Endpoints

The following REST API endpoints are planned but not yet implemented:

### GET /api/logs

Fetch logs with optional filtering and pagination.

**Query Parameters:**

- `limit` (default: 100) - Maximum number of logs to return
- `offset` (default: 0) - Skip first N logs
- `severity` - Comma-separated severity levels (e.g., `0,1,2,3`)
- `hostname` - Filter by exact hostname
- `appname` - Comma-separated application names (e.g., `nginx,sshd`)
- `tags` - Comma-separated tags (e.g., `error,timeout,db`)
- `search` - Full-text search in message, appname, and hostname

**Note**: Database query functions for these filters are already implemented in `src/database/queries.ts`.

### WebSocket /ws

Real-time log streaming to connected clients (in progress).

## Implementation Details

### Current Backend Features

- **UDP Syslog Reception**: Receives and processes syslog messages on configurable port
- **Multi-format Parsing**: Supports RFC 5424, RFC 3164, and Docker log formats
- **Tag Extraction**: Automatically extracts tags from `[BRACKETED]` text in messages
- **SQLite with WAL**: Write-Ahead Logging enabled for better concurrency
- **Advanced Queries**: Full filtering, pagination, and full-text search capability
- **Database Indexes**: Optimized queries with composite indexes
- **Type Safety**: Full TypeScript coverage with Drizzle ORM

### Planned Performance Optimizations

- **Virtual Scrolling**: Render only visible rows for 100k+ logs
- **Request Deduplication**: Prevent stale API responses during rapid filtering
- **Debounced Search**: 300ms delay to reduce excessive API calls
- **WebSocket Pub/Sub**: Efficient real-time broadcasting
- **Log Retention**: Automatic cleanup to prevent unbounded growth

## Development

### Path Aliases

Configured in `tsconfig.json`:

- `@/*` → `./src/*` (points to src root)
- `@public/*` → `./src/frontend/public/*`

### Key Files

- **Main entry**: `src/syslogger.ts`
- **Backend server**: `src/backend/index.ts` (Bun.serve configuration)
- **Frontend entry**: `src/frontend/frontend.tsx`
- **Database schema**: `src/database/schema.ts`
- **Syslog manager**: `src/backend/managers/syslog.manager.ts`
- **Internal logging**: `src/backend/managers/log.manager.ts`

## Contributing

This project follows [Clean Code principles](.agents/skills/clean-code/SKILL.md) and uses comprehensive logging via `src/backend/managers/log.manager.ts`.

## License

MIT
