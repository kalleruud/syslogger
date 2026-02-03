import { useEffect, useRef, useState, useCallback } from 'react';
import { SyslogMessage, WebSocketMessage } from '../types';

export function useWebSocket(onLog: (log: SyslogMessage) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const onLogRef = useRef(onLog);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 10;
  const RECONNECT_INTERVAL = 3000;

  // Keep ref in sync so the WebSocket connection remains stable across callback changes
  onLogRef.current = onLog;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      // Connect to backend server (port 3000) instead of current host
      const backendUrl = `${protocol}://localhost:3000`;
      const ws = new WebSocket(backendUrl);

      ws.onopen = () => {
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          if (message.type === 'log') {
            onLogRef.current(message.data);
          }
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error('Failed to parse WebSocket message:', error);
          }
        }
      };

      ws.onerror = () => {
        setIsConnected(false);
      };

      ws.onclose = () => {
        setIsConnected(false);

        // Attempt to reconnect
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, RECONNECT_INTERVAL);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to create WebSocket:', error);
      }
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return { isConnected };
}
