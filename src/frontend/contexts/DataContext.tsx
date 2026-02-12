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

  // Fetch initial logs on mount - get newest 100 logs (DESC from DB, then reverse)
  useEffect(() => {
    async function loadInitialLogs() {
      try {
        console.debug('Fetching initial logs...')
        const result = await fetchLogs({ limit: PAGE_SIZE, offset: 0 })
        console.debug(
          `Loaded ${result.data.length} logs (total: ${result.total})`
        )

        // Logs come in DESC order (newest first), reverse to get oldest→newest for display
        const reversedLogs = [...result.data].reverse()
        setLogs(reversedLogs)
        totalRef.current = result.total
        offsetRef.current = result.data.length

        // Store the FIRST (oldest) timestamp after reversing
        if (reversedLogs.length > 0) {
          const oldestLog = reversedLogs[0]
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

  // Load more logs (older logs) for infinite scroll - triggered when scrolling UP
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
        // PREPEND older logs to the BEGINNING (they're older, so go on top)
        // Result comes in DESC order (newest first), reverse to oldest→newest
        const reversedNewLogs = [...result.data].reverse()
        setLogs(prevLogs => [...reversedNewLogs, ...(prevLogs ?? [])])

        // Update the oldest timestamp to the FIRST log after reversing
        const newOldestLog = reversedNewLogs[0]
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

  // Handle WebSocket messages - append new logs to the end (terminal style)
  const handleMessage = useCallback((e: MessageEvent) => {
    console.debug('Received log via WebSocket')
    try {
      const parsed = JSON.parse(e.data)
      if (!isLogsWithTags(parsed)) throw new Error('Received invalid log.')
      // APPEND new log to the END (newest at bottom, terminal style)
      setLogs(prevLogs => [...(prevLogs ?? []), parsed])
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
