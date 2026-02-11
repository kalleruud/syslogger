import { LoaderCircle } from 'lucide-react'
import LiveIndicator from './components/LiveIndicator'
import LogRow from './components/LogRow'
import { useData } from './contexts/DataContext'
import './index.css'

export function App() {
  const { logs, isLoading } = useData()

  if (isLoading)
    return (
      <div className='flex h-dvh w-screen items-center justify-center gap-2'>
        <LoaderCircle className='size-4 animate-spin text-primary' />
        Loading
      </div>
    )
  return (
    <div>
      {logs.map(l => (
        <LogRow key={l.id} log={l} className='px-1' />
      ))}
      <div className='flex h-18 items-center justify-center gap-2'>
        <LiveIndicator />
      </div>
    </div>
  )
}

export default App
