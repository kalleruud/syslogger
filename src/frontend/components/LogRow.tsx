import type { LogWithTags } from '@/database/schema'
import { getFacility } from '@/lib/facilities'
import { getSeverity } from '@/lib/severities'
import type { ComponentProps } from 'react'
import { twMerge } from 'tailwind-merge'

type LogRowProps = {
  log: LogWithTags
} & ComponentProps<'div'>

export default function LogRow({
  log,
  className,
  ...props
}: Readonly<LogRowProps>) {
  return (
    <div
      className={twMerge(
        'flex w-screen gap-2 text-sm select-none hover:cursor-pointer hover:bg-accent',
        className
      )}
      {...props}>
      <div className='line-clamp-1 shrink-0'>{log.timestamp}</div>
      <div className='line-clamp-1 shrink-0'>{log.appname}</div>
      <div className='line-clamp-1 shrink-0'>
        {getFacility(log.facility ?? 0).name}
      </div>
      <div className='line-clamp-1 shrink-0 opacity-50'>
        {getSeverity(log.severity).name}
      </div>
      <div className='line-clamp-1'>{log.message}</div>
    </div>
  )
}
