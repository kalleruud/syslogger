import type { ParseResult } from '../managers/syslog.manager'
import { isDockerFormat, parseDockerSyslog } from './docker'
import { isRFC3164, parseRFC3164 } from './rfc3164'
import { isRFC5424, parseRFC5424 } from './rfc5424'

const parsers = [
  { check: isRFC5424, parse: parseRFC5424, name: 'rfc5424' as const },
  { check: isRFC3164, parse: parseRFC3164, name: 'rfc3164' as const },
  { check: isDockerFormat, parse: parseDockerSyslog, name: 'docker' as const },
]

export const parseSyslogMessage = (message: string): ParseResult => {
  const trimmed = message.trim()
  if (!trimmed) return { success: false, error: 'Empty message' }

  // Try parsers with format detection
  for (const { check, parse, name } of parsers) {
    if (check(trimmed)) {
      const log = parse(trimmed)
      if (log) return { success: true, log, parserUsed: name }
    }
  }

  // Fallback: try all parsers
  for (const { parse, name } of parsers) {
    const log = parse(trimmed)
    if (log) return { success: true, log, parserUsed: name }
  }

  // Ultimate fallback
  return {
    success: true,
    log: {
      timestamp: new Date().toISOString(),
      severity: 6,
      facility: 1,
      message: trimmed,
      raw: trimmed,
    },
    parserUsed: 'fallback',
  }
}

export { parseDockerSyslog, parseRFC3164, parseRFC5424 }
