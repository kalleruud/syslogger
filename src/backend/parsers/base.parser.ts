import type { Log } from '@/database/schema'
import { FACILITIES, getFacility, type Facility } from '@/lib/facilities'
import { getSeverity, SEVERITIES, type Severity } from '@/lib/severities'

const MONTHS = [
  'Jan', // 0
  'Feb', // 1
  'Mar', // 2
  'Apr', // 3
  'May', // 4
  'Jun', // 5
  'Jul', // 6
  'Aug', // 7
  'Sep', // 8
  'Oct', // 9
  'Nov', // 10
  'Dec', // 11
]

export type ParsedLog = {
  log: Omit<Log, 'id' | 'createdAt'>
}

export abstract class SyslogParser {
  abstract readonly name: 'rfc5424' | 'rfc3164' | 'docker' | 'fallback'
  protected abstract readonly format: RegExp

  private static readonly bsdFormat =
    /(?<month>\w{3}) (?<date>( |[1-3])\d) (?<time>[0-2]\d:[0-5]\d:[0-5]\d)/

  abstract parse(rawMessage: string): ParsedLog

  public isParsable(rawMessage: string): boolean {
    return this.format.test(rawMessage)
  }

  protected parseISO8601(timestamp: string) {
    const date = new Date(timestamp)
    return Number.isNaN(date.getTime())
      ? new Date().toISOString()
      : date.toISOString()
  }

  /*
   * Parses BSD timestamp format:
   * Feb 10 23:59:59
   * Jun  1 00:00:00
   */
  protected parseBSDTimestamp(bsdTime: string): Date {
    const match = SyslogParser.bsdFormat.exec(bsdTime)
    if (!match?.groups)
      throw new Error(`BSD format parsing failed for: '${bsdTime}'`)

    const { month, date, time } = match.groups

    const monthValue = MONTHS.indexOf(month!)
    const [hour, minute, second] = time!.split(':')

    const now = new Date()
    return new Date(
      now.getFullYear(),
      monthValue,
      Number.parseInt(date!),
      Number.parseInt(hour!),
      Number.parseInt(minute!),
      Number.parseInt(second!),
      now.getMilliseconds()
    )
  }

  protected tryParsePri(pri: string) {
    const { facility, severity } = this.parsePri(Number.parseFloat(pri))

    return {
      facility: facility.level,
      severity: severity.level,
    }
  }

  protected parsePri(value: number): {
    severity: Severity
    facility: Facility
  } {
    if (value === 0)
      return {
        severity: SEVERITIES.critical,
        facility: FACILITIES.kernel,
      }
    return {
      severity: getSeverity(value % 8),
      facility: getFacility(Math.floor(value / 8)),
    }
  }

  protected identifySeverity(message: string) {
    const lowerMessage = message.toLowerCase()
    for (const severity of Object.values(SEVERITIES)) {
      for (const synonym of severity.synonyms) {
        if (lowerMessage.includes(synonym)) return severity
      }
    }
  }
}
