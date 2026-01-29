import { createServer } from 'http';
import { initDatabase, getLogs, closeDatabase } from './database.js';
import { startSyslogReceiver } from './syslog-receiver.js';
import { initWebSocket } from './websocket.js';
import { startCleanupTask } from './cleanup.js';
import path from 'path';
import fs from 'fs';

const SYSLOG_PORT = parseInt(process.env.SYSLOG_PORT || '5140', 10);
const HTTP_PORT = parseInt(process.env.HTTP_PORT || '3000', 10);
const DB_PATH = process.env.DB_PATH || './data/logs.db';
const RETENTION_DAYS = parseInt(process.env.RETENTION_DAYS || '30', 10);

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database
initDatabase(DB_PATH);

// Create HTTP server
const httpServer = createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API endpoint for initial log fetch
  if (req.url?.startsWith('/api/logs')) {
    const url = new URL(req.url, `http://localhost:${HTTP_PORT}`);
    const limit = parseInt(url.searchParams.get('limit') || '100', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    const severity_min = url.searchParams.get('severity_min');
    const severity_max = url.searchParams.get('severity_max');
    const hostname = url.searchParams.get('hostname');
    const search = url.searchParams.get('search');

    try {
      const logs = getLogs({
        limit,
        offset,
        severityMin: severity_min ? parseInt(severity_min, 10) : undefined,
        severityMax: severity_max ? parseInt(severity_max, 10) : undefined,
        hostname: hostname || undefined,
        search: search || undefined,
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(logs));
    } catch (error) {
      console.error('Error fetching logs:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to fetch logs' }));
    }
    return;
  }

  // Serve static files from frontend/dist
  const currentDir = import.meta.dir || process.cwd();
  const frontendPath = path.join(currentDir, '../../frontend/dist');
  let filePath = req.url === '/' ? '/index.html' : req.url || '/index.html';

  // Remove query string and hash
  filePath = filePath.split('?')[0].split('#')[0];

  const fullPath = path.join(frontendPath, filePath);

  try {
    const stat = fs.statSync(fullPath);
    if (stat.isFile()) {
      const content = fs.readFileSync(fullPath);
      const contentType = getContentType(fullPath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
      return;
    }
  } catch (e) {
    // File not found, fall through to SPA routing
  }

  // SPA routing: serve index.html for unmatched routes
  try {
    const indexPath = path.join(frontendPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      const content = fs.readFileSync(indexPath);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
      return;
    }
  } catch (e) {
    // Fall through to 404
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const types: Record<string, string> = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
  };
  return types[ext] || 'application/octet-stream';
}

// Initialize WebSocket
initWebSocket(httpServer);

// Start syslog receiver
startSyslogReceiver(SYSLOG_PORT);

// Start cleanup task
startCleanupTask(RETENTION_DAYS);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down...');
  closeDatabase();
  httpServer.close(() => {
    process.exit(0);
  });
});

// Start HTTP server
httpServer.listen(HTTP_PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${HTTP_PORT}`);
  console.log(`Syslog receiver listening on port ${SYSLOG_PORT}`);
  console.log(`Database: ${DB_PATH}`);
});
