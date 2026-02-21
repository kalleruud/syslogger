import { X } from 'lucide-react'
import { Button } from '../ui/button'

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
    <Button
      variant='ghost'
      size='sm'
      onClick={onClear}
      aria-label={`Clear ${count} filter${count > 1 ? 's' : ''}`}
      className='h-9 gap-1 px-2 text-xs'>
      <X className='size-3' />
      <span className={showText ? '' : 'hidden lg:inline'}>
        Clear {count > 1 ? `(${count})` : ''}
      </span>
    </Button>
  )
}
