import { parsePriority, type ParsedLog } from '../managers/syslog.manager'
import { parseBSDTimestamp, parseTag } from './utils'

export const parseDockerSyslog = (message: string): ParsedLog | null => {
  const priMatch = /^<(\d{1,3})>(.*)$/.exec(message)
  if (!priMatch) return null

  const priority = Number.parseInt(priMatch[1]!, 10)
  if (Number.isNaN(priority) || priority > 191) return null

  const { facility, severity } = parsePriority(priority)
  const rest = priMatch[2]!

  // Direct TAG: MESSAGE (no timestamp)
  const directMatch = /^([^\s:]+(?:\[\d+\])?)\s*:\s*(.*)$/.exec(rest)
  if (directMatch && !/^\w{3}\s+\d{1,2}\s+\d{2}:/.test(rest)) {
    const { appname, procid } = parseTag(directMatch[1]!)
    return {
      timestamp: new Date().toISOString(),
      severity,
      facility,
      appname,
      procid,
      message: directMatch[2]!,
      raw: message,
    }
  }

  // Parse timestamp if present
  let timestamp = new Date().toISOString()
  let remainder = rest
  const tsMatch = /^([A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\s*(.*)$/.exec(
    rest
  )
  if (tsMatch) {
    timestamp = parseBSDTimestamp(tsMatch[1]!)
    remainder = tsMatch[2]!
  }

  // Parse hostname if present
  let hostname: string | undefined
  const parts = remainder.split(/\s+/)
  if (parts[0] && !parts[0].includes(':') && parts.length >= 2) {
    const isContainer = /^[0-9a-f]{12}$/.test(parts[0])
    const isHost =
      /^[a-zA-Z0-9][a-zA-Z0-9\-.]*$/.test(parts[0]) && parts[0].length > 1
    if (isContainer || isHost) {
      hostname = parts[0]
      remainder = parts.slice(1).join(' ')
    }
  }

  // Parse TAG: MESSAGE
  const tagMatch = /^([^\s:]+(?:\[\d+\])?)\s*:\s*(.*)$/.exec(remainder)
  if (tagMatch) {
    const { appname, procid } = parseTag(tagMatch[1]!)
    return {
      timestamp,
      severity,
      facility,
      hostname,
      appname,
      procid,
      message: tagMatch[2]!,
      raw: message,
    }
  }

  return {
    timestamp,
    severity,
    facility,
    hostname,
    message: remainder,
    raw: message,
  }
}

export const isDockerFormat = (message: string) =>
  /^<\d{1,3}>[^\s]+\s*:/.test(message) ||
  /^<\d{1,3}>[^<]+[0-9a-f]{12}/.test(message)
