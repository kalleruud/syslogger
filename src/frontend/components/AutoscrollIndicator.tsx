import { ArrowDown, ArrowDownToLine } from 'lucide-react'
import { useAutoscroll } from '../contexts/AutoscrollContext'
import { Button } from './ui/button'

export default function AutoscrollIndicator() {
  const { isAutoscrollEnabled, scrollToBottomRef } = useAutoscroll()

  const handleClick = () => {
    scrollToBottomRef.current?.()
  }

  return (
    <div className='flex items-center gap-2'>
      {isAutoscrollEnabled ? (
        <div
          className='flex h-8 items-center gap-1.5 rounded-md px-2.5 font-medium'
          aria-label='Auto-scrolling enabled'>
          <ArrowDown className='size-4 animate-bounce text-primary' />
          <span className='hidden text-primary md:inline'>Auto-scrolling</span>
        </div>
      ) : (
        <Button
          variant='ghost'
          size='sm'
          onClick={handleClick}
          aria-label='Enable autoscroll'>
          <ArrowDownToLine className='size-4 text-muted-foreground' />
          <span className='hidden text-muted-foreground md:inline'>
            Autoscroll
          </span>
        </Button>
      )}
    </div>
  )
}
