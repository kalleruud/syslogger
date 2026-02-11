import { twMerge } from 'tailwind-merge'
import { useConnection } from '../contexts/ConnectionContext'

export default function LiveIndicator() {
  const { isConnected } = useConnection()
  return (
    <>
      <div
        className={twMerge(
          'size-2 rounded-full',
          isConnected ? 'animate-pulse bg-primary' : 'bg-destructive'
        )}
      />
      {isConnected ? 'Listening' : 'Disconnected'}
    </>
  )
}
