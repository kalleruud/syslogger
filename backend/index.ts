import { resolve } from 'node:path'
import logger from './managers/log.manager'
import { handleCorsPreflightRequest } from './server/cors'
import { handleApiRoute } from './server/routes'
import { shutdownManager } from './server/shutdown'
import { createWebSocketHandler, type WSData } from './server/websocket'
import { getSyslogReceiver } from './syslog/receiver'

// Configuration
const HTTP_PORT = parseInt(process.env['HTTP_PORT'] ?? '3000', 10)
const SYSLOG_PORT = parseInt(process.env['SYSLOG_PORT'] ?? '5140', 10)
const PUBLIC_DIR = resolve(import.meta.dir, '../dist')

/**
 * Start the Syslogger backend server
 */
async function startServer() {
  try {
    logger.info('server', 'Starting Syslogger backend...')

    // Start UDP syslog receiver
    const receiver = getSyslogReceiver(SYSLOG_PORT)
    await receiver.start()

    // Create Bun HTTP server with WebSocket support
    const server = Bun.serve<WSData>({
      port: HTTP_PORT,
      hostname: '0.0.0.0',

      async fetch(req, server) {
        const url = new URL(req.url)
        const pathname = url.pathname

        // Handle WebSocket upgrade
        if (pathname === '/ws') {
          const upgraded = server.upgrade(req, {
            data: {} as WSData,
          })

          if (upgraded) {
            return undefined // Connection upgraded
          }

          return new Response('WebSocket upgrade failed', { status: 400 })
        }

        // Handle CORS preflight
        if (req.method === 'OPTIONS') {
          return handleCorsPreflightRequest()
        }

        // Handle API routes
        if (pathname.startsWith('/api/')) {
          return handleApiRoute(pathname, url)
        }

        // Serve static files from dist directory (production)
        if (process.env['NODE_ENV'] === 'production') {
          try {
            // Serve index.html for SPA routes
            const filePath =
              pathname === '/' || !pathname.includes('.')
                ? resolve(PUBLIC_DIR, 'index.html')
                : resolve(PUBLIC_DIR, pathname.slice(1))

            const file = Bun.file(filePath)
            const exists = await file.exists()

            if (exists) {
              return new Response(file)
            }

            // Fallback to index.html for client-side routing
            const indexFile = Bun.file(resolve(PUBLIC_DIR, 'index.html'))
            return new Response(indexFile)
          } catch {
            return new Response('Not Found', { status: 404 })
          }
        }

        // Development: proxy to Vite or return 404
        return new Response('Not Found', { status: 404 })
      },

      websocket: createWebSocketHandler(),

      error(error) {
        logger.error('http-server', `Server error: ${error.message}`)
        return new Response('Internal Server Error', { status: 500 })
      },
    })

    // Register shutdown handlers
    shutdownManager.setServer(server)
    shutdownManager.registerHandlers()

    logger.info(
      'server',
      `HTTP server listening on http://0.0.0.0:${HTTP_PORT}`
    )
    logger.info('server', `WebSocket endpoint: ws://0.0.0.0:${HTTP_PORT}/ws`)
    logger.info(
      'server',
      `UDP syslog receiver listening on 0.0.0.0:${SYSLOG_PORT}`
    )
    logger.info('server', 'Syslogger backend started successfully')
  } catch (error) {
    logger.error('server', `Failed to start server: ${error}`)
    process.exit(1)
  }
}

// Start the server
startServer()
