import { SEVERITIES } from '@/lib/severities'
import { useMemo } from 'react'
import { MultiSelect, type MultiSelectOption } from '../ui/multi-select'

interface SeverityFilterProps {
  value: number[] // Excluded severity levels (blacklist)
  onChange: (value: number[]) => void
}

const severityStyles = [
  'text-emergency font-black',
  'text-alert font-bold',
  'text-critical font-bold',
  'text-error',
  'text-warning',
  'text-notice',
  'text-info',
  'text-debug italic',
]

export function SeverityFilter({ value, onChange }: SeverityFilterProps) {
  const options: MultiSelectOption[] = useMemo(
    () =>
      Object.values(SEVERITIES).map(severity => ({
        value: severity.level.toString(),
        label: `${severity.name} (${severity.level})`,
        description: severity.description,
      })),
    []
  )

  // Convert excluded severities to selected (included) severities for the UI
  const selectedValues = useMemo(() => {
    const allSeverities = [0, 1, 2, 3, 4, 5, 6, 7]
    const included = allSeverities.filter(s => !value.includes(s))
    return included.map(v => v.toString())
  }, [value])

  const handleChange = (newSelected: string[]) => {
    // Convert selected (included) back to excluded (blacklist)
    const allSeverities = [0, 1, 2, 3, 4, 5, 6, 7]
    const includedNumbers = newSelected.map(v => Number.parseInt(v, 10))
    const excluded = allSeverities.filter(s => !includedNumbers.includes(s))
    onChange(excluded)
  }

  return (
    <MultiSelect
      options={options}
      value={selectedValues}
      onChange={handleChange}
      placeholder='Severity'
      searchPlaceholder='Search severity...'
      renderOption={option => {
        const level = Number.parseInt(option.value, 10)
        return (
          <div className='flex flex-col items-start'>
            <span className={severityStyles[level]}>{option.label}</span>
            {option.description && (
              <span className='text-xs text-muted-foreground'>
                {option.description}
              </span>
            )}
          </div>
        )
      }}
    />
  )
}
