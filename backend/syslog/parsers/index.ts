import type { ParsedLog, ParseResult } from '../types'
import { isDockerFormat, parseDockerSyslog } from './docker'
import { isRFC3164, parseRFC3164 } from './rfc3164'
import { isRFC5424, parseRFC5424 } from './rfc5424'

/**
 * Parse a syslog message using automatic format detection
 * Tries parsers in order: RFC 5424 -> RFC 3164 -> Docker -> Fallback
 */
export function parseSyslogMessage(message: string): ParseResult {
  // Remove any trailing whitespace
  const trimmed = message.trim()

  if (!trimmed) {
    return {
      success: false,
      error: 'Empty message',
    }
  }

  // Try RFC 5424 first (most structured)
  if (isRFC5424(trimmed)) {
    const result = parseRFC5424(trimmed)
    if (result) {
      return {
        success: true,
        log: result,
        parserUsed: 'rfc5424',
      }
    }
  }

  // Try RFC 3164 (BSD syslog)
  if (isRFC3164(trimmed)) {
    const result = parseRFC3164(trimmed)
    if (result) {
      return {
        success: true,
        log: result,
        parserUsed: 'rfc3164',
      }
    }
  }

  // Try Docker format
  if (isDockerFormat(trimmed)) {
    const result = parseDockerSyslog(trimmed)
    if (result) {
      return {
        success: true,
        log: result,
        parserUsed: 'docker',
      }
    }
  }

  // Fallback: try all parsers in sequence
  const rfc5424Result = parseRFC5424(trimmed)
  if (rfc5424Result) {
    return {
      success: true,
      log: rfc5424Result,
      parserUsed: 'rfc5424',
    }
  }

  const rfc3164Result = parseRFC3164(trimmed)
  if (rfc3164Result) {
    return {
      success: true,
      log: rfc3164Result,
      parserUsed: 'rfc3164',
    }
  }

  const dockerResult = parseDockerSyslog(trimmed)
  if (dockerResult) {
    return {
      success: true,
      log: dockerResult,
      parserUsed: 'docker',
    }
  }

  // Ultimate fallback: create a minimal log entry
  return {
    success: true,
    log: createFallbackLog(trimmed),
    parserUsed: 'fallback',
  }
}

/**
 * Create a fallback log entry for messages that don't match any parser
 * Treats the entire message as the content with default severity
 */
function createFallbackLog(message: string): ParsedLog {
  return {
    timestamp: new Date().toISOString(),
    severity: 6, // Informational
    facility: 1, // User-level
    message,
    raw: message,
  }
}

export { parseDockerSyslog } from './docker'
export { parseRFC3164 } from './rfc3164'
export { parseRFC5424 } from './rfc5424'
