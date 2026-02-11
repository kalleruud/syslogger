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
      socket: typeof socket
      isConnected: true
    }
  | {
      socket: undefined
      isConnected: false
    }

const socket = new WebSocket('http://localhost:3791/ws')

const ConnectionContext = createContext<ConnectionContextType | undefined>(
  undefined
)

export function ConnectionProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const [isConnected, setIsConnected] = useState<
    ConnectionContextType['isConnected']
  >(socket.readyState === socket.OPEN)

  function handleMessage(e: MessageEvent) {
    console.log('Recieved message:', JSON.stringify(e.data, undefined, 2))
    setIsConnected(socket.readyState === socket.OPEN)
  }

  function handleOpen() {
    console.log('Connected to backend')
    setIsConnected(socket.readyState === socket.OPEN)
  }

  function handleClose() {
    console.warn('Disconnected from backend')
    setIsConnected(socket.readyState === socket.OPEN)
  }

  function handleError() {
    console.error('Failed to connect to backend')
    setIsConnected(socket.readyState === socket.OPEN)
  }

  useEffect(() => {
    socket.addEventListener('message', handleMessage)
    socket.addEventListener('open', handleOpen)
    socket.addEventListener('close', handleClose)
    socket.addEventListener('error', handleError)

    return () => {
      socket.removeEventListener('open', handleOpen)
      socket.removeEventListener('close', handleClose)
      socket.removeEventListener('error', handleError)
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
