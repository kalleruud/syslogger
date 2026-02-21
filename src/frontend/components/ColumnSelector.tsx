import {
  COLUMNS,
  useColumnVisibility,
} from '@/frontend/hooks/useColumnVisibility'
import { Columns } from 'lucide-react'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from './ui/popover'

export default function ColumnSelector() {
  const { isColumnVisible, toggleColumn } = useColumnVisibility()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='outline' className='h-8' aria-label='Toggle columns'>
          <Columns className='size-4' />
          <span className='hidden lg:inline'>Columns</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align='end' className='w-64'>
        <PopoverHeader className='mb-3'>
          <PopoverTitle>Visible Columns</PopoverTitle>
        </PopoverHeader>
        <div className='flex flex-col gap-3'>
          {COLUMNS.map(column => {
            const visible = isColumnVisible(column.key)
            const disabled = column.alwaysVisible

            return (
              <div key={column.key} className='flex items-center gap-3'>
                <Checkbox
                  id={`column-${column.key}`}
                  checked={visible}
                  disabled={disabled}
                  onCheckedChange={() => toggleColumn(column.key)}
                />
                <label
                  htmlFor={`column-${column.key}`}
                  className={`flex-1 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
                  {column.label}
                </label>
              </div>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
