import type { LogWithTags } from '@database/queries'
import type { ServerWebSocket } from 'bun'
import logger from '../managers/log.manager'

/**
 * WebSocket connection data
 */
export interface WSData {
  id: string
  connectedAt: Date
}

/**
 * WebSocket message types
 */
type WSMessage =
  | { type: 'log'; data: LogWithTags }
  | { type: 'ping' }
  | { type: 'error'; message: string }

/**
 * WebSocket manager for broadcasting log messages to connected clients
 */
class WebSocketManager {
  private readonly connections: Set<ServerWebSocket<WSData>> = new Set()
  private nextId = 1

  /**
   * Handle new WebSocket connection
   */
  handleConnection(ws: ServerWebSocket<WSData>): void {
    const id = `ws-${this.nextId++}`
    ws.data.id = id
    ws.data.connectedAt = new Date()

    this.connections.add(ws)
    logger.info(
      'websocket',
      `Client connected: ${id} (total: ${this.connections.size})`
    )

    // Send initial ping to confirm connection
    this.sendToClient(ws, { type: 'ping' })
  }

  /**
   * Handle WebSocket disconnection
   */
  handleDisconnection(ws: ServerWebSocket<WSData>): void {
    this.connections.delete(ws)
    logger.info(
      'websocket',
      `Client disconnected: ${ws.data.id} (total: ${this.connections.size})`
    )
  }

  /**
   * Broadcast a log message to all connected clients
   */
  broadcastLog(log: LogWithTags): void {
    const message: WSMessage = { type: 'log', data: log }
    this.broadcast(message)
  }

  /**
   * Broadcast a message to all connected clients
   */
  private broadcast(message: WSMessage): void {
    const json = JSON.stringify(message)
    const deadConnections: ServerWebSocket<WSData>[] = []

    for (const ws of this.connections) {
      try {
        ws.send(json)
      } catch (error) {
        logger.error('websocket', `Failed to send to ${ws.data.id}: ${error}`)
        deadConnections.push(ws)
      }
    }

    // Clean up dead connections
    for (const ws of deadConnections) {
      this.connections.delete(ws)
    }
  }

  /**
   * Send a message to a specific client
   */
  private sendToClient(ws: ServerWebSocket<WSData>, message: WSMessage): void {
    try {
      ws.send(JSON.stringify(message))
    } catch (error) {
      logger.error('websocket', `Failed to send to ${ws.data.id}: ${error}`)
      this.connections.delete(ws)
    }
  }

  /**
   * Close all connections gracefully
   */
  async closeAll(): Promise<void> {
    logger.info(
      'websocket',
      `Closing ${this.connections.size} WebSocket connections`
    )

    for (const ws of this.connections) {
      try {
        ws.close(1000, 'Server shutting down')
      } catch (error) {
        logger.error('websocket', `Error closing ${ws.data.id}: ${error}`)
      }
    }

    this.connections.clear()
  }

  /**
   * Get connection count
   */
  getConnectionCount(): number {
    return this.connections.size
  }
}

// Singleton instance
export const wsManager = new WebSocketManager()

/**
 * WebSocket upgrade handler for Bun server
 */
export function createWebSocketHandler() {
  return {
    open(ws: ServerWebSocket<WSData>) {
      wsManager.handleConnection(ws)
    },

    message(ws: ServerWebSocket<WSData>, message: string | Buffer) {
      // Handle incoming messages from clients (if needed)
      // For now, this is a one-way broadcast system
      logger.debug(
        'websocket',
        `Received message from ${ws.data.id}: ${message}`
      )
    },

    close(ws: ServerWebSocket<WSData>) {
      wsManager.handleDisconnection(ws)
    },

    error(ws: ServerWebSocket<WSData>, error: Error) {
      logger.error(
        'websocket',
        `WebSocket error for ${ws.data.id}: ${error.message}`
      )
    },
  }
}
