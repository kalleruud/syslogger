const MONTHS = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
} as const

export const parseNilValue = (value: string) =>
  value === '-' ? undefined : value

export const parseISO8601 = (timestamp: string) => {
  const date = new Date(timestamp)
  return Number.isNaN(date.getTime())
    ? new Date().toISOString()
    : date.toISOString()
}

export const parseBSDTimestamp = (bsdTime: string) => {
  const match = /^([A-Z][a-z]{2})\s+(\d{1,2})\s+(\d{2}):(\d{2}):(\d{2})$/.exec(
    bsdTime
  )
  if (!match) return new Date().toISOString()

  const [, monthStr, day, hour, minute, second] = match
  const month = MONTHS[monthStr as keyof typeof MONTHS]
  if (month === undefined) return new Date().toISOString()

  const now = new Date()
  const date = new Date(
    now.getFullYear(),
    month,
    Number.parseInt(day!, 10),
    Number.parseInt(hour!, 10),
    Number.parseInt(minute!, 10),
    Number.parseInt(second!, 10)
  )

  // Handle year rollover
  if (date > now) date.setFullYear(date.getFullYear() - 1)
  return date.toISOString()
}

export const parseTag = (tag: string) => {
  const cleanTag = tag.replace(/:$/, '')
  const match = /^([^[]+)\[([^\]]+)\]$/.exec(cleanTag)
  return match ? { appname: match[1], procid: match[2] } : { appname: cleanTag }
}
