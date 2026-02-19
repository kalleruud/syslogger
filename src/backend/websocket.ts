import type { Log } from '@/database/schema'
import { server } from '@/syslogger'
import { randomUUIDv7 } from 'bun'
import logger from './managers/log.manager'

type BunSocket = Bun.ServerWebSocket<BunSocketData>
export type BunSocketData = {
  id: string
}

const LOGS_TOPIC = 'logs'

async function message(ws: BunSocket, message: string | Buffer<ArrayBuffer>) {
  console.debug(
    'Recieved message from client:',
    message,
    JSON.stringify(ws, undefined, 2)
  )
}

async function open(ws: BunSocket) {
  logger.debug('websocket', `Connected: ${ws.data.id}`)
  ws.subscribe(LOGS_TOPIC)
}

async function close(ws: BunSocket) {
  logger.debug('websocket', `Disconnected: ${ws.data.id}`)
  ws.unsubscribe(LOGS_TOPIC)
}

export function broadcastLog(log: Log) {
  return server.publish(LOGS_TOPIC, JSON.stringify(log))
}

export const wsEndpoint: Bun.Serve.RoutesWithUpgrade<BunSocketData, string> = {
  '/ws': {
    async GET(req, server) {
      // Upgrade HTTP request to WebSocket connection
      const success = server.upgrade(req, { data: { id: randomUUIDv7() } })

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
