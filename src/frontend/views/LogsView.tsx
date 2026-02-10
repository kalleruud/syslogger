import type { LogWithTags } from '@/database/queries'
import { useWebSocket } from '@/frontend/hooks/useWebSocket'
import { useCallback, useEffect, useState } from 'react'

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString()
}

export function LogsView() {
  const [logs, setLogs] = useState<LogWithTags[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const handleNewLog = useCallback((log: LogWithTags) => {
    setLogs(prevLogs => [log, ...prevLogs].slice(0, 1000))
  }, [])

  const { status } = useWebSocket({ onLog: handleNewLog })

  useEffect(() => {
    fetch('/api/logs?limit=100')
      .then(res => res.json())
      .then(data => setLogs(data.data || []))
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return <div className='p-8'>Loading...</div>
  }

  return (
    <div className='flex h-screen flex-col bg-black font-mono text-sm text-green-400'>
      <div className='flex items-center justify-between border-b border-gray-800 px-4 py-2'>
        <h1 className='font-bold'>Syslogger</h1>
        <div className='flex items-center gap-2'>
          <div
            className={`h-2 w-2 rounded-full ${status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}
          />
          <span className='text-xs text-gray-500'>{status}</span>
        </div>
      </div>

      <div className='flex-1 overflow-auto p-2'>
        {logs.length === 0 ? (
          <div className='py-8 text-center text-gray-500'>
            No logs yet. Waiting for messages...
          </div>
        ) : (
          logs.map(log => (
            <div
              key={log.id}
              className='border-b border-gray-900 py-1 hover:bg-gray-900'>
              <span className='text-gray-500'>
                {formatTimestamp(log.timestamp)}
              </span>
              {' | '}
              <span className='text-cyan-400'>{log.hostname || 'unknown'}</span>
              {' | '}
              <span className='text-purple-400'>
                {log.appname || 'unknown'}
              </span>
              {' | '}
              <span>{log.message}</span>
            </div>
          ))
        )}
      </div>

      <div className='border-t border-gray-800 px-4 py-1 text-xs text-gray-500'>
        {logs.length} logs
      </div>
    </div>
  )
}
