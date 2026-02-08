import type { LogWithTags } from '@database/queries'
import type { ServerWebSocket } from 'bun'
import logger from '../managers/log.manager'

export interface WSData {
  id: string
  connectedAt: Date
}

class WebSocketManager {
  private connections = new Set<ServerWebSocket<WSData>>()
  private nextId = 1

  connect(ws: ServerWebSocket<WSData>) {
    ws.data.id = `ws-${this.nextId++}`
    ws.data.connectedAt = new Date()
    this.connections.add(ws)
    logger.info(
      'ws',
      `Client connected: ${ws.data.id} (total: ${this.connections.size})`
    )
    this.send(ws, { type: 'ping' })
  }

  disconnect(ws: ServerWebSocket<WSData>) {
    this.connections.delete(ws)
    logger.info(
      'ws',
      `Client disconnected: ${ws.data.id} (total: ${this.connections.size})`
    )
  }

  broadcastLog(log: LogWithTags) {
    this.broadcast(JSON.stringify({ type: 'log', data: log }))
  }

  private broadcast(json: string) {
    for (const ws of this.connections) {
      try {
        ws.send(json)
      } catch {
        this.connections.delete(ws)
      }
    }
  }

  private send(ws: ServerWebSocket<WSData>, msg: object) {
    try {
      ws.send(JSON.stringify(msg))
    } catch {
      this.connections.delete(ws)
    }
  }

  async closeAll() {
    logger.info('ws', `Closing ${this.connections.size} connections`)
    for (const ws of this.connections) {
      try {
        ws.close(1000, 'Server shutting down')
      } catch {
        // Ignore
      }
    }
    this.connections.clear()
  }
}

export const wsManager = new WebSocketManager()

export const createWebSocketHandler = () => ({
  open: (ws: ServerWebSocket<WSData>) => wsManager.connect(ws),
  message: () => {},
  close: (ws: ServerWebSocket<WSData>) => wsManager.disconnect(ws),
  error: (ws: ServerWebSocket<WSData>, error: Error) =>
    logger.error('ws', `Error for ${ws.data.id}: ${error.message}`),
})
