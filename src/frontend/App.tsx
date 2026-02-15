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
  const { isAutoscrollEnabled, setIsAutoscrollEnabled, scrollToBottomRef } =
    useAutoscroll()
  const parentRef = useRef<HTMLDivElement>(null)
  const prevLogsLengthRef = useRef(0)
  const hasInitiallyScrolledRef = useRef(false)
  const isInitialScrollCompleteRef = useRef(false)
  const previousScrollHeightRef = useRef(0)
  const isScrollingProgrammaticallyRef = useRef(false)

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

  // Register scroll to bottom function
  useEffect(() => {
    scrollToBottomRef.current = () => {
      if (data.isLoading || data.logs.length === 0) return
      const lastLogIndex = data.hasMore
        ? data.logs.length
        : data.logs.length - 1
      isScrollingProgrammaticallyRef.current = true
      rowVirtualizer.scrollToIndex(lastLogIndex, {
        align: 'end',
        behavior: 'smooth',
      })
      setTimeout(() => {
        isScrollingProgrammaticallyRef.current = false
      }, 500)
    }
  }, [data, rowVirtualizer, scrollToBottomRef])

  // Track if user manually scrolls away from bottom
  // Only update autoscroll state on manual scrolls, not programmatic ones
  useEffect(() => {
    const container = parentRef.current
    if (!container || data.isLoading) return

    const handleScroll = () => {
      if (!container) return

      // Ignore scroll events triggered by our own programmatic scrolling
      if (isScrollingProgrammaticallyRef.current) return

      const { scrollTop, scrollHeight, clientHeight } = container
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight

      // Consider at bottom if within 100px or scrolled to the absolute bottom
      const isAtBottom =
        distanceFromBottom <= 1 || distanceFromBottom < ESTIMATED_ROW_HEIGHT * 2

      // Only update if different from current state
      if (isAutoscrollEnabled !== isAtBottom) {
        setIsAutoscrollEnabled(isAtBottom)
      }
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [data.isLoading, isAutoscrollEnabled, setIsAutoscrollEnabled])

  // Scroll to bottom on initial load AND when new logs arrive (if autoscroll enabled)
  // Also maintain scroll position when older logs are loaded
  useEffect(() => {
    if (data.isLoading) return
    if (data.logs.length === 0) return

    const container = parentRef.current
    if (!container) return

    const lastLogIndex = data.hasMore ? data.logs.length : data.logs.length - 1

    // Initial scroll to bottom - wait for scroll to complete before enabling loadMore
    if (!hasInitiallyScrolledRef.current) {
      hasInitiallyScrolledRef.current = true
      isScrollingProgrammaticallyRef.current = true
      requestAnimationFrame(() => {
        rowVirtualizer.scrollToIndex(lastLogIndex, {
          align: 'end',
          behavior: 'auto',
        })
        // Mark scroll as complete after a short delay to ensure scrolling finished
        setTimeout(() => {
          isInitialScrollCompleteRef.current = true
          previousScrollHeightRef.current = container.scrollHeight
          isScrollingProgrammaticallyRef.current = false
          console.debug('Initial scroll to bottom completed')
        }, 100)
      })
      prevLogsLengthRef.current = data.logs.length
      return
    }

    const newLogsCount = data.logs?.length ?? 0
    const logsAdded = newLogsCount - prevLogsLengthRef.current

    // If logs were added (prepended older logs or appended new logs)
    if (logsAdded > 0) {
      const previousScrollHeight = previousScrollHeightRef.current

      // Determine if logs were prepended (older logs) or appended (new logs)
      // If we're not at the bottom and logs increased, they were likely prepended
      const wasLoadingOlder = !isAutoscrollEnabled && logsAdded > 0

      if (wasLoadingOlder) {
        // Older logs were prepended - maintain scroll position
        isScrollingProgrammaticallyRef.current = true
        requestAnimationFrame(() => {
          const newScrollHeight = container.scrollHeight
          const heightDifference = newScrollHeight - previousScrollHeight

          // Adjust scroll position to maintain visual position
          container.scrollTop += heightDifference
          previousScrollHeightRef.current = newScrollHeight

          console.debug(
            `Adjusted scroll by ${heightDifference}px after loading older logs`
          )

          // Reset flag after a short delay
          setTimeout(() => {
            isScrollingProgrammaticallyRef.current = false
          }, 50)
        })
      } else if (isAutoscrollEnabled) {
        // New logs appended and autoscroll is enabled - scroll to bottom
        isScrollingProgrammaticallyRef.current = true
        requestAnimationFrame(() => {
          rowVirtualizer.scrollToIndex(lastLogIndex, {
            align: 'end',
            behavior: 'smooth',
          })
          previousScrollHeightRef.current = container.scrollHeight

          // Reset flag after animation completes
          setTimeout(() => {
            isScrollingProgrammaticallyRef.current = false
          }, 500)
        })
      } else {
        // Update scroll height reference even if not scrolling
        previousScrollHeightRef.current = container.scrollHeight
      }
    }

    prevLogsLengthRef.current = newLogsCount
  }, [data, rowVirtualizer, isAutoscrollEnabled])

  // Trigger loading more when scrolling near the TOP
  // ONLY after the initial scroll to bottom is complete
  useEffect(() => {
    if (data.isLoading) return
    if (!isInitialScrollCompleteRef.current) return
    if (!data.hasMore || data.isLoadingMore) return

    const container = parentRef.current
    if (!container) return

    const handleScroll = () => {
      if (!container) return

      // If scrolled within 200px from the top, trigger loading more
      if (container.scrollTop < 200 && data.hasMore && !data.isLoadingMore) {
        console.debug('User scrolled near top, loading more logs...')
        data.loadMore()
      }
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [data])

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
