import type { Log, Tag } from '@/database/schema'
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
  tags: Omit<Tag, 'id' | 'createdAt'>[]
}

export abstract class SyslogParser {
  abstract readonly name: 'rfc5424' | 'rfc3164' | 'docker' | 'fallback'
  protected abstract readonly format: RegExp

  private static readonly tagFormat = /\[(?<tag>.*?)\]/g
  private static readonly bsdFormat =
    /(?<month>\w{3}) (?<date> ?[1-3]?\d) (?<timestamp>\d{2}:\d{2}:\d{2})/g

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
   * Feb 10 17:49:11
   */
  protected parseBSDTimestamp(bsdTime: string): Date {
    const match = SyslogParser.bsdFormat.exec(bsdTime)
    if (!match?.groups) throw new Error(`BSD format is incorrect: '${bsdTime}'`)

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

  protected tryParsePri(pri: string, tags: ReturnType<typeof this.parseTags>) {
    const { facility, severity } = this.parsePri(Number.parseFloat(pri))

    // Docker always gives PRI 30, so we try to identify severity within message
    const severityOverride =
      severity === SEVERITIES.information
        ? this.identifySeverity(tags)
        : undefined

    return {
      facility: facility.level,
      severity: severityOverride?.level ?? severity.level,
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

  protected parseTags(message: string): ParsedLog['tags'] {
    const tags: ParsedLog['tags'] = []
    while (true) {
      const match = SyslogParser.tagFormat.exec(message)
      if (!match?.groups?.tag) return tags
      tags.push({ name: match.groups.tag.trim().toLowerCase() })
    }
  }

  protected identifySeverity(tags: ParsedLog['tags']) {
    const tagSet = new Set(tags.map(t => t.name))
    for (const severity of Object.values(SEVERITIES)) {
      if (tagSet.intersection(severity.synonyms)) return severity
    }
  }
}
