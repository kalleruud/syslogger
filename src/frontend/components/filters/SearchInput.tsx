import { Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Input } from '../ui/input'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
}

const DEBOUNCE_DELAY = 300

export function SearchInput({ value, onChange }: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue)
      }
    }, DEBOUNCE_DELAY)

    return () => clearTimeout(timer)
  }, [localValue, value, onChange])

  const handleIconClick = () => {
    setIsFocused(true)
    inputRef.current?.focus()
  }

  const handleBlur = () => {
    if (!localValue) {
      setIsFocused(false)
    }
  }

  return (
    <div className='relative'>
      <Search
        className='absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2 cursor-pointer text-muted-foreground transition-colors hover:text-foreground'
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
        className={`pl-9 transition-all duration-300 ease-in-out ${
          isFocused || localValue ? 'w-64' : 'w-9 cursor-pointer'
        }`}
      />
    </div>
  )
}
