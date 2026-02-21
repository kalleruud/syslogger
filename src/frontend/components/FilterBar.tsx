import { cn } from '@/lib/utils'
import { useFilters } from '../contexts/FilterContext'
import ColumnSelector from './ColumnSelector'
import { AppnameFilter } from './filters/AppnameFilter'
import { ClearFiltersButton } from './filters/ClearFiltersButton'
import { HostnameFilter } from './filters/HostnameFilter'
import { SeverityFilter } from './filters/SeverityFilter'

interface FilterBarProps {
  isOpen: boolean
}

export default function FilterBar({ isOpen }: FilterBarProps) {
  const { filters, setFilters, clearFilters, activeFilterCount } = useFilters()

  return (
    <div
      className={cn(
        'overflow-hidden border-b bg-background/50 backdrop-blur-lg transition-all duration-200 ease-in-out',
        isOpen ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0'
      )}>
      <div className='flex items-center gap-2 overflow-x-auto px-3 py-2'>
        <SeverityFilter
          value={filters.excludedSeverity}
          onChange={excludedSeverity => setFilters({ excludedSeverity })}
          size='sm'
        />
        <AppnameFilter
          value={filters.appname}
          onChange={appname => setFilters({ appname })}
          size='sm'
        />
        <HostnameFilter
          value={filters.hostname}
          onChange={hostname => setFilters({ hostname })}
          size='sm'
        />
        <ClearFiltersButton onClear={clearFilters} count={activeFilterCount} />
        <div className='ml-auto'>
          <ColumnSelector size='sm' />
        </div>
      </div>
    </div>
  )
}
