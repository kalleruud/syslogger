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
  const severity = getSeverity(log.severity)
  const facility = log.facility === null ? undefined : getFacility(log.facility)

  const date = new Date(log.timestamp)

  const severityTextStyles = [
    'text-emergency font-black',
    'text-alert font-bold',
    'text-critical font-bold',
    'text-error',
    'text-warning',
    'text-notice',
    'text-info',
    'text-debug italic',
  ]

  return (
    <div
      className={twMerge(
        'flex w-screen gap-2 text-sm select-text hover:cursor-pointer hover:bg-accent-foreground/15',
        className
      )}
      {...props}>
      <div className='line-clamp-1 shrink-0'>
        {date.toLocaleString('en-UK', { timeZone: 'Europe/Oslo' })}
      </div>
      <div className='line-clamp-1 shrink-0'>{log.appname}</div>

      {facility && (
        <div className='line-clamp-1 shrink-0' title={facility.descriptopn}>
          {facility.name}
        </div>
      )}

      <div
        className={twMerge(
          'line-clamp-1 shrink-0',
          severityTextStyles[severity.level]
        )}
        title={severity.description}>
        {severity.name}
      </div>
      <div className='line-clamp-1' title={log.raw}>
        {log.message}
      </div>
    </div>
  )
}
