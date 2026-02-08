import type { ParsedLog } from '../types'
import { parsePriority } from '../types'

/**
 * Parse Docker syslog format messages
 * Docker's syslog driver can send messages in various formats:
 * - With hostname: <PRI>TIMESTAMP HOSTNAME TAG[PID]: MESSAGE
 * - Without hostname: <PRI>TAG[PID]: MESSAGE
 * - Container ID as hostname: <PRI>TIMESTAMP 1234abcd5678 TAG: MESSAGE
 * - Custom tag format: <PRI>container-name[PID]: MESSAGE
 */
export function parseDockerSyslog(message: string): ParsedLog | null {
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

  // Docker messages may not have a timestamp
  // Try to detect if the message starts with a TAG directly
  const directTagPattern = /^([^\s:]+(?:\[\d+\])?)\s*:\s*(.*)$/
  const directTagMatch = new RegExp(directTagPattern).exec(rest)

  if (directTagMatch && !new RegExp(/^\w{3}\s+\d{1,2}\s+\d{2}:/).exec(rest)) {
    // Looks like direct TAG: MESSAGE format (no timestamp, no hostname)
    const tag = directTagMatch[1]!
    const msg = directTagMatch[2]!
    const { appname, procid } = parseDockerTag(tag)

    return {
      timestamp: new Date().toISOString(), // Use receive time
      severity,
      facility,
      appname,
      procid,
      message: msg,
      raw: message,
    }
  }

  // Try parsing with optional timestamp and hostname
  // Pattern: [TIMESTAMP] [HOSTNAME] TAG[PID]: MESSAGE
  const parts = rest.split(/\s+/)
  let timestamp = new Date().toISOString()
  let hostname: string | undefined
  let tagWithMessage = rest

  // Check if first part looks like a timestamp
  if (parts[0] && isTimestampLike(parts[0])) {
    // Has timestamp, parse it
    const timestampPattern =
      /^([A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\s*(.*)$/
    const tsMatch = new RegExp(timestampPattern).exec(rest)
    if (tsMatch) {
      timestamp = parseBSDTimestamp(tsMatch[1]!)
      tagWithMessage = tsMatch[2]!
    }
  }

  // Check if next part is a hostname (before TAG:)
  const remainingParts = tagWithMessage.split(/\s+/)
  if (
    remainingParts.length >= 2 &&
    remainingParts[0] &&
    !remainingParts[0].includes(':')
  ) {
    // First part doesn't have colon, might be hostname
    const potentialHostname = remainingParts[0]
    // Check if it looks like a container ID (12-char hex) or a hostname
    if (
      isContainerIdLike(potentialHostname) ||
      isHostnameLike(potentialHostname)
    ) {
      hostname = potentialHostname
      tagWithMessage = remainingParts.slice(1).join(' ')
    }
  }

  // Parse TAG: MESSAGE
  const tagPattern = /^([^\s:]+(?:\[\d+\])?)\s*:\s*(.*)$/
  const tagMatch = new RegExp(tagPattern).exec(tagWithMessage)

  if (tagMatch) {
    const tag = tagMatch[1]!
    const msg = tagMatch[2]!
    const { appname, procid } = parseDockerTag(tag)

    return {
      timestamp,
      severity,
      facility,
      hostname,
      appname,
      procid,
      message: msg,
      raw: message,
    }
  }

  // Fallback: treat entire remainder as message
  return {
    timestamp,
    severity,
    facility,
    hostname,
    message: tagWithMessage,
    raw: message,
  }
}

/**
 * Parse Docker tag format
 * Examples:
 * - "container-name[1234]" -> appname: "container-name", procid: "1234"
 * - "app" -> appname: "app"
 * - "my-app-1" -> appname: "my-app-1"
 */
function parseDockerTag(tag: string): { appname?: string; procid?: string } {
  const bracketMatch = new RegExp(/^([^[]+)\[([^\]]+)\]$/).exec(tag)
  if (bracketMatch) {
    return {
      appname: bracketMatch[1],
      procid: bracketMatch[2],
    }
  }

  return { appname: tag }
}

/**
 * Check if string looks like a timestamp
 */
function isTimestampLike(str: string): boolean {
  // Check for month abbreviation at start
  return /^[A-Z][a-z]{2}/.test(str)
}

/**
 * Check if string looks like a container ID (12 hex characters)
 */
function isContainerIdLike(str: string): boolean {
  return /^[0-9a-f]{12}$/.test(str)
}

/**
 * Check if string looks like a hostname (alphanumeric + hyphens/dots)
 */
function isHostnameLike(str: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9\-.]*$/.test(str) && str.length > 1
}

/**
 * Parse BSD timestamp format (same as RFC 3164)
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

  const now = new Date()
  const year = now.getFullYear()
  const date = new Date(year, month, day, hour, minute, second)

  if (date > now) {
    date.setFullYear(year - 1)
  }

  return date.toISOString()
}

/**
 * Check if a message might be from Docker
 * (heuristic: looks like it has no timestamp or has container-like naming)
 */
export function isDockerFormat(message: string): boolean {
  // Starts with <PRI> and TAG: MESSAGE (no timestamp)
  if (/^<\d{1,3}>[^\s]+\s*:/.test(message)) {
    return true
  }

  // Contains container ID-like hostname
  if (/^<\d{1,3}>[^<]+[0-9a-f]{12}/.test(message)) {
    return true
  }

  return false
}
