import { cn } from '@/lib/utils'
import { useConnection } from '../contexts/ConnectionContext'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'

export default function LiveIndicator() {
  const { isConnected } = useConnection()
  return (
    <Tooltip>
      <TooltipTrigger asChild>
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
          <span className='hidden md:inline'>
            {isConnected ? 'Listening' : 'Disconnected'}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>
          {isConnected
            ? 'Connected - receiving live logs'
            : 'Disconnected - no live updates'}
        </p>
      </TooltipContent>
    </Tooltip>
  )
}
