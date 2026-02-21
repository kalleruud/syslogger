import { Menu } from 'lucide-react'
import { useFilters } from '../contexts/FilterContext'
import { AppnameFilter } from './filters/AppnameFilter'
import { ClearFiltersButton } from './filters/ClearFiltersButton'
import { HostnameFilter } from './filters/HostnameFilter'
import { SearchInput } from './filters/SearchInput'
import { SeverityFilter } from './filters/SeverityFilter'
import { Button } from './ui/button'
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from './ui/popover'

export default function FiltersMenu() {
  const { filters, setFilters, clearFilters, activeFilterCount } = useFilters()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          aria-label='Open filters menu'
          className='relative h-9 min-w-9'>
          <Menu className='size-4' />
          {activeFilterCount > 0 && (
            <span className='absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground'>
              {activeFilterCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align='end' className='w-80'>
        <PopoverHeader className='mb-3'>
          <PopoverTitle>Filters</PopoverTitle>
        </PopoverHeader>
        <div className='flex flex-col gap-3'>
          <div className='w-full'>
            <SearchInput
              value={filters.search}
              onChange={search => setFilters({ search })}
            />
          </div>
          <div className='w-full [&_button]:w-full [&_button]:justify-start'>
            <SeverityFilter
              value={filters.excludedSeverity}
              onChange={excludedSeverity => setFilters({ excludedSeverity })}
              showText={true}
            />
          </div>
          <div className='w-full [&_button]:w-full [&_button]:justify-start'>
            <AppnameFilter
              value={filters.appname}
              onChange={appname => setFilters({ appname })}
              showText={true}
            />
          </div>
          <div className='w-full [&_button]:w-full [&_button]:justify-start'>
            <HostnameFilter
              value={filters.hostname}
              onChange={hostname => setFilters({ hostname })}
              showText={true}
            />
          </div>
          {activeFilterCount > 0 && (
            <div className='w-full [&_button]:w-full [&_button]:justify-start'>
              <ClearFiltersButton
                onClear={clearFilters}
                count={activeFilterCount}
                showText={true}
              />
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
