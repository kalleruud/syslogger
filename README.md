# Syslogger - Real-time Syslog Management System

A full-stack syslog management system with real-time log streaming, filtering, and analysis. Built with Bun/TypeScript backend and React frontend.

## Features

- **Real-time Syslog Reception**: Listen for syslog messages via UDP on port 5140
- **RFC 5424 & RFC 3164 Support**: Parse both modern and legacy syslog formats
- **WebSocket Streaming**: Real-time log updates to connected clients
- **SQLite Persistence**: Durable log storage with automatic retention policies
- **Advanced Filtering**: Filter by hostname, severity, facility, and full-text search
- **Data Table**: Sortable columns, responsive UI with shadcn components
- **Log Retention**: Auto-delete non-critical logs after 30 days (configurable)
- **Docker Ready**: Single container deployment with docker-compose

## Architecture

```
┌─────────────────────────────────────────────┐
│         Syslog Devices (UDP)                │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│    Backend (Bun/TypeScript)                 │
│  ┌─────────────────────────────────────┐   │
│  │ • Syslog Receiver (UDP 5140)        │   │
│  │ • Syslog Parser (RFC 5424/3164)     │   │
│  │ • SQLite Database                   │   │
│  │ • WebSocket Server                  │   │
│  │ • Log Retention Cleanup              │   │
│  │ • Static File Server (HTTP 3000)    │   │
│  └─────────────────────────────────────┘   │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│    Frontend (React + Vite)                  │
│  ┌─────────────────────────────────────┐   │
│  │ • WebSocket Client                  │   │
│  │ • Data Table with TanStack Table    │   │
│  │ • shadcn UI Components              │   │
│  │ • Filtering & Sorting               │   │
│  │ • Real-time Updates                 │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

## Setup

### Prerequisites

- Node.js 18+ and npm/yarn
- Bun runtime (for backend development)
- Docker (optional, for containerized deployment)

### Local Development

1. **Install Backend Dependencies**
   ```bash
   cd backend
   bun install
   cd ..
   ```

2. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

3. **Start Backend**
   ```bash
   cd backend
   bun run dev
   ```

4. **Start Frontend (in another terminal)**
   ```bash
   cd frontend
   npm run dev
   ```

The frontend will be available at `http://localhost:5173` (Vite dev server) with API proxy to backend.

### Production Build

1. **Build Frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Start Backend with Static Files**
   ```bash
   cd backend
   bun start
   ```

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

Environment variables can be set in `backend/.env`:

```env
SYSLOG_PORT=5140           # Syslog UDP listen port
HTTP_PORT=3000             # Web server port
DB_PATH=./data/logs.db     # SQLite database path
RETENTION_DAYS=30          # Keep non-critical logs for N days
```

## API Endpoints

### GET /api/logs

Fetch logs with optional filtering and pagination.

**Query Parameters:**
- `limit` (default: 100) - Maximum number of logs to return
- `offset` (default: 0) - Skip first N logs
- `severity_min` - Filter by minimum severity level (0-7)
- `severity_max` - Filter by maximum severity level (0-7)
- `hostname` - Filter by exact hostname
- `search` - Full-text search in message, appname, and hostname

**Example:**
```bash
curl "http://localhost:3000/api/logs?limit=50&severity_min=0&severity_max=3"
```

### WebSocket /

Connect via WebSocket to receive real-time log updates.

**Message Format:**
```json
{
  "type": "log",
  "data": {
    "id": 1,
    "timestamp": "2026-01-29T12:00:00Z",
    "facility": 16,
    "severity": 3,
    "hostname": "server-01",
    "appname": "systemd",
    "procid": "1234",
    "msgid": "-",
    "message": "Service started successfully",
    "raw": "<131>1 2026-01-29T12:00:00Z server-01 systemd 1234 - - Service started successfully"
  }
}
```

## Testing

### Send Test Syslog Message

```bash
# RFC 5424 format (modern)
echo "<34>1 2026-01-29T12:00:00Z hostname app 123 - - Test message" | nc -u localhost 5140

# RFC 3164 format (legacy)
echo "<34>Jan 29 12:00:00 hostname app[123]: Test message" | nc -u localhost 5140
```

### Verify Web Interface

1. Open `http://localhost:3000` in your browser
2. Send test syslog messages from a terminal
3. Verify messages appear in real-time on the web interface
4. Test filtering by hostname, severity, and search text
5. Test sorting by clicking on column headers

## Syslog Severity Levels

| Level | Name        | Condition       |
|-------|-------------|-----------------|
| 0     | Emergency   | System unusable |
| 1     | Alert       | Immediate action |
| 2     | Critical    | Critical        |
| 3     | Error       | Error           |
| 4     | Warning     | Warning         |
| 5     | Notice      | Normal but significant |
| 6     | Info        | Informational   |
| 7     | Debug       | Debug           |

## Log Retention Policy

- **Critical logs** (severity 0-4): Kept indefinitely
- **Non-critical logs** (severity 5-7): Deleted after 30 days (configurable)
- Cleanup runs automatically once per day

## Troubleshooting

### No logs appearing in UI

1. Check WebSocket connection status (green indicator in top-right)
2. Verify logs are being received: `docker-compose logs syslogger`
3. Check if syslog port is accessible: `netstat -un | grep 5140`
4. Send test message: `echo "<34>Jan 29 12:00:00 localhost test: test" | nc -u localhost 5140`

### Database locked error

This usually indicates another process is accessing the database. The WAL (Write-Ahead Logging) mode helps with concurrency, but restarting the container may be needed.

### Frontend not loading

- Check if backend is running: `http://localhost:3000/api/logs`
- Verify frontend build: `npm run build` in frontend directory
- Check browser console for JavaScript errors

## Project Structure

```
syslogger/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Main server
│   │   ├── syslog-receiver.ts    # Syslog parsing & reception
│   │   ├── database.ts           # SQLite operations
│   │   ├── websocket.ts          # WebSocket broadcasting
│   │   ├── cleanup.ts            # Log retention cleanup
│   │   └── types.ts              # Type definitions
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.tsx               # Main component
│   │   ├── main.tsx              # React entry point
│   │   ├── index.css             # Tailwind styles
│   │   ├── types.ts              # Type definitions
│   │   ├── components/
│   │   │   ├── LogTable.tsx      # Data table component
│   │   │   ├── columns.tsx       # Table column definitions
│   │   │   └── ui/               # shadcn UI components
│   │   ├── hooks/
│   │   │   └── useWebSocket.ts   # WebSocket connection hook
│   │   └── lib/
│   │       └── utils.ts          # Utility functions
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── index.html
├── docker-compose.yml
├── .gitignore
└── README.md
```

## Performance Considerations

- **Database Indexing**: Indexes on timestamp, severity, and hostname for fast queries
- **WebSocket Broadcasting**: Efficient JSON serialization for minimal overhead
- **Frontend Rendering**: TanStack Table handles large datasets efficiently
- **Log Retention**: Automatic cleanup prevents unbounded database growth

## Security Notes

- Change default ports if deploying to production
- Consider firewall rules to restrict syslog access
- Use HTTPS/WSS in production (configure reverse proxy)
- Implement authentication if exposing to untrusted networks
- Monitor database storage to prevent disk exhaustion

## License

MIT

## Contributing

Contributions are welcome! Please open issues or pull requests for bugs and features.
