import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

type ConnectionContextType =
  | {
      socket: WebSocket
      isConnected: true
    }
  | {
      socket: undefined
      isConnected: false
    }

const ConnectionContext = createContext<ConnectionContextType | undefined>(
  undefined
)

function getWebSocketUrl(): string {
  const protocol = globalThis.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = globalThis.location.host
  return `${protocol}//${host}/ws`
}

export function ConnectionProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const [socket, setSocket] = useState<WebSocket | undefined>(undefined)
  const [isConnected, setIsConnected] = useState(false)
  const reconnectTimeoutRef = useRef<Timer | null>(null)
  const socketRef = useRef<WebSocket | null>(null)

  function connect() {
    const wsUrl = getWebSocketUrl()
    const ws = new WebSocket(wsUrl)

    socketRef.current = ws

    ws.addEventListener('open', () => {
      console.log('Connected to backend')
      setIsConnected(true)
      setSocket(ws)
    })

    ws.addEventListener('close', () => {
      console.warn('Disconnected from backend')
      setIsConnected(false)
      setSocket(undefined)

      // Attempt reconnection after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('Attempting to reconnect...')
        connect()
      }, 3000)
    })

    ws.addEventListener('error', () => {
      console.error('WebSocket error occurred')
      setIsConnected(false)
    })
  }

  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (socketRef.current) {
        socketRef.current.close()
      }
    }
  }, [])

  const context = useMemo<ConnectionContextType>(
    () =>
      isConnected && socket
        ? {
            socket,
            isConnected: true,
          }
        : {
            socket: undefined,
            isConnected: false,
          },
    [isConnected, socket]
  )

  return (
    <ConnectionContext.Provider value={context}>
      {children}
    </ConnectionContext.Provider>
  )
}

export const useConnection = () => {
  const context = useContext(ConnectionContext)
  if (!context)
    throw new Error('useConnection must be used inside ConnectionProvider')
  return context
}
