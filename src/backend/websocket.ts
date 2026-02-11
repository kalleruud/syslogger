import logger from './managers/log.manager'

export type BunSocket = Bun.ServerWebSocket<BunSocketData>
export type BunSocketData = {
  id: string
}

const clients: Map<BunSocketData['id'], BunSocket> = new Map()

export async function open(ws: BunSocket) {
  logger.debug('websocket', `Connected: ${ws.data.id}`)
  clients.set(ws.data.id, ws)
}

export async function close(ws: BunSocket) {
  logger.debug('websocket', `Disconnected: ${ws.data.id}`)
  clients.delete(ws.data.id)
}

export function broadcast(data: any) {
  clients.forEach(ws => ws.send(data))
}
