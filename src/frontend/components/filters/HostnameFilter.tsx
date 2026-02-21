import { Server } from 'lucide-react'
import { useEffect, useState } from 'react'
import { fetchUniqueHostnames } from '../../lib/api'
import { MultiSelect, type MultiSelectOption } from '../ui/multi-select'
import type { buttonVariants } from '../ui/button'
import type { VariantProps } from 'class-variance-authority'

interface HostnameFilterProps {
  value: string[]
  onChange: (value: string[]) => void
  size?: VariantProps<typeof buttonVariants>['size']
}

export function HostnameFilter({
  value,
  onChange,
  size,
}: HostnameFilterProps) {
  const [options, setOptions] = useState<MultiSelectOption[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadHostnames() {
      setIsLoading(true)

      try {
        const hostnames = await fetchUniqueHostnames()
        setOptions(
          hostnames.map(hostname => ({
            value: hostname,
            label: hostname,
          }))
        )
        setIsLoading(false)
      } catch (err) {
        console.error('Failed to load hostnames:', err)
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
      icon={<Server className='size-4' />}
      ariaLabel='Filter by hostname'
      size={size}
      disabled={isLoading}
    />
  )
}
