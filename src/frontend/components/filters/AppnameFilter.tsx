import { useEffect, useState } from 'react'
import { fetchUniqueAppnames } from '../../lib/api'
import { MultiSelect, type MultiSelectOption } from '../ui/multi-select'

interface AppnameFilterProps {
  value: string[]
  onChange: (value: string[]) => void
}

export function AppnameFilter({ value, onChange }: AppnameFilterProps) {
  const [options, setOptions] = useState<MultiSelectOption[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadAppnames() {
      try {
        setIsLoading(true)
        const appnames = await fetchUniqueAppnames()
        setOptions(
          appnames.map(appname => ({
            value: appname,
            label: appname,
          }))
        )
      } catch (err) {
        console.error('Failed to load appnames:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadAppnames()
  }, [])

  return (
    <MultiSelect
      options={options}
      value={value}
      onChange={onChange}
      placeholder={isLoading ? 'Loading...' : 'Application'}
      searchPlaceholder='Search applications...'
      disabled={isLoading}
    />
  )
}
