import homepage from '../public/index.html'
import logger from './managers/log.manager'
import { apiRoutes } from './server/api-routes'
import { handlePreflight } from './server/cors'
import { shutdownManager } from './server/shutdown'
import { createWebSocketHandler, type WSData } from './server/websocket'
import { getSyslogReceiver } from './syslog/receiver'

const HTTP_PORT = Number(process.env['HTTP_PORT'] ?? '3000')
const SYSLOG_PORT = Number(process.env['SYSLOG_PORT'] ?? '5140')
const isProduction = process.env['NODE_ENV'] === 'production'

const startSyslogReceiver = async (): Promise<void> => {
  await getSyslogReceiver(SYSLOG_PORT).start()
}

const createHttpServer = () => {
  return Bun.serve<WSData>({
    port: HTTP_PORT,
    hostname: '0.0.0.0',

    // Define routes for both frontend and API
    routes: {
      // Frontend route - serves bundled React app
      '/': homepage,

      // API routes with HTTP method handlers
      ...apiRoutes,
    },

    // Development mode configuration
    development: isProduction
      ? false
      : {
          // Enable Hot Module Reloading
          hmr: true,
          // Echo console logs from browser to terminal
          console: true,
        },

    // WebSocket configuration
    websocket: createWebSocketHandler(),

    // Fallback fetch handler for routes not defined above
    fetch(req, server) {
      const { pathname } = new URL(req.url)

      // Handle WebSocket upgrade
      if (pathname === '/ws') {
        const upgraded = server.upgrade(req, { data: {} as WSData })
        return upgraded
          ? undefined
          : new Response('Upgrade failed', { status: 400 })
      }

      // Handle CORS preflight
      if (req.method === 'OPTIONS') {
        return handlePreflight()
      }

      // 404 for unmatched routes
      return new Response('Not Found', { status: 404 })
    },

    // Error handler
    error(error) {
      logger.error('http', `Server error: ${error.message}`)
      return new Response('Server Error', { status: 500 })
    },
  })
}

const registerShutdownHandlers = (server: {
  stop?: () => Promise<void>
}): void => {
  shutdownManager.setServer(server)
  shutdownManager.registerHandlers()
}

const logServerStartup = (): void => {
  logger.info(
    'server',
    `HTTP/WS on http://0.0.0.0:${HTTP_PORT}, UDP on 0.0.0.0:${SYSLOG_PORT}`
  )
  logger.info(
    'server',
    `Mode: ${isProduction ? 'production' : 'development'} with ${isProduction ? 'cached bundling' : 'HMR enabled'}`
  )
}

const startServer = async (): Promise<void> => {
  logger.info('server', 'Starting Syslogger backend...')

  await startSyslogReceiver()
  const server = createHttpServer()
  registerShutdownHandlers(server)
  logServerStartup()
}

await startServer()
