import { cn } from '@/lib/utils'
import { ArrowDown, ArrowDownToLine } from 'lucide-react'
import { useAutoscroll } from '../contexts/AutoscrollContext'
import { Button } from './ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'

export default function AutoscrollIndicator() {
  const { isAutoscrollEnabled, scrollToBottomRef } = useAutoscroll()

  const Icon = isAutoscrollEnabled ? ArrowDown : ArrowDownToLine

  const handleClick = () => {
    scrollToBottomRef.current?.()
  }

  return (
    <div className='flex items-center gap-2'>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='ghost'
            size='sm'
            onClick={handleClick}
            className={cn(
              'text-muted-foreground disabled:text-primary disabled:opacity-100'
            )}
            disabled={isAutoscrollEnabled}
            aria-label='Enable autoscroll'>
            <Icon className='size-4' />
            <span className='hidden md:inline'>
              {isAutoscrollEnabled ? 'Autoscrolling' : 'Autoscroll'}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isAutoscrollEnabled
              ? 'Auto-scrolling enabled'
              : 'Jump to bottom and enable auto-scroll'}
          </p>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
