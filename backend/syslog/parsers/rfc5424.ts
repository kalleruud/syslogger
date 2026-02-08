import type { ParsedLog } from '../types'
import { parsePriority } from '../types'

/**
 * Parse RFC 5424 format syslog message
 * Format: <PRI>VERSION TIMESTAMP HOSTNAME APP-NAME PROCID MSGID STRUCTURED-DATA MSG
 * Example: <165>1 2024-02-08T12:00:00.000Z hostname app 1234 ID47 [exampleSDID@32473 key="value"] Message text
 */
export function parseRFC5424(message: string): ParsedLog | null {
  // RFC 5424 must start with <PRI>VERSION (version is always 1)
  const rfc5424Pattern =
    /^<(\d{1,3})>(\d+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)(?:\s+(.*))?$/

  const match = new RegExp(rfc5424Pattern).exec(message)
  if (!match) {
    return null
  }

  const [
    ,
    priorityStr,
    version,
    timestamp,
    hostname,
    appname,
    procid,
    msgid,
    structuredData,
    msg,
  ] = match

  // Version must be 1 for RFC 5424
  if (version !== '1') {
    return null
  }

  const priority = Number.parseInt(priorityStr!, 10)
  if (Number.isNaN(priority) || priority < 0 || priority > 191) {
    return null
  }

  const { facility, severity } = parsePriority(priority)

  // Parse timestamp - RFC 5424 uses ISO 8601 format
  const parsedTimestamp = parseISO8601Timestamp(timestamp!)

  return {
    timestamp: parsedTimestamp,
    severity,
    facility,
    hostname: parseNilValue(hostname!),
    appname: parseNilValue(appname!),
    procid: parseNilValue(procid!),
    msgid: parseNilValue(msgid!),
    structuredData:
      structuredData && structuredData !== '-' ? structuredData : undefined,
    message: msg ?? '',
    raw: message,
  }
}

/**
 * Parse NILVALUE ("-" character) as undefined
 */
function parseNilValue(value: string): string | undefined {
  return value === '-' ? undefined : value
}

/**
 * Parse ISO 8601 timestamp from RFC 5424 message
 * Supports various ISO 8601 formats:
 * - 2024-02-08T12:00:00Z
 * - 2024-02-08T12:00:00.123Z
 * - 2024-02-08T12:00:00+00:00
 * - 2024-02-08T12:00:00.123456+00:00
 */
function parseISO8601Timestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp)
    if (Number.isNaN(date.getTime())) {
      // Fall back to current time if parsing fails
      return new Date().toISOString()
    }
    return date.toISOString()
  } catch {
    return new Date().toISOString()
  }
}

/**
 * Check if a message looks like RFC 5424 format
 * (starts with <PRI>1 where 1 is the version)
 */
export function isRFC5424(message: string): boolean {
  return /^<\d{1,3}>1\s/.test(message)
}
