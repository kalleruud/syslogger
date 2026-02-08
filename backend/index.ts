import { resolve } from 'node:path'
import logger from './managers/log.manager'
import { handlePreflight } from './server/cors'
import { handleApiRoute } from './server/routes'
import { shutdownManager } from './server/shutdown'
import { createWebSocketHandler, type WSData } from './server/websocket'
import { getSyslogReceiver } from './syslog/receiver'

const HTTP_PORT = Number(process.env['HTTP_PORT'] ?? '3000')
const SYSLOG_PORT = Number(process.env['SYSLOG_PORT'] ?? '5140')
const PUBLIC_DIR = resolve(import.meta.dir, '../dist')
const isProduction = process.env['NODE_ENV'] === 'production'

const serveStatic = async (path: string) => {
  const filePath =
    path === '/' || !path.includes('.') ? 'index.html' : path.slice(1)
  const file = Bun.file(resolve(PUBLIC_DIR, filePath))
  return (await file.exists())
    ? new Response(file)
    : new Response(Bun.file(resolve(PUBLIC_DIR, 'index.html')))
}

const startServer = async () => {
  logger.info('server', 'Starting Syslogger backend...')

  await getSyslogReceiver(SYSLOG_PORT).start()

  const server = Bun.serve<WSData>({
    port: HTTP_PORT,
    hostname: '0.0.0.0',
    websocket: createWebSocketHandler(),

    async fetch(req, server) {
      const { pathname } = new URL(req.url)

      if (pathname === '/ws') {
        return server.upgrade(req, { data: {} as WSData })
          ? undefined
          : new Response('Upgrade failed', { status: 400 })
      }

      if (req.method === 'OPTIONS') return handlePreflight()
      if (pathname.startsWith('/api/'))
        return handleApiRoute(pathname, new URL(req.url))
      if (isProduction) return serveStatic(pathname)

      return new Response('Not Found', { status: 404 })
    },

    error: error => (
      logger.error('http', `Error: ${error.message}`),
      new Response('Server Error', { status: 500 })
    ),
  })

  shutdownManager.setServer(server)
  shutdownManager.registerHandlers()

  logger.info(
    'server',
    `HTTP/WS on http://0.0.0.0:${HTTP_PORT}, UDP on 0.0.0.0:${SYSLOG_PORT}`
  )
}

await startServer()
