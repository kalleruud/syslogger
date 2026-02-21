import { Package } from 'lucide-react'
import { useEffect, useState } from 'react'
import { fetchUniqueAppnames } from '../../lib/api'
import { MultiSelect, type MultiSelectOption } from '../ui/multi-select'

interface AppnameFilterProps {
  value: string[]
  onChange: (value: string[]) => void
  showText?: boolean
  size?: 'default' | 'sm' | 'lg'
}

export function AppnameFilter({
  value,
  onChange,
  showText,
  size,
}: AppnameFilterProps) {
  const [options, setOptions] = useState<MultiSelectOption[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadAppnames() {
      setIsLoading(true)

      try {
        const appnames = await fetchUniqueAppnames()
        setOptions(
          appnames.map(appname => ({
            value: appname,
            label: appname,
          }))
        )
        setIsLoading(false)
      } catch (err) {
        console.error('Failed to load appnames:', err)
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
      icon={<Package className='size-4' />}
      ariaLabel='Filter by application'
      showText={showText}
      size={size}
      disabled={isLoading}
    />
  )
}
