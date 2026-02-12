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
        <>
          <ArrowDown className='size-4 animate-bounce text-primary' />
          <span className='font-medium text-primary'>Auto-scrolling</span>
        </>
      ) : (
        <Button variant='ghost' size='sm' onClick={handleClick}>
          <ArrowDownToLine className='size-4 text-muted-foreground' />
          <span className='text-muted-foreground'>Autoscroll</span>
        </Button>
      )}
    </div>
  )
}
