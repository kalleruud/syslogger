import { isLogsWithTags, type LogWithTags } from '@/database/schema'
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useConnection } from './ConnectionContext'

type DataContextType =
  | {
      isLoading: false
      logs: LogWithTags[]
    }
  | {
      isLoading: true
      logs?: never
    }

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { socket, isConnected } = useConnection()

  const [logs, setLogs] = useState<DataContextType['logs']>(undefined)

  function handleMessage(e: MessageEvent) {
    console.debug('Recieved log')
    try {
      const parsed = JSON.parse(e.data)
      if (!isLogsWithTags(parsed)) throw new Error('Received invalid log.')
      setLogs(prevLogs => [...(prevLogs ?? []), parsed])
    } catch (err) {
      if (!Error.isError(err)) throw err
      console.error(
        'Failed to parse incoming message data:',
        err.message + '\n',
        'Received:',
        e.data
      )
    }
  }

  useEffect(() => {
    if (!isConnected) return
    socket.addEventListener('message', handleMessage)
    console.debug('Listening for messages...')

    return () => {
      socket.removeEventListener('message', handleMessage)
    }
  }, [isConnected])

  const context = useMemo<DataContextType>(() => {
    if (logs === undefined) return { isLoading: true }

    return {
      isLoading: false,
      logs,
    }
  }, [logs])

  return <DataContext.Provider value={context}>{children}</DataContext.Provider>
}

export const useData = () => {
  const context = useContext(DataContext)
  if (!context) throw new Error('useData must be used inside DataProvider')
  return context
}
