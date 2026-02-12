import { ArrowDown, ArrowDownToLine } from 'lucide-react'
import { useAutoscroll } from '../contexts/AutoscrollContext'
import { Button } from './ui/button'

export default function AutoscrollIndicator() {
  const { isAutoscrollEnabled } = useAutoscroll()

  return (
    <div className='flex items-center gap-2'>
      {isAutoscrollEnabled ? (
        <>
          <ArrowDown className='size-4 animate-bounce text-primary' />
          <span className='text-sm font-medium text-primary'>
            Auto-scrolling
          </span>
        </>
      ) : (
        <Button variant='ghost'>
          <ArrowDownToLine className='size-4 text-muted-foreground' />
          <span className='text-sm text-muted-foreground'>Scroll to end</span>
        </Button>
      )}
    </div>
  )
}
