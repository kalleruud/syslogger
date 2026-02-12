import { useEffect, useRef } from 'react'
import BrailleLoader from './components/BrailleLoader'
import LiveIndicator from './components/LiveIndicator'
import LogRow from './components/LogRow'
import TopBar from './components/TopBar'
import { useData } from './contexts/DataContext'
import { useColumnVisibility } from './hooks/useColumnVisibility'
import './index.css'

const SCROLL_THRESHOLD = 100 // px from top to trigger loading more

export function App() {
  const { logs, isLoading, hasMore, isLoadingMore, loadMore } = useData()
  const { visibleColumns } = useColumnVisibility()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isLoadingRef = useRef(false)

  // Handle scroll event to detect when user scrolls near the top
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container || isLoading) return

    function handleScroll() {
      if (!container || isLoadingRef.current || !hasMore) return

      const scrollTop = container.scrollTop

      // Load more when scrolling near the top
      if (scrollTop <= SCROLL_THRESHOLD) {
        isLoadingRef.current = true
        loadMore().finally(() => {
          isLoadingRef.current = false
        })
      }
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [isLoading, hasMore, loadMore])

  if (isLoading)
    return (
      <div className='flex h-dvh w-screen items-center justify-center gap-2'>
        <div className='flex items-center gap-2'>
          <BrailleLoader className='text-primary' />
          Loading
        </div>
        <LiveIndicator />
      </div>
    )

  return (
    <div className='flex h-dvh flex-col'>
      <TopBar />
      <div
        ref={scrollContainerRef}
        className='mt-2 flex-1 overflow-y-auto pt-16'>
        {/* Loading indicator at top when fetching older logs */}
        {isLoadingMore && (
          <div className='flex items-center justify-center gap-2 py-2'>
            <BrailleLoader className='text-primary' />
            <span className='text-sm text-muted-foreground'>
              Loading older logs...
            </span>
          </div>
        )}

        {/* No more logs indicator */}
        {!hasMore && logs.length > 0 && (
          <div className='flex items-center justify-center py-2'>
            <span className='text-sm text-muted-foreground'>
              No more logs to load
            </span>
          </div>
        )}

        {/* Log rows */}
        {logs.map(l => (
          <LogRow
            key={l.id}
            log={l}
            visibleColumns={visibleColumns}
            className='px-1'
          />
        ))}

        {/* Empty state */}
        {logs.length === 0 && (
          <div className='flex h-full items-center justify-center'>
            <span className='text-muted-foreground'>No logs yet</span>
          </div>
        )}

        {/* Live indicator at bottom */}
        <div className='flex h-18 items-center justify-center gap-2'>
          <LiveIndicator />
        </div>
      </div>
    </div>
  )
}

export default App
