import { useEffect, useState } from 'react'
import { fetchUniqueHostnames } from '../../lib/api'
import { MultiSelect, type MultiSelectOption } from '../ui/multi-select'

interface HostnameFilterProps {
  value: string[]
  onChange: (value: string[]) => void
}

export function HostnameFilter({ value, onChange }: HostnameFilterProps) {
  const [options, setOptions] = useState<MultiSelectOption[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadHostnames() {
      try {
        setIsLoading(true)
        const hostnames = await fetchUniqueHostnames()
        setOptions(
          hostnames.map(hostname => ({
            value: hostname,
            label: hostname,
          }))
        )
      } catch (err) {
        console.error('Failed to load hostnames:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadHostnames()
  }, [])

  return (
    <MultiSelect
      options={options}
      value={value}
      onChange={onChange}
      placeholder={isLoading ? 'Loading...' : 'Hostname'}
      searchPlaceholder='Search hostnames...'
      disabled={isLoading}
    />
  )
}
