import { useData } from './contexts/DataContext'
import './index.css'

export function App() {
  const { logs, isLoading } = useData()

  if (isLoading) return <p>Loading...</p>
  return (
    <div className='text-sm'>
      {logs.map(l => (
        <p className='line-clamp-1' key={l.id}>
          {l.message}
        </p>
      ))}
    </div>
  )
}

export default App
