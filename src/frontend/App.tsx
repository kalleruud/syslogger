import { useVirtualizer } from '@tanstack/react-virtual'
import { useEffect, useRef } from 'react'
import BrailleLoader from './components/BrailleLoader'
import LiveIndicator from './components/LiveIndicator'
import LogRow from './components/LogRow'
import TopBar from './components/TopBar'
import { useData } from './contexts/DataContext'
import { useColumnVisibility } from './hooks/useColumnVisibility'
import './index.css'

const ESTIMATED_ROW_HEIGHT = 24

export default function App() {
  const data = useData()
  const { visibleColumns } = useColumnVisibility()
  const parentRef = useRef<HTMLDivElement>(null)

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const rowVirtualizer = useVirtualizer({
    count: data.isLoading
      ? 0
      : data.hasMore
        ? data.logs.length + 1
        : data.logs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    overscan: 5,
  })

  // Trigger loading more when scrolling near the TOP (for older logs)
  useEffect(() => {
    if (data.isLoading) return

    const [firstItem] = rowVirtualizer.getVirtualItems()

    if (!firstItem) {
      return
    }

    if (firstItem.index === 0 && data.hasMore && !data.isLoadingMore) {
      data.loadMore()
    }
  }, [data, rowVirtualizer])

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
          <>
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}>
              {rowVirtualizer.getVirtualItems().map(virtualRow => {
                const isLoaderRow = virtualRow.index > logs.length - 1
                const log = logs[virtualRow.index]

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
                    {isLoaderRow ? (
                      hasMore ? (
                        <div className='flex items-center justify-center gap-2 py-2'>
                          <BrailleLoader className='text-primary' />
                          <span className='text-sm text-muted-foreground'>
                            Loading older logs...
                          </span>
                        </div>
                      ) : (
                        <div className='flex items-center justify-center py-2'>
                          <span className='text-sm text-muted-foreground'>
                            No older logs
                          </span>
                        </div>
                      )
                    ) : log ? (
                      <LogRow
                        log={log}
                        visibleColumns={visibleColumns}
                        className='px-1'
                      />
                    ) : null}
                  </div>
                )
              })}
            </div>

            {/* Live indicator at BOTTOM - outside virtual container */}
            <div className='flex h-18 w-full items-center justify-center gap-2'>
              <LiveIndicator />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
 