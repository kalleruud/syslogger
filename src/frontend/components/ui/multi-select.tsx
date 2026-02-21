import { Check, ChevronsUpDown } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils'
import { Button } from './button'
import { Checkbox } from './checkbox'
import { Input } from './input'
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from './popover'

export interface MultiSelectOption {
  value: string
  label: string
  description?: string
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  className?: string
  disabled?: boolean
  renderOption?: (option: MultiSelectOption) => React.ReactNode
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Select items',
  searchPlaceholder = 'Search...',
  className,
  disabled = false,
  renderOption,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const contentId = React.useId()

  const filteredOptions = React.useMemo(() => {
    let filtered = options

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(
        option =>
          option.label.toLowerCase().includes(searchLower) ||
          option.description?.toLowerCase().includes(searchLower)
      )
    }

    return filtered
  }, [options, search])

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue))
    } else {
      onChange([...value, optionValue])
    }
  }

  const selectAll = () => {
    // Select all currently filtered (visible) options
    const allValues = new Set([
      ...value,
      ...filteredOptions.map(opt => opt.value),
    ])
    onChange(Array.from(allValues))
  }

  const clearAll = () => {
    onChange([])
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          aria-controls={contentId}
          className={cn('h-9 min-w-45 justify-between', className)}
          disabled={disabled}>
          <span className={value.length === 0 ? 'text-muted-foreground' : ''}>
            {value.length === 0
              ? placeholder
              : `${placeholder} (${value.length})`}
          </span>
          <ChevronsUpDown className='ml-2 size-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent id={contentId} className='w-75 p-0' align='start'>
        <PopoverHeader className='border-b p-2'>
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className='h-8'
          />
        </PopoverHeader>
        <div className='flex items-center justify-between border-b px-3 py-2'>
          <PopoverTitle className='text-sm font-medium'>
            {value.length > 0 ? `${value.length} selected` : 'Select items'}
          </PopoverTitle>
          <div className='flex gap-2'>
            <Button
              variant='ghost'
              size='sm'
              onClick={selectAll}
              disabled={filteredOptions.length === 0}
              className='h-6 px-2 text-xs'>
              Select all
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={clearAll}
              disabled={value.length === 0}
              className='h-6 px-2 text-xs'>
              Clear
            </Button>
          </div>
        </div>
        <div className='max-h-75 overflow-y-auto p-2'>
          {filteredOptions.length === 0 ? (
            <div className='py-6 text-center text-sm text-muted-foreground'>
              No results found.
            </div>
          ) : (
            <fieldset className='space-y-1 border-0 p-0'>
              <legend className='sr-only'>Select options</legend>
              {filteredOptions.map(option => {
                const isSelected = value.includes(option.value)
                return (
                  <label
                    key={option.value}
                    className='flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:outline-none hover:bg-accent hover:text-accent-foreground'>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleOption(option.value)}
                    />
                    <div className='flex flex-1 flex-col items-start'>
                      {renderOption ? (
                        renderOption(option)
                      ) : (
                        <>
                          <span>{option.label}</span>
                          {option.description && (
                            <span className='text-xs text-muted-foreground'>
                              {option.description}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    {isSelected && <Check className='size-4' />}
                  </label>
                )
              })}
            </fieldset>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
