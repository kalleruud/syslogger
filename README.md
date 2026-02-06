# Syslogger - Real-time Syslog Management System

A full-stack syslog management system with real-time log streaming, filtering, and analysis. Features a minimal, terminal-inspired single-page interface. Built with Bun/TypeScript backend and React frontend.

## Features

### Syslog Reception & Parsing
- **Real-time UDP Reception**: Listen for syslog messages on port 5140 (configurable)
- **RFC 5424 Support**: Parse modern structured syslog format
- **RFC 3164 Support**: Parse legacy BSD syslog format
- **Docker-friendly Parsing**: Handle containerized logs without hostname field
- **Automatic Severity Detection**: Fallback regex-based severity extraction from message text
- **Complete Field Extraction**: Facility, severity, timestamp, hostname, appname, procid, msgid, and message
- **Automatic Tag Extraction**: Text within square brackets (e.g., `[ERROR]`, `[DB]`) is extracted as tags

### Tags
- **Automatic Extraction**: Tags are extracted from text within square brackets (e.g., `[ERROR]`, `[REQUEST]`)
- **Normalized Storage**: Tags are stored lowercase and trimmed of whitespace
- **Many-to-Many Relationship**: A log can have multiple tags, and a tag can appear on multiple logs
- **Deduplication**: Tags are never duplicated; new logs are related to existing tags
- **Examples**: `Connection [TIMEOUT] from [DB]` extracts tags: `timeout`, `db`

### Database & Storage
- **SQLite with Drizzle ORM**: Type-safe database operations with zero runtime overhead
- **Automatic Migrations**: Database schema managed via Drizzle-kit
- **Performance Indexes**: Optimized queries with indexes on timestamp, severity, hostname, and appname
- **WAL Mode**: Write-Ahead Logging for better concurrency
- **Raw Message Storage**: Original syslog messages preserved for debugging
- **Tag Tables**: Separate `tags` table with junction table for efficient many-to-many relationships

### Real-time Features
- **WebSocket Streaming**: Instant log delivery to all connected clients using bun websockets
- **Auto-reconnect**: Exponential backoff reconnection (up to 10 attempts)
- **Connection Status Indicator**: Visual feedback with pulse animation
- **Client-side Filtering**: Real-time logs respect active filter settings

### Filtering & Search
- **Full-text Search**: Search across message, appname, and hostname fields (300ms debounce)
- **Severity Multi-select**: Filter by any combination of severity levels (0-7)
- **Application Multi-select**: Filter by dynamically-loaded application names
- **Tag Multi-select**: Filter by dynamically-loaded tags extracted from log messages
- **Hostname Filtering**: Filter by exact hostname match
- **URL Parameter Persistence**: Filters saved in URL for bookmarking and sharing
- **Browser History Support**: Back/forward navigation works with filters

### User Interface
- **Single Page Application**: Minimal, terminal-inspired design on a single page
- **Top Control Bar**: Search input, filter dropdowns, column visibility toggle, and settings button in one row
- **Terminal-style Log Table**: Fixed-width character columns with no gaps or margins between cells
- **8 Configurable Columns**: Timestamp, Severity, Hostname, Application, Facility, ProcID, MsgID, Message
- **Column Visibility Toggle**: Show/hide columns via popover menu in the top bar
- **Settings Button**: Opens a popup to configure retention settings per severity level
- **Severity Color Coding**: Visual distinction by log level (red/orange/yellow/blue)
- **Virtual Scrolling**: Efficient rendering of large datasets with @tanstack/react-virtual
- **Infinite Scroll**: Load older logs automatically when scrolling up
- **Auto-scroll Toggle**: Optional automatic scrolling for new logs

### Log Detail Panel
- **Click-to-inspect**: Click any row to open the detail panel below the top bar
- **Non-blocking**: Log table remains fully interactable while the detail panel is open
- **Full Field Display**: All syslog fields with human-readable labels
- **Facility Names**: Numeric facilities shown as readable names (kernel, user, mail, daemon, etc.)
- **Tag Display**: Shows all extracted tags as badges
- **Raw Message View**: Original unparsed syslog message
- **Keyboard Support**: Press Escape to close the panel

### Log Retention
- **Automatic Cleanup**: Daily cleanup job removes old logs
- **Per-Severity Retention**: Configure retention period (in days) for each severity level independently
- **Settings Popup**: Adjust retention days per severity via the settings button in the UI
- **Persistent Configuration**: Settings stored in `config.json` and persist across restarts

### Deployment
- **Docker Ready**: Multi-stage build with docker-compose
- **Static File Serving**: Backend serves compiled frontend
- **SPA Routing**: Proper handling of client-side routes
- **CORS Support**: Configurable cross-origin requests
- **Graceful Shutdown**: Clean database and socket cleanup

## Architecture

```
┌───────────────────────────────────────────┐
│         Syslog Devices (UDP)              │
└────────────────┬──────────────────────────┘
                 │
                 ▼
┌───────────────────────────────────────────┐
│    Backend (Bun/TypeScript).              │
│  ┌─────────────────────────────────────┐  │
│  │ • Syslog Receiver (UDP 5140)        │  │
│  │ • Syslog Parser (RFC 5424/3164)     │  │
│  │ • Bun SQLite + Drizzle ORM          │  │
│  │ • WebSocket Server (Pub/Sub)        │  │
│  │ • Log Retention Cleanup             │  │
│  │ • Settings API (config.json)        │  │
│  │ • Serving React bundle on endpoint  │  │
│  └─────────────────────────────────────┘  │
└────────────────┬──────────────────────────┘
                 │
                 ▼
┌───────────────────────────────────────────┐
│    Frontend (React + Vite)                │
│  ┌─────────────────────────────────────┐  │
│  │ • Minimal terminal-style UI         │  │
│  │ • Top bar: search, filters, columns │  │
│  │ • Settings popup for retention      │  │
│  │ • Fixed-width character log table   │  │
│  │ • Click-to-inspect detail panel     │  │
│  │ • WebSocket Client (auto-reconnect) │  │
│  │ • TanStack Table + Virtual Scroll   │  │
│  │ • URL-synced filter state           │  │
│  └─────────────────────────────────────┘  │
└───────────────────────────────────────────┘
```

## Technology Stack

### Backend
- **Bun** - Fast TypeScript runtime
- **TypeScript** - Type-safe development
- **Drizzle ORM** - Type-safe SQL with zero overhead
- **SQLite** - Embedded database with WAL mode

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **TanStack Table** - Headless table library
- **TanStack Virtual** - Virtual scrolling
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Component library
- **Lucide React** - Icon library

## Setup

### Prerequisites

- Node.js 18+ and npm/yarn
- Bun runtime (for backend development)
- Docker (optional, for containerized deployment)

The server will serve the compiled frontend from `frontend/dist` at `http://localhost:3000`.

## Docker Deployment

1. **Build and Start Container**
   ```bash
   docker-compose up --build
   ```

2. **Access the Application**
   - Web Interface: `http://localhost:3000`
   - Syslog Port: UDP `localhost:5140`

3. **View Logs**
   ```bash
   docker-compose logs -f syslogger
   ```

4. **Stop the Container**
   ```bash
   docker-compose down
   ```

## Configuration

### Environment Variables

Environment variables can be set in `backend/.env`:

```env
SYSLOG_PORT=5140           # Syslog UDP listen port
HTTP_PORT=3000             # React web ui server port
DB_PATH=./data/logs.db     # SQLite database path
```

### Retention Settings

Retention settings are stored in `backend/config.json` and can be configured via the settings popup in the UI:

```json
{
  "retention": {
    "0": null,    // Emergency - keep forever (null = no expiry)
    "1": null,    // Alert - keep forever
    "2": null,    // Critical - keep forever
    "3": 90,      // Error - 90 days
    "4": 60,      // Warning - 60 days
    "5": 30,      // Notice - 30 days
    "6": 14,      // Info - 14 days
    "7": 7        // Debug - 7 days
  }
}
```

Set a severity to `null` to keep logs of that level indefinitely.

## API Endpoints

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

### GET /api/tags

Get list of unique tags extracted from log messages.

**Response:**
```json
["db", "error", "request", "timeout", "warning"]
```

### GET /api/settings

Get current application settings including retention configuration.

**Response:**
```json
{
  "retention": {
    "0": null,
    "1": null,
    "2": null,
    "3": 90,
    "4": 60,
    "5": 30,
    "6": 14,
    "7": 7
  }
}
```

### PUT /api/settings

Update application settings. Saves to `config.json`.

**Request Body:**
```json
{
  "retention": {
    "0": null,
    "1": null,
    "2": null,
    "3": 90,
    "4": 60,
    "5": 30,
    "6": 14,
    "7": 7
  }
}
```

**Response:**
```json
{ "success": true }
```


## Performance Considerations

- **Virtual Scrolling**: Renders only visible rows, handles 100k+ logs efficiently
- **Database Indexing**: Indexes on timestamp, severity, hostname, and appname for fast queries
- **Request Deduplication**: Prevents display of stale API responses during rapid filtering
- **Debounced Search**: 300ms delay prevents excessive API calls while typing
- **WebSocket Pub/Sub**: Efficient broadcasting to all connected clients
- **Scroll Position Preservation**: Maintains position when loading older logs
- **Log Retention**: Automatic cleanup prevents unbounded database growth
