import logger from '@/backend/managers/log.manager'
import type { LogWithTags } from '@/database/queries'
import type { ServerWebSocket } from 'bun'

export interface WSData {
  id: string
  connectedAt: Date
}

const WS_ID_PREFIX = 'ws-'
const WS_CLOSE_CODE_NORMAL = 1000
const WS_CLOSE_REASON = 'Server shutting down'

const MESSAGE_TYPE = {
  PING: 'ping',
  LOG: 'log',
} as const

const generateConnectionId = (counter: number): string => {
  return `${WS_ID_PREFIX}${counter}`
}

const createPingMessage = () => ({
  type: MESSAGE_TYPE.PING,
})

const createLogMessage = (log: LogWithTags) => ({
  type: MESSAGE_TYPE.LOG,
  data: log,
})

const serializeMessage = (message: object): string => {
  return JSON.stringify(message)
}

class WebSocketManager {
  private readonly connections = new Set<ServerWebSocket<WSData>>()
  private connectionIdCounter = 1

  private initializeConnection(ws: ServerWebSocket<WSData>): void {
    ws.data.id = generateConnectionId(this.connectionIdCounter++)
    ws.data.connectedAt = new Date()
  }

  private logConnectionEstablished(connectionId: string): void {
    logger.info(
      'ws',
      `Client connected: ${connectionId} (total: ${this.connections.size})`
    )
  }

  private sendInitialPing(ws: ServerWebSocket<WSData>): void {
    this.sendToClient(ws, createPingMessage())
  }

  connect(ws: ServerWebSocket<WSData>): void {
    this.initializeConnection(ws)
    this.connections.add(ws)
    this.logConnectionEstablished(ws.data.id)
    this.sendInitialPing(ws)
  }

  private logConnectionClosed(connectionId: string): void {
    logger.info(
      'ws',
      `Client disconnected: ${connectionId} (total: ${this.connections.size})`
    )
  }

  disconnect(ws: ServerWebSocket<WSData>): void {
    this.connections.delete(ws)
    this.logConnectionClosed(ws.data.id)
  }

  broadcastLog(log: LogWithTags): void {
    const message = createLogMessage(log)
    this.broadcastMessage(serializeMessage(message))
  }

  private broadcastMessage(serializedMessage: string): void {
    for (const connection of this.connections) {
      this.sendSerializedMessage(connection, serializedMessage)
    }
  }

  private sendSerializedMessage(
    ws: ServerWebSocket<WSData>,
    message: string
  ): void {
    try {
      ws.send(message)
    } catch {
      this.removeFailedConnection(ws)
    }
  }

  private sendToClient(ws: ServerWebSocket<WSData>, message: object): void {
    const serialized = serializeMessage(message)
    this.sendSerializedMessage(ws, serialized)
  }

  private removeFailedConnection(ws: ServerWebSocket<WSData>): void {
    this.connections.delete(ws)
  }

  private closeConnection(ws: ServerWebSocket<WSData>): void {
    try {
      ws.close(WS_CLOSE_CODE_NORMAL, WS_CLOSE_REASON)
    } catch {
      // Connection already closed or error during close - safe to ignore
    }
  }

  async closeAll(): Promise<void> {
    logger.info('ws', `Closing ${this.connections.size} connections`)

    for (const connection of this.connections) {
      this.closeConnection(connection)
    }

    this.connections.clear()
  }
}

export const wsManager = new WebSocketManager()

const handleWebSocketOpen = (ws: ServerWebSocket<WSData>): void => {
  wsManager.connect(ws)
}

const handleWebSocketMessage = (): void => {
  // No client messages expected in this implementation
}

const handleWebSocketClose = (ws: ServerWebSocket<WSData>): void => {
  wsManager.disconnect(ws)
}

const handleWebSocketError = (
  ws: ServerWebSocket<WSData>,
  error: Error
): void => {
  logger.error('ws', `Error for ${ws.data.id}: ${error.message}`)
}

export const createWebSocketHandler = () => ({
  open: handleWebSocketOpen,
  message: handleWebSocketMessage,
  close: handleWebSocketClose,
  error: handleWebSocketError,
})
