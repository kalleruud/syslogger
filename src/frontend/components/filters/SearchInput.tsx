import { cn } from '@/lib/utils'
import { Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
}

const DEBOUNCE_DELAY = 300

export function SearchInput({ value, onChange }: SearchInputProps) {
  const [localValue, setLocalValue] = useState(() => value)

  const hasValue = Boolean(localValue)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue)
      }
    }, DEBOUNCE_DELAY)

    return () => clearTimeout(timer)
  }, [localValue, value, onChange])

  const handleClear = () => {
    setLocalValue('')
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'flex w-full items-center gap-2 rounded-md border border-input bg-transparent px-2 py-1 shadow-xs transition-[color,box-shadow] md:max-w-md',
            'focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50',
            'dark:bg-input/30',
            hasValue && 'border-primary'
          )}>
          <Search className='size-4 shrink-0 text-muted-foreground' />
          <input
            type='text'
            placeholder='Search logs...'
            value={localValue}
            onChange={e => setLocalValue(e.target.value)}
            className='flex-1 bg-transparent outline-none placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50'
            aria-label='Search logs'
          />
          {hasValue && (
            <Button
              onClick={handleClear}
              size='sm'
              variant='ghost'
              className='size-5 p-0 text-xs'
              aria-label='Clear search'>
              <X className='size-4' />
            </Button>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>Search in log messages</p>
      </TooltipContent>
    </Tooltip>
  )
}
