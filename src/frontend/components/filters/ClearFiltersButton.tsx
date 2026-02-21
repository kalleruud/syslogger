import { X } from 'lucide-react'
import { Button } from '../ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'

interface ClearFiltersButtonProps {
  onClear: () => void
  count: number
  showText?: boolean
}

export function ClearFiltersButton({
  onClear,
  count,
  showText = false,
}: ClearFiltersButtonProps) {
  if (count === 0) return null

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant='ghost'
          size='sm'
          onClick={onClear}
          aria-label={`Clear ${count} filter${count > 1 ? 's' : ''}`}
          className='gap-1 text-xs'>
          <X className='size-3' />
          <span className={showText ? '' : 'hidden md:inline'}>
            Clear {count > 1 ? `(${count})` : ''}
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>
          Clear {count} filter{count > 1 ? 's' : ''}
        </p>
      </TooltipContent>
    </Tooltip>
  )
}
