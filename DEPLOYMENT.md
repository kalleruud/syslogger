# Syslogger Deployment Guide

This guide covers deploying Syslogger using Bun's fullstack dev server with both development and production configurations.

## Architecture Overview

Syslogger now uses **Bun.serve()** with integrated fullstack capabilities:

- **Frontend**: React app bundled and served via HTML imports
- **Backend**: API routes defined in Bun.serve with WebSocket support
- **Development**: Hot Module Reloading (HMR) + console log streaming
- **Production**: Ahead-of-time bundling or runtime bundling with caching

## Development Mode

### Quick Start

```bash
# Install dependencies
bun install

# Run development server with HMR
bun dev
```

### Development Features

- **Hot Module Reloading**: Changes to frontend code automatically reload
- **Console Streaming**: Browser console logs appear in terminal
- **Source Maps**: Full debugging support with original source code
- **Auto-bundling**: TypeScript, JSX, and CSS processed on-the-fly

### Environment Variables

Create a `.env` file in the project root:

```env
NODE_ENV=development
HTTP_PORT=3000
SYSLOG_PORT=5140
```

### Development Access

- **Web Interface**: http://localhost:3000
- **API Endpoints**: http://localhost:3000/api/\*
- **WebSocket**: ws://localhost:3000/ws
- **Syslog UDP**: localhost:5140

## Production Deployment

### Option 1: Direct Production Build (Recommended)

```bash
# Build the fullstack application
bun run build

# Run the production server
NODE_ENV=production bun run start:dist
```

This creates an optimized bundle in the `dist/` directory with:

- Minified JavaScript/TypeScript
- Bundled CSS with content-addressable hashes
- All frontend assets embedded in the backend bundle

### Option 2: Runtime Bundling

```bash
# Run without building
NODE_ENV=production bun run start
```

This enables in-memory caching of bundled assets on first request.

### Production Features

- **Asset Caching**: ETag and Cache-Control headers
- **Minification**: Optimized JavaScript and CSS
- **Content Hashing**: Cache-busting URLs for all assets
- **Zero Dependencies**: Fully bundled, no node_modules needed

## Docker Deployment

### Build and Run with Docker Compose

```bash
# Build and start the container
docker-compose up --build -d

# View logs
docker-compose logs -f syslogger

# Stop the container
docker-compose down
```

### Manual Docker Build

```bash
# Build the image
docker build -t syslogger:latest .

# Run the container
docker run -d \
  --name syslogger \
  -p 3000:3000 \
  -p 5140:5140/udp \
  -v syslogger-data:/app/data \
  syslogger:latest
```

### Docker Features

- **Multi-stage build**: Optimized image size
- **Health checks**: Automatic container health monitoring
- **Volume persistence**: SQLite data persists across restarts
- **Resource limits**: CPU and memory constraints configured
- **Non-root user**: Runs as `bun` user for security

### Production Environment Variables

```env
NODE_ENV=production
HTTP_PORT=3000
SYSLOG_PORT=5140
```

## Architecture Details

### File Structure

```
syslogger/
├── backend/
│   ├── server.ts           # Main Bun.serve configuration
│   ├── server/
│   │   ├── api-routes.ts   # API route handlers
│   │   ├── websocket.ts    # WebSocket handlers
│   │   └── cors.ts         # CORS configuration
│   ├── database/           # Drizzle ORM schema and queries
│   ├── syslog/             # Syslog receiver and parsers
│   └── managers/           # Logging and utilities
├── frontend/
│   ├── main.tsx            # React app entry point
│   ├── components/         # React components
│   └── views/              # Page views
├── public/
│   └── index.html          # HTML entry point (imported by Bun.serve)
├── dist/                   # Production build output
└── data/                   # SQLite database storage
```

### How It Works

1. **HTML Import**: `backend/server.ts` imports `public/index.html`
2. **Bun.serve Routes**: HTML is mapped to `/` route
3. **Asset Bundling**: Bun scans `<script>` and `<link>` tags
4. **Frontend Bundle**: TypeScript/JSX/CSS processed and bundled
5. **API Routes**: Defined with HTTP method handlers in `routes` config
6. **WebSocket**: Handled via `fetch()` fallback for `/ws` path

### Production Build Process

```bash
bun build --target=bun --production --outdir=dist ./backend/server.ts
```

This command:

- Bundles backend code with embedded frontend assets
- Processes all TypeScript, JSX, and CSS
- Generates content-addressable filenames
- Creates a single executable bundle

## Monitoring and Health

### Health Check Endpoint

```bash
curl http://localhost:3000/api/stats
```

Returns server statistics:

```json
{
  "messagesReceived": 1234,
  "messagesProcessed": 1234,
  "messagesFailed": 0,
  "uptime": 3600000
}
```

### Docker Health Checks

The Docker container includes automatic health monitoring:

- Checks every 30 seconds
- 3 retries before marking unhealthy
- 10-second timeout per check

## Troubleshooting

### Development Server Not Starting

```bash
# Check if port is in use
lsof -i :3000

# Kill the process if needed
kill -9 <PID>
```

### Production Build Issues

```bash
# Clear dist directory
rm -rf dist/

# Rebuild
bun run build
```

### Docker Issues

```bash
# View container logs
docker-compose logs -f

# Restart container
docker-compose restart

# Rebuild from scratch
docker-compose down -v
docker-compose up --build
```

### WebSocket Connection Issues

Ensure the WebSocket path is correctly configured:

- Development: `ws://localhost:3000/ws`
- Production: `wss://your-domain.com/ws` (use HTTPS/WSS in production)

## Performance Optimization

### Production Checklist

- ✅ Build with `bun build` for optimal performance
- ✅ Use Docker multi-stage builds to minimize image size
- ✅ Enable volume persistence for database
- ✅ Configure resource limits in docker-compose.yml
- ✅ Use reverse proxy (nginx/Caddy) for HTTPS termination
- ✅ Monitor container health and logs

### Recommended Production Stack

```
┌─────────────┐
│   Caddy     │  HTTPS termination, reverse proxy
└──────┬──────┘
       │
┌──────▼──────┐
│  Syslogger  │  Docker container
│  (Bun)      │  Port 3000 (HTTP/WS)
│             │  Port 5140 (UDP/syslog)
└──────┬──────┘
       │
┌──────▼──────┐
│   SQLite    │  Volume-mounted database
└─────────────┘
```

## Security Considerations

1. **Non-root user**: Container runs as `bun` user
2. **Volume isolation**: Database stored in dedicated volume
3. **Resource limits**: CPU/memory constraints configured
4. **Health monitoring**: Automatic container health checks
5. **CORS**: Configured in `backend/server/cors.ts`
6. **Environment variables**: Never commit `.env` files

## Scaling

For high-traffic deployments:

1. Use a reverse proxy (nginx, Caddy) for load balancing
2. Consider multiple instances with shared database
3. Implement database connection pooling
4. Monitor resource usage and adjust limits
5. Use a proper syslog relay (rsyslog/syslog-ng) for aggregation

## Support

For issues or questions:

- Check the logs: `docker-compose logs -f`
- Review the health endpoint: `/api/stats`
- Verify environment configuration
- Check network connectivity for UDP port 5140
