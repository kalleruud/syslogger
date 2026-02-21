import logo from '@public/logo.svg'
import { useFilters } from '../contexts/FilterContext'
import AutoscrollIndicator from './AutoscrollIndicator'
import ColumnSelector from './ColumnSelector'
import { AppnameFilter } from './filters/AppnameFilter'
import { ClearFiltersButton } from './filters/ClearFiltersButton'
import { HostnameFilter } from './filters/HostnameFilter'
import { SearchInput } from './filters/SearchInput'
import { SeverityFilter } from './filters/SeverityFilter'
import FiltersMenu from './FiltersMenu'
import LiveIndicator from './LiveIndicator'

export default function TopBar() {
  const { filters, setFilters, clearFilters, activeFilterCount } = useFilters()

  return (
    <div className='absolute top-0 right-0 left-0 z-50 flex h-16 items-center justify-between border-b bg-background/50 px-3 backdrop-blur-lg'>
      {/* Logo - always visible */}
      <div className='flex items-center gap-2'>
        <img src={logo} alt='syslogger logo' className='h-6 w-6' />
        <h1 className='hidden text-lg font-black lg:block'>syslogger</h1>
      </div>

      {/* Filters - hidden below sm:, visible from sm: onwards */}
      <div className='hidden flex-1 items-center justify-center gap-2 sm:flex'>
        <SearchInput
          value={filters.search}
          onChange={search => setFilters({ search })}
        />
        <SeverityFilter
          value={filters.excludedSeverity}
          onChange={excludedSeverity => setFilters({ excludedSeverity })}
        />
        <AppnameFilter
          value={filters.appname}
          onChange={appname => setFilters({ appname })}
        />
        <HostnameFilter
          value={filters.hostname}
          onChange={hostname => setFilters({ hostname })}
        />
        <ClearFiltersButton onClear={clearFilters} count={activeFilterCount} />
      </div>

      {/* Right side controls */}
      <div className='flex items-center gap-3'>
        {/* Hamburger menu - only visible below sm: */}
        <div className='sm:hidden'>
          <FiltersMenu />
        </div>
        <AutoscrollIndicator />
        <ColumnSelector />
        <LiveIndicator />
      </div>
    </div>
  )
}
