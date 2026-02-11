import type { LogWithTags } from '@/database/schema'
import logger from './managers/log.manager'
import { server } from '@/syslogger'

export type BunSocket = Bun.ServerWebSocket<BunSocketData>
export type BunSocketData = {
  id: string
}

const LOGS_TOPIC = 'logs'

const clients: Map<BunSocketData['id'], BunSocket> = new Map()

async function message(ws: BunSocket, message: string | Buffer<ArrayBuffer>) {
  console.debug(
    'Recieved message from client:',
    message,
    JSON.stringify(ws, undefined, 2)
  )
}

async function open(ws: BunSocket) {
  logger.debug('websocket', `Connected: ${ws.data.id}`)
  clients.set(ws.data.id, ws)
  ws.subscribe(LOGS_TOPIC)
}

async function close(ws: BunSocket) {
  logger.debug('websocket', `Disconnected: ${ws.data.id}`)
  ws.unsubscribe(LOGS_TOPIC)
  clients.delete(ws.data.id)
}

export function broadcastLog(log: LogWithTags) {
  const result = server.publish(LOGS_TOPIC, JSON.stringify(log))
  if (result <= 0) throw new Error(`Failed to send log to clients: ${result}`)
  return result
}

export const wsEndpoint: Bun.Serve.RoutesWithUpgrade<BunSocketData, string> = {
  '/ws': {
    async GET(req, server) {
      // Upgrade HTTP request to WebSocket connection
      const success = server.upgrade(req, { data: { id: 'test' } })

      // Return a fallback response if upgrade fails
      if (!success) {
        return new Response('WebSocket upgrade failed', { status: 400 })
      }

      // The connection is handled by the websocket handlers
      return undefined
    },
  },
}

export const wsConfig: Bun.WebSocketHandler<BunSocketData> = {
  data: {} as BunSocketData,
  message: message,
  open: open,
  close: close,
}
