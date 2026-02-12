import { LoaderCircle } from 'lucide-react'
import LiveIndicator from './components/LiveIndicator'
import LogRow from './components/LogRow'
import TopBar from './components/TopBar'
import { useData } from './contexts/DataContext'
import { useColumnVisibility } from './hooks/useColumnVisibility'
import './index.css'

export function App() {
  const { logs, isLoading } = useData()
  const { visibleColumns } = useColumnVisibility()

  if (isLoading)
    return (
      <div className='flex h-dvh w-screen items-center justify-center gap-2'>
        <div className='flex items-center gap-2'>
          <LoaderCircle className='size-4 animate-spin text-primary' />
          Loading
        </div>
        <LiveIndicator />
      </div>
    )
  return (
    <div className='flex h-dvh flex-col'>
      <TopBar />
      <div className='flex-1 overflow-y-auto pt-16 mt-2'>
        {logs.map(l => (
          <LogRow
            key={l.id}
            log={l}
            visibleColumns={visibleColumns}
            className='px-1'
          />
        ))}
        <div className='flex h-18 items-center justify-center gap-2'>
          <LiveIndicator />
        </div>
      </div>
    </div>
  )
}

export default App
