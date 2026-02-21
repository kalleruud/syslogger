# Syslogger - Real-time Syslog Management System

A full-stack syslog management system with real-time log streaming, filtering, and analysis. Features a minimal, terminal-inspired single-page interface. Built with Bun/TypeScript backend and React frontend.

## Features

### Syslog Reception & Parsing

- [x] **Real-time UDP Reception**: Listen for syslog messages on port 5140 (configurable)
- [ ] **RFC 5424 Support**: Parse modern structured syslog format
- [x] **RFC 3164 Support**: Parse legacy BSD syslog format
- [x] **Docker-friendly Parsing**: Handle containerized logs without hostname field
- [x] **Automatic Severity Detection**: Fallback regex-based severity extraction from message text
- [x] **Complete Field Extraction**: Facility, severity, timestamp, hostname, appname, procid, msgid, and message

### Database & Storage

- [x] **SQLite with Drizzle ORM**: Type-safe database operations with zero runtime overhead
- [x] **Automatic Migrations**: Database schema managed via Drizzle-kit
- [x] **Performance Indexes**: Optimized queries with indexes on timestamp, severity, hostname, and appname
- [x] **WAL Mode**: Write-Ahead Logging for better concurrency
- [x] **Raw Message Storage**: Original syslog messages preserved for debugging

### Real-time Features

- [x] **WebSocket Streaming**: Instant log delivery to all connected clients using bun websockets
- [x] **Auto-reconnect**: Automatic websocket reconnection
- [x] **Connection Status Indicator**: Visual feedback with pulse animation

### Filtering & Search

- [x] **Full-text Search**: Search across message, appname, and hostname fields (300ms debounce)
- [x] **Severity Multi-select**: Filter by any combination of severity levels (0-7)
- [x] **Application Multi-select**: Filter by dynamically-loaded application names
- [x] **Hostname Filtering**: Filter by exact hostname match
- [x] **URL Parameter Persistence**: Filters all saved in URL for bookmarking and sharing
- [x] **Browser History Support**: Back/forward navigation works with filters

### User Interface

- [x] **Single Page Application**: Minimal, terminal-inspired design on a single page
- [x] **Top Control Bar**: Search input, filter dropdowns, column visibility toggle, and settings button in one row
- [x] **Terminal-style Log Table**: Fixed-width character columns with no gaps or margins between cells
- [x] **Column Visibility Toggle**: Show/hide columns via multi-select dropdown
- [ ] **Settings Button**: Opens a popup to configure retention settings per severity level
- [x] **Severity Color Coding**: Visual distinction by log level (red/orange/yellow/blue)
- [x] **Virtual Scrolling**: Efficient rendering of large datasets with @tanstack/react-virtual
- [x] **Infinite Scroll**: Load older logs automatically when scrolling up
- [x] **Auto scroll**: When the screen is scrolled all the way to the bottom, auto scrolling on new incoming logs is enabled.

### Log Detail Panel

- [ ] **Click-to-inspect**: Click any row to open the detail panel below the top bar
- [ ] **Non-blocking**: Log table remains fully interactable while the detail panel is open
- [ ] **Full Field Display**: All syslog fields with human-readable labels
- [ ] **Facility Names**: Numeric facilities shown as readable names (kernel, user, mail, daemon, etc.)
- [ ] **Raw Message View**: Original unparsed syslog message

### Log Retention

- [ ] **Settings Popup**: Adjust retention days per severity via the settings button in the UI
- [ ] **Per-Severity Retention**: Configure retention period (in days) for each severity level independently
- [ ] **Persistent Configuration**: Settings stored in `config.json` and persist across restarts
- [ ] **Automatic Cleanup**: Daily cleanup job removes old logs

### Deployment

- [x] **Docker Deployment**: Multi-stage Dockerfile with optimized builds
- [x] **Docker Compose**: Complete orchestration with health checks and resource limits
- [x] **Volume Persistence**: SQLite database persisted via Docker volumes
- [x] **Static File Serving**: Backend serves compiled frontend
- [x] **SPA Routing**: Proper handling of client-side routes
- [x] **CORS Support**: Configurable cross-origin requests
- [x] **Graceful Shutdown**: Clean database and socket cleanup
- [x] **Health Checks**: Built-in HTTP health monitoring

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
│   │   ├── schema.ts          # Drizzle schema (logs)
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
│  │ ✓ Syslog Receiver (UDP 5140)        │  │
│  │ ✓ Syslog Parser (RFC 5424/3164)     │  │
│  │ ✓ SQLite + Drizzle ORM + WAL        │  │
│  │ ✓ Advanced query functions          │  │
│  │ ✓ WebSocket Server (Pub/Sub)        │  │
│  │ ✓ Docker deployment                 │  │
│  │ x REST API routes                   │  │
│  │ x Settings API (config.json)        │  │
│  │ x Log Retention Cleanup             │  │
│  │ ✓ Bun.serve for fullstack           │  │
│  └─────────────────────────────────────┘  │
└────────────────┬──────────────────────────┘
                 │
                 ▼
┌───────────────────────────────────────────┐
│    Frontend (React 19 + Bun)              │
│  ┌─────────────────────────────────────┐  │
│  │ ✓ Minimal terminal-style UI         │  │
│  │ x Top bar: search, filters, etc     │  │
│  │ x Settings popup for retention      │  │
│  │ - Log table with virtual scroll     │  │
│  │ x Click-to-inspect detail panel     │  │
│  │ - WebSocket Client (auto-reconnect) │  │
│  │ x URL-synced filter state           │  │
│  └─────────────────────────────────────┘  │
└───────────────────────────────────────────┘

Legend: ✓ Complete | - In Progress | x Not Started
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
- `search` - Full-text search in message, appname, and hostname

**Note**: Database query functions for these filters are already implemented in `src/database/queries.ts`.

### WebSocket /ws

Real-time log streaming to connected clients (in progress).

## Implementation Details

### Current Backend Features

- **UDP Syslog Reception**: Receives and processes syslog messages on configurable port
- **Multi-format Parsing**: Supports RFC 5424, RFC 3164, and Docker log formats
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

## Quick Start

### Using Docker (Recommended)

The easiest way to run Syslogger is using Docker Compose:

```bash
# Clone the repository
git clone <repository-url>
cd syslogger

# Start with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the service
docker-compose down
```

The application will be available at:

- **Web UI**: http://localhost:3791
- **Syslog UDP**: localhost:5140

### Using Bun Directly

```bash
# Install dependencies
bun install

# Development mode with hot reload
bun dev

# Production build and run
bun run build
bun run start
```

## Docker Deployment

Syslogger's Docker setup follows the [official Bun Docker guide](https://bun.sh/guides/ecosystem/docker) with optimized multi-stage builds for better caching and smaller image sizes.

### Docker Compose Configuration

The included `docker-compose.yml` provides a complete deployment configuration:

- **Ports**:
  - `3791`: Web UI and API
  - `5140/udp`: Syslog message reception
- **Volumes**:
  - `./data:/usr/src/app/data` - Persists SQLite database
- **Environment Variables**: See `.env.example` for all configuration options
- **Security**: Runs as non-root `bun` user

### Configuration

Configuration is done via environment variables. You can:

1. **Modify `docker-compose.yml`** directly (simplest approach)
2. **Use environment variables** when running `docker compose up`
3. **Create a `.env` file** (see `.env.docker` for an example)

Available environment variables:

```bash
# Node environment
NODE_ENV=production

# HTTP server configuration
SYSLOGGER_PORT=3791                # Web UI and API port

# Syslog UDP configuration
SYSLOGGER_SYSLOG_PORT=5140         # UDP port for syslog messages
SYSLOGGER_SYSLOG_PROTOCOL=udp      # Protocol (udp)

# Database configuration
SYSLOGGER_DB_URL=./data/syslogger.db  # SQLite database path

# CORS configuration
SYSLOGGER_CORS_ORIGIN=*            # Allowed CORS origins (* for all)

# Timezone (e.g., UTC, America/New_York, Europe/Oslo)
TZ=UTC
```

**Example**: To change the timezone, edit the `TZ` value in `docker-compose.yml`:

```yaml
environment:
  TZ: America/New_York # Changed from UTC
```

### Building Custom Images

The Dockerfile uses Bun's recommended multi-stage build pattern for optimal caching and image size:

```bash
# Build the Docker image with pull latest base image
docker build --pull -t syslogger:latest .

# Run with custom configuration
docker run -d \
  --name syslogger \
  -p 3791:3791 \
  -p 5140:5140/udp \
  -v $(pwd)/data:/usr/src/app/data \
  -e TZ=America/New_York \
  syslogger:latest
```

**Build Features:**

- **Dependency caching**: Dependencies installed in temp directories for faster rebuilds
- **Multi-stage build**: Separate dev and production dependencies
- **Production optimized**: Only production dependencies in final image
- **Security**: Runs as non-root `bun` user
- **Health checks**: Built-in HTTP health monitoring

### Health Checks

The container includes built-in health checks that verify the HTTP server is responding:

```bash
# Check container health
docker ps
docker inspect syslogger | grep -A 10 Health
```

### Testing Syslog Reception

Send test syslog messages to verify the setup:

```bash
# Using logger command (Linux/macOS)
logger -n localhost -P 5140 "Test message from logger"

# Using netcat
echo "<34>1 2024-01-01T12:00:00Z myhost myapp 1234 - - Test message" | nc -u localhost 5140

# Using Python
python3 -c "import socket; s=socket.socket(socket.AF_INET, socket.SOCK_DGRAM); s.sendto(b'<34>Test message from Python', ('localhost', 5140))"
```

### Docker Logs

View application logs from the container:

```bash
# Follow logs in real-time
docker compose logs -f syslogger

# View last 100 lines
docker compose logs --tail=100 syslogger

# View logs since a specific time
docker compose logs --since 1h syslogger
```

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

### Development Commands

```bash
# Install dependencies
bun install

# Start development server with hot reload
bun dev

# Run linting and formatting checks
bun run check

# Build for production
bun run build

# Start production build
bun run start

# Database operations
bunx drizzle-kit generate   # Generate migrations
bunx drizzle-kit migrate    # Apply migrations
bunx drizzle-kit studio     # Open Drizzle Studio
```

## Docker Quick Reference

### Using Make (Recommended)

A Makefile is provided for convenience:

```bash
make help      # Show all available commands
make up        # Start services
make down      # Stop services
make logs      # View logs
make restart   # Restart services
make rebuild   # Rebuild and restart
make shell     # Access container shell
make health    # Check health status
make clean     # Remove everything
```

### Using Docker Compose Directly

```bash
# Start services in detached mode
docker compose up -d

# Stop services
docker compose down

# Restart services
docker compose restart

# View logs
docker compose logs -f

# Rebuild and restart after code changes
docker compose up -d --build

# Remove everything (including volumes)
docker compose down -v
```

### Troubleshooting

```bash
# Check container status
docker compose ps

# View container logs
docker compose logs syslogger

# Execute commands inside container
docker compose exec syslogger bun --version

# Check health status
docker inspect syslogger --format='{{.State.Health.Status}}'

# Access container shell
docker compose exec syslogger sh
```

### Docker Build Architecture

The Dockerfile follows the [official Bun guide](https://bun.sh/guides/ecosystem/docker) with four optimized stages:

1. **base**: Sets up working directory with Bun image
2. **install**: Installs dependencies in temp directories for better caching
   - `/temp/dev`: All dependencies (including devDependencies)
   - `/temp/prod`: Production dependencies only
3. **prerelease**: Builds the application with dev dependencies
4. **release**: Final slim image with only production code and dependencies

**Benefits:**

- Faster rebuilds through Docker layer caching
- Smaller final image (no devDependencies)
- Consistent builds with frozen lockfile
- Security through non-root user

### Production Considerations

- **Volume Backups**: Regularly backup the `./data` directory containing the SQLite database
- **Resource Limits**: Adjust memory limits in `docker-compose.yml` based on log volume
- **Log Rotation**: The compose file includes log rotation (10MB max, 3 files)
- **Firewall**: Ensure UDP port 5140 is open for syslog reception
- **Monitoring**: Use the built-in health checks for monitoring
- **Security**: Container runs as `bun` user (non-root) for better security

## Contributing

This project follows [Clean Code principles](.agents/skills/clean-code/SKILL.md) and uses comprehensive logging via `src/backend/managers/log.manager.ts`.

## License

MIT
