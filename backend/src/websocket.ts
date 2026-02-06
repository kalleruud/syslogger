import type { Server } from 'bun'
import { SyslogMessage, WebSocketMessage } from './types.js'

let server: Server<unknown>

export function setServer(s: Server<unknown>): void {
  server = s
}

export function broadcastLog(log: SyslogMessage): void {
  const message: WebSocketMessage = {
    type: 'log',
    data: log,
  };

  server.publish("logs", JSON.stringify(message));
}
