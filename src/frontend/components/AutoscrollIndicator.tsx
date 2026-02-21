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
          className='flex items-center gap-2'
          aria-label='Auto-scrolling enabled'>
          <ArrowDown className='size-4 animate-bounce text-primary' />
          <span className='hidden font-medium text-primary lg:inline'>
            Auto-scrolling
          </span>
        </div>
      ) : (
        <Button
          variant='ghost'
          size='sm'
          onClick={handleClick}
          aria-label='Enable autoscroll'
          className='gap-2'>
          <ArrowDownToLine className='size-4 text-muted-foreground' />
          <span className='hidden text-muted-foreground lg:inline'>
            Autoscroll
          </span>
        </Button>
      )}
    </div>
  )
}
