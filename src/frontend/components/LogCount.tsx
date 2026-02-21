import { Slash } from 'lucide-react'
import { useData } from '../contexts/DataContext'
import { useFilters } from '../contexts/FilterContext'
import BrailleLoader from './BrailleLoader'

/**
 * Format number with thousands separators
 */
function formatCount(count: number): string {
  return count.toLocaleString()
}

/**
 * Display total log count with filter status
 * Shows "filtered / total" when filters are active, or just "total" when no filters
 */
export default function LogCount() {
  const data = useData()
  const { hasActiveFilters } = useFilters()

  // Show loader while data is loading
  if (data.isLoading || data.totalUnfilteredCount === undefined) {
    return (
      <div className='flex items-center gap-1.5 text-sm text-muted-foreground'>
        <BrailleLoader size='small' />
      </div>
    )
  }

  const { totalFilteredCount, totalUnfilteredCount } = data

  // When no filters are active, show only the total count
  if (!hasActiveFilters) {
    return (
      <div className='flex items-center gap-1.5 text-sm text-muted-foreground'>
        <span>{formatCount(totalUnfilteredCount)}</span>
      </div>
    )
  }

  // When filters are active, show "filtered / total"
  return (
    <div className='flex items-center gap-1.5 text-sm'>
      <span className='font-medium'>{formatCount(totalFilteredCount)}</span>
      <Slash className='size-3 text-muted-foreground' />
      <span className='text-muted-foreground'>
        {formatCount(totalUnfilteredCount)}
      </span>
    </div>
  )
}
