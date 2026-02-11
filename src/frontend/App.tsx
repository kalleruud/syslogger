import { LoaderCircle } from 'lucide-react'
import LogRow from './components/LogRow'
import { useConnection } from './contexts/ConnectionContext'
import { useData } from './contexts/DataContext'
import './index.css'

export function App() {
  const { isConnected } = useConnection()
  const { logs, isLoading } = useData()

  if (!isConnected || isLoading)
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
        <div className='size-2 animate-pulse rounded-full bg-primary' />
        Listening
      </div>
    </div>
  )
}

export default App
