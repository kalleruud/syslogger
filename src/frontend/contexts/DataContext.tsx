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
import { useFilters } from './FilterContext'

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
  const { filters, applyFiltersToLog } = useFilters()

  const [logs, setLogs] = useState<LogWithTags[] | undefined>(undefined)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const totalRef = useRef(0)
  const offsetRef = useRef(0)
  const oldestTimestampRef = useRef<string | null>(null)
  const isInitialLoadCompleteRef = useRef(false)

  // Fetch initial logs on mount - get newest 100 logs (DESC from DB, then reverse)
  // Refetch when filters change
  useEffect(() => {
    // Reset initial load flag when filters change
    isInitialLoadCompleteRef.current = false

    async function loadInitialLogs() {
      console.debug('Fetching initial logs with filters:', filters)

      // Convert excluded severities to included severities
      const includedSeverities =
        filters.excludedSeverity.length > 0
          ? [0, 1, 2, 3, 4, 5, 6, 7].filter(
              s => !filters.excludedSeverity.includes(s)
            )
          : undefined // undefined = all severities

      const appnameFilter =
        filters.appname.length > 0 ? filters.appname : undefined
      const tagIdsFilter =
        filters.tagIds.length > 0 ? filters.tagIds : undefined
      const hostnameFilter =
        filters.hostname.length > 0 ? filters.hostname : undefined
      const searchFilter =
        filters.search.length > 0 ? filters.search : undefined

      try {
        const result = await fetchLogs({
          limit: PAGE_SIZE,
          offset: 0,
          severity: includedSeverities,
          appname: appnameFilter,
          tagIds: tagIdsFilter,
          hostname: hostnameFilter,
          search: searchFilter,
        })
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
        isInitialLoadCompleteRef.current = true
      } catch (err) {
        console.error('Failed to load initial logs:', err)
        // Set empty array to prevent infinite loading state
        setLogs([])
        setHasMore(false)
        isInitialLoadCompleteRef.current = true
      }
    }

    loadInitialLogs()
  }, [filters])

  // Load more logs (older logs) for infinite scroll - triggered when scrolling UP
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || !oldestTimestampRef.current) return

    setIsLoadingMore(true)

    console.debug(`Loading logs older than ${oldestTimestampRef.current}...`)

    // Convert excluded severities to included severities
    const includedSeverities =
      filters.excludedSeverity.length > 0
        ? [0, 1, 2, 3, 4, 5, 6, 7].filter(
            s => !filters.excludedSeverity.includes(s)
          )
        : undefined // undefined = all severities

    const appnameFilter =
      filters.appname.length > 0 ? filters.appname : undefined
    const tagIdsFilter = filters.tagIds.length > 0 ? filters.tagIds : undefined
    const hostnameFilter =
      filters.hostname.length > 0 ? filters.hostname : undefined
    const searchFilter = filters.search.length > 0 ? filters.search : undefined

    try {
      const result = await fetchLogs({
        limit: PAGE_SIZE,
        offset: 0, // Always offset 0 since we're filtering by timestamp
        beforeTimestamp: oldestTimestampRef.current,
        severity: includedSeverities,
        appname: appnameFilter,
        tagIds: tagIdsFilter,
        hostname: hostnameFilter,
        search: searchFilter,
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
      setIsLoadingMore(false)
    } catch (err) {
      console.error('Failed to load more logs:', err)
      setIsLoadingMore(false)
    }
  }, [isLoadingMore, hasMore, filters])

  // Handle WebSocket messages - append new logs to the end (terminal style)
  // Apply filters client-side to incoming WebSocket messages
  const handleMessage = useCallback(
    (e: MessageEvent) => {
      console.debug('Received log via WebSocket')

      let parsed
      try {
        parsed = JSON.parse(e.data)
      } catch (err) {
        if (Error.isError(err)) {
          console.error(
            'Failed to parse incoming message data:',
            err.message + '\n',
            'Received:',
            e.data
          )
        }
        return
      }

      if (!isLogsWithTags(parsed)) {
        console.error('Received invalid log.')
        return
      }

      // Apply filters client-side
      if (!applyFiltersToLog(parsed)) {
        console.debug('Log filtered out by client-side filters')
        return
      }

      // APPEND new log to the END (newest at bottom, terminal style)
      setLogs(prevLogs => [...(prevLogs ?? []), parsed])
      totalRef.current += 1
    },
    [applyFiltersToLog]
  )

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

// eslint-disable-next-line react-refresh/only-export-components
export const useData = () => {
  const context = useContext(DataContext)
  if (!context) throw new Error('useData must be used inside DataProvider')
  return context
}
