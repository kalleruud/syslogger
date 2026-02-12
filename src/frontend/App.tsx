import { useVirtualizer } from '@tanstack/react-virtual'
import { useEffect, useRef } from 'react'
import BrailleLoader from './components/BrailleLoader'
import LogRow from './components/LogRow'
import TopBar from './components/TopBar'
import { useAutoscroll } from './contexts/AutoscrollContext'
import { useData } from './contexts/DataContext'
import { useColumnVisibility } from './hooks/useColumnVisibility'
import './index.css'

const ESTIMATED_ROW_HEIGHT = 24

export default function App() {
  const data = useData()
  const { visibleColumns } = useColumnVisibility()
  const { isAutoscrollEnabled, setIsAutoscrollEnabled } = useAutoscroll()
  const parentRef = useRef<HTMLDivElement>(null)
  const prevLogsLengthRef = useRef(0)
  const hasInitiallyScrolledRef = useRef(false)

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // Calculate virtualizer count: add 1 for loader row at TOP when hasMore
  const getVirtualizerCount = () => {
    if (data.isLoading) return 0
    return data.hasMore ? data.logs.length + 1 : data.logs.length
  }

  const rowVirtualizer = useVirtualizer({
    count: getVirtualizerCount(),
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    overscan: 50,
  })

  // Track if user is at bottom and update context
  useEffect(() => {
    const container = parentRef.current
    if (!container || data.isLoading) return

    const handleScroll = () => {
      if (!container) return
      const { scrollTop, scrollHeight, clientHeight } = container
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight
      // Consider at bottom if within 100px
      const isAtBottom = distanceFromBottom < ESTIMATED_ROW_HEIGHT * 2
      setIsAutoscrollEnabled(isAtBottom)
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [data.isLoading, setIsAutoscrollEnabled])

  // Scroll to bottom on initial load AND when new logs arrive (if autoscroll enabled)
  useEffect(() => {
    if (data.isLoading) return
    if (data.logs.length === 0) return

    const lastLogIndex = data.hasMore ? data.logs.length : data.logs.length - 1

    // Initial scroll to bottom
    if (!hasInitiallyScrolledRef.current) {
      hasInitiallyScrolledRef.current = true
      requestAnimationFrame(() => {
        rowVirtualizer.scrollToIndex(lastLogIndex, {
          align: 'end',
          behavior: 'auto',
        })
      })
      prevLogsLengthRef.current = data.logs.length
      return
    }

    // Auto-scroll on new logs only if autoscroll is enabled
    const newLogsCount = data.logs?.length ?? 0
    if (newLogsCount > prevLogsLengthRef.current && isAutoscrollEnabled) {
      requestAnimationFrame(() => {
        rowVirtualizer.scrollToIndex(lastLogIndex, {
          align: 'end',
          behavior: 'smooth',
        })
      })
    }

    prevLogsLengthRef.current = newLogsCount
  }, [data, rowVirtualizer, isAutoscrollEnabled])

  // Trigger loading more when scrolling to the TOP (loader row at index 0)
  useEffect(() => {
    if (data.isLoading) return

    const [firstItem] = rowVirtualizer.getVirtualItems()

    if (!firstItem) {
      return
    }

    // When we scroll to index 0 (the loader row), trigger loading
    if (firstItem.index === 0 && data.hasMore && !data.isLoadingMore) {
      data.loadMore()
    }
  }, [data, rowVirtualizer])

  // Show loading screen during initial load
  if (data.isLoading) {
    return (
      <div className='flex h-dvh w-screen items-center justify-center gap-2'>
        <BrailleLoader className='text-primary' />
        Loading
      </div>
    )
  }

  const { logs, hasMore } = data

  return (
    <div className='flex h-dvh w-screen flex-col'>
      <TopBar />
      <div ref={parentRef} className='mt-2 flex-1 overflow-y-auto pt-16'>
        {logs.length === 0 ? (
          <div className='flex h-full w-full items-center justify-center'>
            <span className='text-muted-foreground'>No logs yet</span>
          </div>
        ) : (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}>
            {rowVirtualizer.getVirtualItems().map(virtualRow => {
              // If hasMore, index 0 is the loader row, logs start at index 1
              // If !hasMore, all indices are logs (no loader)
              const isLoaderRow = hasMore && virtualRow.index === 0
              const logIndex = hasMore ? virtualRow.index - 1 : virtualRow.index
              const log = logs[logIndex]

              // Determine content for this row
              let content: React.ReactNode = null

              if (isLoaderRow) {
                content = (
                  <div className='flex items-center justify-center gap-2 py-2'>
                    <BrailleLoader className='text-primary' />
                    <span className='text-muted-foreground'>
                      Loading older logs...
                    </span>
                  </div>
                )
              } else if (log) {
                content = (
                  <LogRow
                    log={log}
                    visibleColumns={visibleColumns}
                    className='px-1'
                  />
                )
              } else if (!hasMore && virtualRow.index === 0) {
                // Show "No older logs" message at top when no more logs
                content = (
                  <div className='flex items-center justify-center py-2'>
                    <span className='text-muted-foreground'>No older logs</span>
                  </div>
                )
              }

              return (
                <div
                  key={virtualRow.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}>
                  {content}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
