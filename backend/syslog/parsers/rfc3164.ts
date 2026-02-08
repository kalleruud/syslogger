import type { ParsedLog } from '../types'
import { parsePriority } from '../types'

/**
 * Parse RFC 3164 (BSD syslog) format message
 * Format: <PRI>TIMESTAMP HOSTNAME TAG: MESSAGE
 * Example: <34>Feb  8 12:00:00 hostname sshd[1234]: Connection from 192.168.1.1
 */
export function parseRFC3164(message: string): ParsedLog | null {
  // Extract priority
  const priMatch = new RegExp(/^<(\d{1,3})>(.*)$/).exec(message)
  if (!priMatch) {
    return null
  }

  const priority = Number.parseInt(priMatch[1]!, 10)
  if (Number.isNaN(priority) || priority < 0 || priority > 191) {
    return null
  }

  const { facility, severity } = parsePriority(priority)
  const rest = priMatch[2]!

  // Try to parse timestamp (BSD format: "Mmm dd hh:mm:ss")
  // Example: "Feb  8 12:00:00" or "Feb 8 12:00:00"
  const timestampPattern =
    /^([A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\s+(.*)$/
  const timestampMatch = new RegExp(timestampPattern).exec(rest)

  let timestamp: string
  let remainder: string

  if (timestampMatch) {
    const bsdTimestamp = timestampMatch[1]!
    remainder = timestampMatch[2]!
    timestamp = parseBSDTimestamp(bsdTimestamp)
  } else {
    // No timestamp found, use current time
    timestamp = new Date().toISOString()
    remainder = rest
  }

  // Parse hostname and tag/message
  // Hostname is optional in some implementations
  let hostname: string | undefined
  let appname: string | undefined
  let procid: string | undefined
  let msg: string

  // Try to extract hostname (first word before colon or space)
  const hostnamePattern = /^(\S+)\s+(.*)$/
  const hostnameMatch = new RegExp(hostnamePattern).exec(remainder)

  if (hostnameMatch) {
    const possibleHostname = hostnameMatch[1]!
    const afterHostname = hostnameMatch[2]!

    // Check if this looks like a TAG (has colon or bracket)
    if (possibleHostname.includes(':') || possibleHostname.includes('[')) {
      // No hostname, this is the TAG
      const tagParse = parseTag(possibleHostname)
      appname = tagParse.appname
      procid = tagParse.procid
      msg = afterHostname
    } else {
      // Has hostname
      hostname = possibleHostname

      // Now parse TAG from remainder
      const tagPattern = /^(\S+?):\s*(.*)$/
      const tagMatch = new RegExp(tagPattern).exec(afterHostname)

      if (tagMatch) {
        const tag = tagMatch[1]!
        msg = tagMatch[2]!
        const tagParse = parseTag(tag)
        appname = tagParse.appname
        procid = tagParse.procid
      } else {
        // No colon found, treat entire remainder as message
        msg = afterHostname
      }
    }
  } else {
    // Could not parse, treat as message
    msg = remainder
  }

  return {
    timestamp,
    severity,
    facility,
    hostname,
    appname,
    procid,
    message: msg.trim(),
    raw: message,
  }
}

/**
 * Parse TAG field which may include process ID
 * Examples:
 * - "sshd[1234]" -> appname: "sshd", procid: "1234"
 * - "kernel" -> appname: "kernel", procid: undefined
 * - "app[123]:" -> appname: "app", procid: "123"
 */
function parseTag(tag: string): { appname?: string; procid?: string } {
  // Remove trailing colon if present
  const cleanTag = tag.replace(/:$/, '')

  const bracketMatch = new RegExp(/^([^[]+)\[([^\]]+)\]$/).exec(cleanTag)
  if (bracketMatch) {
    return {
      appname: bracketMatch[1],
      procid: bracketMatch[2],
    }
  }

  return { appname: cleanTag }
}

/**
 * Parse BSD timestamp format (Mmm dd hh:mm:ss)
 * Note: BSD format has no year or timezone, so we use current year and local timezone
 */
function parseBSDTimestamp(bsdTime: string): string {
  const months: Record<string, number> = {
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
  }

  const pattern = /^([A-Z][a-z]{2})\s+(\d{1,2})\s+(\d{2}):(\d{2}):(\d{2})$/
  const match = new RegExp(pattern).exec(bsdTime)

  if (!match) {
    return new Date().toISOString()
  }

  const monthStr = match[1]!
  const day = Number.parseInt(match[2]!, 10)
  const hour = Number.parseInt(match[3]!, 10)
  const minute = Number.parseInt(match[4]!, 10)
  const second = Number.parseInt(match[5]!, 10)

  const month = months[monthStr]
  if (month === undefined) {
    return new Date().toISOString()
  }

  // Use current year (limitation of BSD syslog format)
  const now = new Date()
  const year = now.getFullYear()

  const date = new Date(year, month, day, hour, minute, second)

  // Handle year rollover: if the date is in the future, it's probably from last year
  if (date > now) {
    date.setFullYear(year - 1)
  }

  return date.toISOString()
}

/**
 * Check if a message looks like RFC 3164 format
 * (starts with <PRI> but not <PRI>1)
 */
export function isRFC3164(message: string): boolean {
  return /^<\d{1,3}>[^1]/.test(message) || /^<\d{1,3}>$/.test(message)
}
