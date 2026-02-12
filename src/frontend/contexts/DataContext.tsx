import { isLogsWithTags, type LogWithTags } from '@/database/schema'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { fetchLogs } from '../lib/api'
import { useConnection } from './ConnectionContext'

type DataContextType =
  | {
      isLoading: false
      logs: LogWithTags[]
      hasMore: boolean
      isLoadingMore: boolean
      loadMore: () => Promise<void>
    }
  | {
      isLoading: true
      logs?: never
      hasMore?: never
      isLoadingMore?: never
      loadMore?: never
    }

const DataContext = createContext<DataContextType | undefined>(undefined)

const PAGE_SIZE = 100

export function DataProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { socket, isConnected } = useConnection()

  const [logs, setLogs] = useState<LogWithTags[] | undefined>(undefined)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const totalRef = useRef(0)
  const offsetRef = useRef(0)
  const oldestTimestampRef = useRef<string | null>(null)

  // Fetch initial logs on mount
  useEffect(() => {
    async function loadInitialLogs() {
      try {
        console.debug('Fetching initial logs...')
        const result = await fetchLogs({ limit: PAGE_SIZE, offset: 0 })
        console.debug(
          `Loaded ${result.data.length} logs (total: ${result.total})`
        )
        setLogs(result.data)
        totalRef.current = result.total
        offsetRef.current = result.data.length

        // Store the oldest timestamp from the initial fetch
        if (result.data.length > 0) {
          const oldestLog = result.data.at(-1)
          if (oldestLog) {
            oldestTimestampRef.current = oldestLog.timestamp
            console.debug(
              `Oldest timestamp from initial fetch: ${oldestLog.timestamp}`
            )
          }
        }

        setHasMore(result.data.length < result.total)
      } catch (err) {
        console.error('Failed to load initial logs:', err)
        // Set empty array to prevent infinite loading state
        setLogs([])
        setHasMore(false)
      }
    }

    loadInitialLogs()
  }, [])

  // Load more logs (older logs) for infinite scroll
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || !oldestTimestampRef.current) return

    setIsLoadingMore(true)
    try {
      console.debug(`Loading logs older than ${oldestTimestampRef.current}...`)
      const result = await fetchLogs({
        limit: PAGE_SIZE,
        offset: 0, // Always offset 0 since we're filtering by timestamp
        beforeTimestamp: oldestTimestampRef.current,
      })
      console.debug(`Loaded ${result.data.length} more logs`)

      if (result.data.length > 0) {
        // Append older logs to the end
        setLogs(prevLogs => [...(prevLogs ?? []), ...result.data])

        // Update the oldest timestamp to the last log in the new batch
        const newOldestLog = result.data.at(-1)
        if (newOldestLog) {
          oldestTimestampRef.current = newOldestLog.timestamp
          console.debug(
            `Updated oldest timestamp to: ${newOldestLog.timestamp}`
          )
        }

        offsetRef.current += result.data.length
      }

      // If we got fewer logs than requested, there are no more
      setHasMore(result.data.length === PAGE_SIZE)
    } catch (err) {
      console.error('Failed to load more logs:', err)
    } finally {
      setIsLoadingMore(false)
    }
  }, [isLoadingMore, hasMore])

  // Handle WebSocket messages - prepend new logs to the beginning
  const handleMessage = useCallback((e: MessageEvent) => {
    console.debug('Received log via WebSocket')
    try {
      const parsed = JSON.parse(e.data)
      if (!isLogsWithTags(parsed)) throw new Error('Received invalid log.')
      // Prepend new log to the beginning (newest first)
      setLogs(prevLogs => [parsed, ...(prevLogs ?? [])])
      totalRef.current += 1
    } catch (err) {
      if (!Error.isError(err)) throw err
      console.error(
        'Failed to parse incoming message data:',
        err.message + '\n',
        'Received:',
        e.data
      )
    }
  }, [])

  useEffect(() => {
    if (!isConnected) return
    socket.addEventListener('message', handleMessage)
    console.debug('Listening for messages...')

    return () => {
      socket.removeEventListener('message', handleMessage)
    }
  }, [isConnected, socket, handleMessage])

  const context = useMemo<DataContextType>(() => {
    if (logs === undefined) return { isLoading: true }

    return {
      isLoading: false,
      logs,
      hasMore,
      isLoadingMore,
      loadMore,
    }
  }, [logs, hasMore, isLoadingMore, loadMore])

  return <DataContext.Provider value={context}>{children}</DataContext.Provider>
}

export const useData = () => {
  const context = useContext(DataContext)
  if (!context) throw new Error('useData must be used inside DataProvider')
  return context
}
