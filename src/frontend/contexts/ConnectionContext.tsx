import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

const AUTH_KEY = 'auth'

type ConnectionContextType = {
  socket: typeof socket
  isConnected: boolean
  setToken: typeof setToken
}

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io('/', {
  auth: { token: localStorage.getItem(AUTH_KEY) },
}).timeout(10_000)

function setToken(token: string | undefined): void {
  socket.auth.token = token
  if (token) localStorage.setItem(AUTH_KEY, token)
  else localStorage.removeItem(AUTH_KEY)
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(
  undefined
)

export function ConnectionProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const [isConnected, setIsConnected] = useState<
    ConnectionContextType['isConnected']
  >(socket.connected)

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to backend:', socket.id)
      setIsConnected(socket.connected)
    })

    socket.on('disconnect', () => {
      console.warn('Disconnected from backend')
      setIsConnected(socket.connected)
    })

    socket.on('connect_error', () => {
      setIsConnected(socket.connected)
    })

    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('connect_error')
    }
  }, [])

  const context = useMemo<ConnectionContextType>(
    () => ({
      socket,
      isConnected,
      setToken,
    }),
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
