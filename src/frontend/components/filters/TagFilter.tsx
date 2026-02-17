import { useEffect, useState } from 'react'
import { fetchAllTags } from '../../lib/api'
import { MultiSelect, type MultiSelectOption } from '../ui/multi-select'

interface TagFilterProps {
  value: number[]
  onChange: (value: number[]) => void
}

export function TagFilter({ value, onChange }: TagFilterProps) {
  const [options, setOptions] = useState<MultiSelectOption[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadTags() {
      try {
        setIsLoading(true)
        const tags = await fetchAllTags()
        setOptions(
          tags.map(tag => ({
            value: tag.id.toString(),
            label: tag.name,
          }))
        )
      } catch (err) {
        console.error('Failed to load tags:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadTags()
  }, [])

  const handleChange = (newValue: string[]) => {
    onChange(newValue.map(v => Number.parseInt(v, 10)))
  }

  const stringValue = value.map(v => v.toString())

  return (
    <MultiSelect
      options={options}
      value={stringValue}
      onChange={handleChange}
      placeholder={isLoading ? 'Loading...' : 'Tags'}
      searchPlaceholder='Search tags...'
      disabled={isLoading}
    />
  )
}
