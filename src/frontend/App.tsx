import LogRow from './components/LogRow'
import { useData } from './contexts/DataContext'
import './index.css'

export function App() {
  const { logs, isLoading } = useData()

  if (isLoading)
    return (
      <div className='flex h-dvh w-screen items-center justify-center'>
        Loading...
      </div>
    )
  return (
    <div>
      {logs.map(l => (
        <LogRow key={l.id} log={l} className='px-1' />
      ))}
    </div>
  )
}

export default App
