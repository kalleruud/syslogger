import { useVirtualizer } from '@tanstack/react-virtual'
import { useEffect, useRef } from 'react'
import BrailleLoader from './components/BrailleLoader'
import LiveIndicator from './components/LiveIndicator'
import LogRow from './components/LogRow'
import TopBar from './components/TopBar'
import { useData } from './contexts/DataContext'
import { useColumnVisibility } from './hooks/useColumnVisibility'
import './index.css'

const SCROLL_THRESHOLD = 200 // px from top to trigger loading more
const ESTIMATED_ROW_HEIGHT = 24 // Estimated height of each log row in pixels

export function App() {
  const data = useData()
  const { visibleColumns } = useColumnVisibility()
  
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isLoadingRef = useRef(false)
  const isAtBottomRef = useRef(true) // Track if user is scrolled to bottom

  // Initialize virtualizer (always call hooks unconditionally)
  const virtualizer = useVirtualizer({
    count: data.isLoading ? 0 : data.logs.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    overscan: 10, // Render 10 extra rows above/below viewport for smooth scrolling
  })

  const virtualItems = virtualizer.getVirtualItems()
  const prevLogsLengthRef = useRef(0)

  // Track if user is at the bottom for auto-scroll behavior
  useEffect(() => {
    if (data.isLoading) return

    const container = scrollContainerRef.current
    if (!container) return

    const { hasMore, loadMore } = data

    function handleScroll() {
      if (!container) return

      const { scrollTop, scrollHeight, clientHeight } = container
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight

      // Consider "at bottom" if within 50px of bottom
      isAtBottomRef.current = distanceFromBottom < 50

      // Check if we need to load more older logs
      if (scrollTop <= SCROLL_THRESHOLD && hasMore && !isLoadingRef.current) {
        isLoadingRef.current = true

        // Store the first visible item index to preserve position
        const firstVisibleIndex = virtualItems[0]?.index ?? 0

        loadMore().finally(() => {
          isLoadingRef.current = false

          // Preserve scroll position by scrolling to the same item after prepending
          requestAnimationFrame(() => {
            // Scroll to maintain the same visible content
            virtualizer.scrollToIndex(firstVisibleIndex, {
              align: 'start',
              behavior: 'auto',
            })
          })
        })
      }
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [data, virtualItems, virtualizer])

  // Auto-scroll to bottom when new logs arrive (only if user was already at bottom)
  useEffect(() => {
    if (data.isLoading) return

    const { logs } = data

    if (logs.length > prevLogsLengthRef.current && isAtBottomRef.current) {
      // New logs arrived and user is at bottom - scroll to bottom
      virtualizer.scrollToIndex(logs.length - 1, {
        align: 'end',
        behavior: 'smooth',
      })
    }
    prevLogsLengthRef.current = logs.length
  }, [data, virtualizer])

  // Show loading screen during initial load
  if (data.isLoading) {
    return (
      <div className='flex h-dvh w-screen items-center justify-center gap-2'>
        <div className='flex items-center gap-2'>
          <BrailleLoader className='text-primary' />
          Loading
        </div>
        <LiveIndicator />
      </div>
    )
  }

  const { logs, hasMore, isLoadingMore } = data

  return (
    <div className='flex h-dvh flex-col'>
      <TopBar />
      <div
        ref={scrollContainerRef}
        className='mt-2 flex-1 overflow-y-auto pt-16'>
        {/* Empty state */}
        {logs.length === 0 && (
          <div className='flex h-full items-center justify-center'>
            <span className='text-muted-foreground'>No logs yet</span>
          </div>
        )}

        {logs.length > 0 && (
          <>
            {/* Loading indicator at TOP when fetching OLDER logs */}
            {isLoadingMore && (
              <div className='flex items-center justify-center gap-2 py-2'>
                <BrailleLoader className='text-primary' />
                <span className='text-sm text-muted-foreground'>
                  Loading older logs...
                </span>
              </div>
            )}

            {/* No more OLDER logs indicator at top */}
            {!hasMore && (
              <div className='flex items-center justify-center py-2'>
                <span className='text-sm text-muted-foreground'>
                  No older logs
                </span>
              </div>
            )}

            {/* Virtual scrolling container */}
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}>

              {/* Render only visible log rows (virtual rendering) */}
              {virtualItems.map(virtualRow => {
                const log = logs[virtualRow.index]
                if (!log) return null

                return (
                  <div
                    key={virtualRow.key}
                    data-index={virtualRow.index}
                    style={{
                      position: "fixed",
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}>
                    <LogRow
                      log={log}
                      visibleColumns={visibleColumns}
                      className='px-1 '
                    />
                  </div>
                )
              })}
            </div>

            {/* Live indicator at BOTTOM (where new logs appear) */}
            <div className='flex h-18 items-center justify-center gap-2'>
              <LiveIndicator />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default App
