import { cn } from '@/lib/utils'
import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Input } from '../ui/input'

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

  return (
    <div className='relative'>
      <Search className='absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
      <Input
        type='text'
        placeholder='Search logs...'
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
        className={cn(
          'h-8 w-48 pl-9 md:w-64',
          hasValue && 'border-primary text-primary'
        )}
        aria-label='Search logs'
      />
    </div>
  )
}
