import type { LogWithTags } from '@/database/schema'
import type { ColumnKey } from '@/frontend/hooks/useColumnVisibility'
import { getFacility } from '@/lib/facilities'
import { getSeverity } from '@/lib/severities'
import type { ComponentProps } from 'react'
import { twMerge } from 'tailwind-merge'

const timezone = process.env.TZ || 'UTC'

function formatLocalIso(date: Date): { datePart: string; timePart: string } {
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  const parts = formatter.formatToParts(date)
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(p => p.type === type)?.value ?? ''

  const datePart = `${get('year')}-${get('month')}-${get('day')}`
  const timePart = `${get('hour')}:${get('minute')}:${get('second')}`

  return { datePart, timePart }
}

type LogRowProps = {
  log: LogWithTags
  visibleColumns: Set<ColumnKey>
} & ComponentProps<'div'>

export default function LogRow({
  log,
  visibleColumns,
  className,
  ...props
}: Readonly<LogRowProps>) {
  const severity = getSeverity(log.severity)
  const facility = log.facility === null ? undefined : getFacility(log.facility)

  const date = new Date(log.timestamp)
  const { datePart, timePart } = formatLocalIso(date)

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
        'flex w-screen gap-2 select-text hover:cursor-pointer hover:bg-accent-foreground/15',
        className
      )}
      {...props}>
      {visibleColumns.has('timestamp') && (
        <div className='line-clamp-1 shrink-0 opacity-50'>{`${datePart} ${timePart}`}</div>
      )}

      {visibleColumns.has('appname') && (
        <div className='line-clamp-1 shrink-0'>{log.appname}</div>
      )}

      {visibleColumns.has('facility') && facility && (
        <div className='line-clamp-1 shrink-0' title={facility.descriptopn}>
          {facility.name}
        </div>
      )}

      {visibleColumns.has('severity') && (
        <div
          className={twMerge(
            'line-clamp-1 shrink-0',
            severityTextStyles[severity.level]
          )}
          title={severity.description}>
          {severity.name}
        </div>
      )}

      {visibleColumns.has('hostname') && log.hostname && (
        <div className='line-clamp-1 shrink-0'>{log.hostname}</div>
      )}

      {visibleColumns.has('procid') && log.procid && (
        <div className='line-clamp-1 shrink-0'>{log.procid}</div>
      )}

      {visibleColumns.has('msgid') && log.msgid && (
        <div className='line-clamp-1 shrink-0'>{log.msgid}</div>
      )}

      {visibleColumns.has('tags') && log.tags.length > 0 && (
        <div className='line-clamp-1 flex shrink-0 gap-1'>
          {log.tags.map(tag => (
            <span
              key={tag.id}
              className='rounded bg-accent px-1.5 py-0.5 text-xs text-accent-foreground'>
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {visibleColumns.has('message') && (
        <div className='line-clamp-1' title={log.raw}>
          {log.message}
        </div>
      )}
    </div>
  )
}
