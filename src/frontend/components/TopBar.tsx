import logo from '@public/logo.svg'
import { useFilters } from '../contexts/FilterContext'
import AutoscrollIndicator from './AutoscrollIndicator'
import ColumnSelector from './ColumnSelector'
import { AppnameFilter } from './filters/AppnameFilter'
import { ClearFiltersButton } from './filters/ClearFiltersButton'
import { HostnameFilter } from './filters/HostnameFilter'
import { SeverityFilter } from './filters/SeverityFilter'
import { TagFilter } from './filters/TagFilter'
import LiveIndicator from './LiveIndicator'

export default function TopBar() {
  const { filters, setFilters, clearFilters, activeFilterCount } = useFilters()

  return (
    <div className='absolute top-0 right-0 left-0 z-50 flex h-16 items-center justify-between border-b bg-background/50 px-4 backdrop-blur-lg'>
      <div className='flex items-center gap-2'>
        <img src={logo} alt='syslogger logo' className='h-6 w-6' />
        <h1 className='text-lg font-black'>syslogger</h1>
      </div>
      <div className='flex flex-1 items-center justify-center gap-2'>
        <SeverityFilter
          value={filters.excludedSeverity}
          onChange={excludedSeverity => setFilters({ excludedSeverity })}
        />
        <AppnameFilter
          value={filters.appname}
          onChange={appname => setFilters({ appname })}
        />
        <TagFilter
          value={filters.tagIds}
          onChange={tagIds => setFilters({ tagIds })}
        />
        <HostnameFilter
          value={filters.hostname}
          onChange={hostname => setFilters({ hostname })}
        />
        <ClearFiltersButton onClear={clearFilters} count={activeFilterCount} />
      </div>
      <div className='flex items-center gap-4'>
        <AutoscrollIndicator />
        <ColumnSelector />
        <LiveIndicator />
      </div>
    </div>
  )
}
