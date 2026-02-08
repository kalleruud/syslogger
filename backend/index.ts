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
const WS_UPGRADE_FAILED_STATUS = 400
const NOT_FOUND_STATUS = 404
const SERVER_ERROR_STATUS = 500

const resolveFilePath = (requestPath: string): string => {
  const isRootOrRoute = requestPath === '/' || !requestPath.includes('.')
  return isRootOrRoute ? 'index.html' : requestPath.slice(1)
}

const fileExists = async (filePath: string): Promise<boolean> => {
  const file = Bun.file(filePath)
  return file.exists()
}

const serveStaticFile = async (requestPath: string): Promise<Response> => {
  const filePath = resolveFilePath(requestPath)
  const fullPath = resolve(PUBLIC_DIR, filePath)
  const indexPath = resolve(PUBLIC_DIR, 'index.html')

  if (await fileExists(fullPath)) {
    return new Response(Bun.file(fullPath))
  }

  return new Response(Bun.file(indexPath))
}

const handleWebSocketUpgrade = (
  request: Request,
  server: { upgrade: (req: Request, data: { data: WSData }) => boolean }
): Response | undefined => {
  const upgraded = server.upgrade(request, { data: {} as WSData })
  return upgraded
    ? undefined
    : new Response('Upgrade failed', { status: WS_UPGRADE_FAILED_STATUS })
}

const handleHttpRequest = async (
  request: Request,
  server: { upgrade: (req: Request, data: { data: WSData }) => boolean }
): Promise<Response | undefined> => {
  const { pathname } = new URL(request.url)

  if (pathname === '/ws') {
    return handleWebSocketUpgrade(request, server)
  }

  if (request.method === 'OPTIONS') {
    return handlePreflight()
  }

  if (pathname.startsWith('/api/')) {
    return handleApiRoute(pathname, new URL(request.url))
  }

  if (isProduction) {
    return serveStaticFile(pathname)
  }

  return new Response('Not Found', { status: NOT_FOUND_STATUS })
}

const handleServerError = (error: Error): Response => {
  logger.error('http', `Error: ${error.message}`)
  return new Response('Server Error', { status: SERVER_ERROR_STATUS })
}

const startSyslogReceiver = async (): Promise<void> => {
  await getSyslogReceiver(SYSLOG_PORT).start()
}

const createHttpServer = () => {
  return Bun.serve<WSData>({
    port: HTTP_PORT,
    hostname: '0.0.0.0',
    websocket: createWebSocketHandler(),
    fetch: handleHttpRequest,
    error: handleServerError,
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
}

const startServer = async (): Promise<void> => {
  logger.info('server', 'Starting Syslogger backend...')

  await startSyslogReceiver()
  const server = createHttpServer()
  registerShutdownHandlers(server)
  logServerStartup()
}

await startServer()
