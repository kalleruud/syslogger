import {
  initDatabase,
  getLogs,
  getLogCount,
  getUniqueAppnames,
  closeDatabase,
} from "./database/database.js";
import { startSyslogReceiver } from "./syslog-receiver.js";
import { setServer } from "./websocket.js";
import { startCleanupTask } from "./cleanup.js";
import path from "path";
import fs from "fs";

const SYSLOG_PORT = parseInt(process.env.SYSLOG_PORT || "5140", 10);
const HTTP_PORT = parseInt(process.env.HTTP_PORT || "3000", 10);
const RETENTION_DAYS = parseInt(process.env.RETENTION_DAYS || "30", 10);

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const types: Record<string, string> = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml",
  };
  return types[ext] || "application/octet-stream";
}

function parseQueryParams(url: URL) {
  const limit = parseInt(url.searchParams.get("limit") || "100", 10);
  const offset = parseInt(url.searchParams.get("offset") || "0", 10);
  const search = url.searchParams.get("search") || undefined;
  const hostname = url.searchParams.get("hostname") || undefined;

  const severityParam = url.searchParams.get("severity");
  const severities = severityParam
    ? severityParam
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n))
    : undefined;

  const appnameParam = url.searchParams.get("appname");
  const appnames = appnameParam
    ? appnameParam
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    : undefined;

  return { limit, offset, search, hostname, severities, appnames };
}

const currentDir = import.meta.dir || process.cwd();
const frontendPath = path.join(currentDir, "../../frontend/dist");

const server = Bun.serve({
  port: HTTP_PORT,
  hostname: "0.0.0.0",
  fetch(req, server) {
    // Try WebSocket upgrade first
    if (server.upgrade(req)) return undefined;

    const url = new URL(req.url);

    // CORS headers
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 200, headers });
    }

    // API: unique appnames
    if (url.pathname === "/api/appnames") {
      try {
        const appnames = getUniqueAppnames();
        return new Response(JSON.stringify(appnames), {
          headers: { ...headers, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error fetching appnames:", error);
        return new Response(
          JSON.stringify({ error: "Failed to fetch appnames" }),
          {
            status: 500,
            headers: { ...headers, "Content-Type": "application/json" },
          },
        );
      }
    }

    // API: log count
    if (url.pathname === "/api/logs/count") {
      try {
        const { search, hostname, severities, appnames } =
          parseQueryParams(url);
        const count = getLogCount({ search, hostname, severities, appnames });
        return new Response(JSON.stringify({ count }), {
          headers: { ...headers, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error fetching log count:", error);
        return new Response(
          JSON.stringify({ error: "Failed to fetch count" }),
          {
            status: 500,
            headers: { ...headers, "Content-Type": "application/json" },
          },
        );
      }
    }

    // API: logs
    if (url.pathname === "/api/logs") {
      try {
        const { limit, offset, search, hostname, severities, appnames } =
          parseQueryParams(url);
        const logs = getLogs({
          limit,
          offset,
          search,
          hostname,
          severities,
          appnames,
        });
        return new Response(JSON.stringify(logs), {
          headers: { ...headers, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error fetching logs:", error);
        return new Response(JSON.stringify({ error: "Failed to fetch logs" }), {
          status: 500,
          headers: { ...headers, "Content-Type": "application/json" },
        });
      }
    }

    // Serve static files from frontend/dist
    let filePath = url.pathname === "/" ? "/index.html" : url.pathname;

    const fullPath = path.join(frontendPath, filePath);

    try {
      const stat = fs.statSync(fullPath);
      if (stat.isFile()) {
        const content = fs.readFileSync(fullPath);
        const contentType = getContentType(fullPath);
        return new Response(content, {
          headers: { ...headers, "Content-Type": contentType },
        });
      }
    } catch (e) {
      // File not found, fall through to SPA routing
    }

    // SPA routing: serve index.html for unmatched routes
    try {
      const indexPath = path.join(frontendPath, "index.html");
      if (fs.existsSync(indexPath)) {
        const content = fs.readFileSync(indexPath);
        return new Response(content, {
          headers: { ...headers, "Content-Type": "text/html" },
        });
      }
    } catch (e) {
      // Fall through to 404
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  },
  websocket: {
    open(ws) {
      ws.subscribe("logs");
    },
    close(ws) {
      ws.unsubscribe("logs");
    },
    message(ws, message) {
      // No client->server messages expected
    },
  },
});

// Provide server reference for broadcasting
setServer(server);

// Start syslog receiver
startSyslogReceiver(SYSLOG_PORT);

// Start cleanup task
startCleanupTask(RETENTION_DAYS);

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("Shutting down...");
  closeDatabase();
  server.stop();
  process.exit(0);
});

console.log(`Server listening on port ${HTTP_PORT}`);
console.log(`Syslog receiver listening on port ${SYSLOG_PORT}`);
console.log(`Database: ${DB_PATH}`);
