import { cn } from '@/lib/utils'
import { Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Input } from '../ui/input'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
}

const DEBOUNCE_DELAY = 300
const AUTO_CLOSE_DELAY = 5_000 // 5 seconds

export function SearchInput({ value, onChange }: SearchInputProps) {
  const [localValue, setLocalValue] = useState(() => value)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const isCollapsed = !isFocused && !localValue
  const hasValue = Boolean(localValue)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue)
      }
    }, DEBOUNCE_DELAY)

    return () => clearTimeout(timer)
  }, [localValue, value, onChange])

  // Auto-close search input after 5 seconds of inactivity if empty
  useEffect(() => {
    if (isFocused && !localValue) {
      const autoCloseTimer = setTimeout(() => {
        setIsFocused(false)
        inputRef.current?.blur()
      }, AUTO_CLOSE_DELAY)

      return () => clearTimeout(autoCloseTimer)
    }
  }, [isFocused, localValue])

  const handleIconClick = () => {
    setIsFocused(true)
    // Use setTimeout to ensure input is rendered and available
    setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
  }

  const handleBlur = () => {
    if (!localValue) {
      setIsFocused(false)
    }
  }

  return (
    <div className='relative'>
      <Search
        className={cn(
          'absolute top-1/2 z-10 size-4 -translate-y-1/2 cursor-pointer transition-all',
          isCollapsed
            ? 'left-1/2 -translate-x-1/2 text-foreground/70 hover:text-foreground'
            : 'left-3 text-muted-foreground hover:text-foreground'
        )}
        onClick={handleIconClick}
      />
      <Input
        ref={inputRef}
        type='text'
        placeholder='Search logs...'
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        className={cn(
          'h-8 pl-9 transition-all duration-300 ease-in-out',
          isCollapsed
            ? 'w-8 cursor-pointer border-input bg-background pl-0 text-transparent shadow-xs placeholder:text-transparent hover:bg-accent dark:border-input dark:bg-input/30 dark:hover:bg-input/50'
            : 'w-48 lg:w-64',
          hasValue && 'border-primary text-primary'
        )}
        aria-label={isCollapsed ? 'Open search' : 'Search logs'}
      />
    </div>
  )
}
