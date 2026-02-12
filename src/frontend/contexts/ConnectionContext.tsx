import {
  createContext,
  useContext,
  useEffect,
  useMemo,
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

function getWebSocketUrl(): string {
  const protocol = globalThis.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = globalThis.location.host
  return `${protocol}//${host}/ws`
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(
  undefined
)

export function ConnectionProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const [socket, setSocket] = useState<WebSocket | undefined>(undefined)
  const [isConnected, setIsConnected] =
    useState<ConnectionContextType['isConnected']>(false)

  useEffect(() => {
    let ws: WebSocket | null = null
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null

    function connect() {
      ws = new WebSocket(getWebSocketUrl())

      ws.addEventListener('open', () => {
        console.log('Connected to backend')
        setSocket(ws!)
        setIsConnected(true)
      })

      ws.addEventListener('close', () => {
        console.warn('Disconnected from backend')
        setSocket(undefined)
        setIsConnected(false)
        reconnectTimeout = setTimeout(connect, 2000)
      })

      ws.addEventListener('error', () => {
        console.error('Failed to connect to backend')
      })
    }

    connect()

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
      ws?.close()
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
    [socket, isConnected]
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
