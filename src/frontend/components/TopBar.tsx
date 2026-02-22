import logo from '@public/icon/logo.svg'
import { Filter } from 'lucide-react'
import { useState } from 'react'
import { useFilters } from '../contexts/FilterContext'
import AutoscrollIndicator from './AutoscrollIndicator'
import FilterBar from './FilterBar'
import { SearchInput } from './filters/SearchInput'
import LiveIndicator from './LiveIndicator'
import LogCount from './LogCount'
import { Button } from './ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'

export default function TopBar() {
  const { filters, setFilters } = useFilters()
  const [isFilterBarOpen, setIsFilterBarOpen] = useState(false)

  const toggleFilterBar = () => {
    setIsFilterBarOpen(prev => !prev)
  }

  return (
    <div className='absolute top-0 right-0 left-0 z-50'>
      {/* Main navigation bar */}
      <div className='flex h-14 items-center justify-between gap-4 border-b bg-background/50 px-3 backdrop-blur-lg'>
        {/* Logo and count */}
        <div className='flex items-center gap-3'>
          <div className='flex items-center gap-2'>
            <img src={logo} alt='syslogger logo' className='h-6 w-6' />
            <h1 className='hidden text-lg font-black md:block'>syslogger</h1>
          </div>
          <LogCount />
        </div>

        {/* Search - always visible and expanded */}
        <div className='flex flex-1 items-center justify-center'>
          <SearchInput
            value={filters.search}
            onChange={search => setFilters({ search })}
          />
        </div>

        {/* Right side controls */}
        <div className='flex items-center gap-3'>
          <AutoscrollIndicator />
          <LiveIndicator />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                onClick={toggleFilterBar}
                aria-label='Toggle filters'
                className='h-8 w-8'>
                <Filter className='size-4' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Toggle filters</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Filter bar - slides in/out below main bar */}
      <FilterBar isOpen={isFilterBarOpen} />
    </div>
  )
}
