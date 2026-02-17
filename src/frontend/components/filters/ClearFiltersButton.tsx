import { X } from 'lucide-react'
import { Button } from '../ui/button'

interface ClearFiltersButtonProps {
  onClear: () => void
  count: number
}

export function ClearFiltersButton({
  onClear,
  count,
}: ClearFiltersButtonProps) {
  if (count === 0) return null

  return (
    <Button
      variant='ghost'
      size='sm'
      onClick={onClear}
      className='h-9 gap-1 px-2 text-xs'>
      <X className='size-3' />
      Clear {count > 1 ? `(${count})` : ''}
    </Button>
  )
}
