import { cn } from '@/lib/utils'
import { useConnection } from '../contexts/ConnectionContext'

export default function LiveIndicator() {
  const { isConnected } = useConnection()
  return (
    <div
      className='flex items-center justify-center gap-2'
      aria-label={isConnected ? 'Listening' : 'Disconnected'}>
      <div
        className={cn(
          'size-2 rounded-full shadow-[0_0px_10px]',
          isConnected
            ? 'animate-pulse bg-primary shadow-primary'
            : 'bg-destructive shadow-destructive'
        )}
      />
      <span className='hidden lg:inline'>
        {isConnected ? 'Listening' : 'Disconnected'}
      </span>
    </div>
  )
}
