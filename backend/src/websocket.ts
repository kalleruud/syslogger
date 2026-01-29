import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { SyslogMessage, WebSocketMessage } from './types.js';

let wss: WebSocketServer;
const clients = new Set<WebSocket>();

export function initWebSocket(httpServer: Server): WebSocketServer {
  wss = new WebSocketServer({ server: httpServer });

  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');
    clients.add(ws);

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });

  return wss;
}

export function broadcastLog(log: SyslogMessage): void {
  const message: WebSocketMessage = {
    type: 'log',
    data: log,
  };

  const json = JSON.stringify(message);

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(json);
    }
  });
}

export function getClients(): Set<WebSocket> {
  return clients;
}
