import logo from '@public/logo.svg'
import { SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { useFilters } from '../contexts/FilterContext'
import AutoscrollIndicator from './AutoscrollIndicator'
import FilterBar from './FilterBar'
import { SearchInput } from './filters/SearchInput'
import LiveIndicator from './LiveIndicator'
import { Button } from './ui/button'

export default function TopBar() {
  const { filters, setFilters } = useFilters()
  const [isFilterBarOpen, setIsFilterBarOpen] = useState(false)

  const toggleFilterBar = () => {
    setIsFilterBarOpen(prev => !prev)
  }

  return (
    <div className='absolute top-0 right-0 left-0 z-50'>
      {/* Main navigation bar */}
      <div className='flex h-16 items-center justify-between border-b bg-background/50 px-3 backdrop-blur-lg'>
        {/* Logo */}
        <div className='flex items-center gap-2'>
          <img src={logo} alt='syslogger logo' className='h-6 w-6' />
          <h1 className='hidden text-lg font-black md:block'>syslogger</h1>
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
          <Button
            variant='ghost'
            size='icon'
            onClick={toggleFilterBar}
            aria-label='Toggle filters'
            className='h-8 w-8'>
            <SlidersHorizontal className='size-4' />
          </Button>
        </div>
      </div>

      {/* Filter bar - slides in/out below main bar */}
      <FilterBar isOpen={isFilterBarOpen} />
    </div>
  )
}
