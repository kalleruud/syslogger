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
    const ws = new WebSocket(getWebSocketUrl())

    function handleOpen() {
      console.log('Connected to backend')
      setIsConnected(true)
    }

    function handleClose() {
      console.warn('Disconnected from backend')
      setIsConnected(false)
    }

    function handleError() {
      console.error('Failed to connect to backend')
      setIsConnected(false)
    }

    ws.addEventListener('open', handleOpen)
    ws.addEventListener('close', handleClose)
    ws.addEventListener('error', handleError)

    setSocket(ws)

    return () => {
      ws.removeEventListener('open', handleOpen)
      ws.removeEventListener('close', handleClose)
      ws.removeEventListener('error', handleError)
      ws.close()
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
