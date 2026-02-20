import { SEVERITIES } from '@/lib/severities'
import { SyslogParser, type ParsedLog } from './base.parser'

/*
 * Example syslog messages:
 *
 * <30>Feb 10 17:49:11 media-unpackerr[15379]: [INFO] 2026/02/10 17:49:11.149257 logs.go:123: [Unpackerr] Message
 * <30>Feb 10 17:52:00 media-seerr[15379]: 2026-02-10T16:52:00.008Z [debug][Jobs]: Starting scheduled job: Download Sync
 */

export default class DockerSyslogParser extends SyslogParser {
  name = 'docker' as const
  format =
    /^<(?<pri>\d{1,3})>(?<date>\w{3} {1,2}[1-3]?\d \d{2}:\d{2}:\d{2}) (?<name>.+?)\[(?<procid>\d+?)\]: (?<message>.*)/

  private static readonly isoTimestampFormat =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?/

  private static readonly slashTimestampFormat =
    /^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}(?:\.\d{1,6})?/

  public parse(rawMessage: string) {
    const parsed = this.parseParts(rawMessage)
    const timestamp = this.extractTimestamp(parsed.date, parsed.message)
    const priority = this.tryParsePri(parsed.pri)
    const severityOverride =
      priority.severity === SEVERITIES.info.level
        ? this.identifySeverity(parsed.message)
        : undefined

    return {
      parser: this.name,
      log: {
        raw: rawMessage,
        appname: parsed.appname,
        procid: parsed.procid,
        message: parsed.message,
        facility: priority.facility,
        severity: severityOverride?.level ?? priority.severity,
        timestamp,
        msgid: null,
        hostname: null,
      },
    } satisfies ParsedLog
  }

  private parseParts(rawMessage: string) {
    const match = this.format.exec(rawMessage)
    if (!match?.groups) {
      throw new Error('Message does not match Docker syslog format')
    }

    const { pri, date, name, procid, message } = match.groups

    if (!pri) throw new Error(`PRI not found!: ${rawMessage}`)
    if (!date) throw new Error(`Date not found!: ${rawMessage}`)
    if (!message) throw new Error(`Message not found!: ${rawMessage}`)

    return { pri, date, appname: name ?? null, procid: procid ?? null, message }
  }

  private extractTimestamp(bsdDate: string, message: string): string {
    const cleanedMessage = this.stripBracketedSegments(message)
    const isoMatch = DockerSyslogParser.isoTimestampFormat.exec(cleanedMessage)

    if (isoMatch) {
      return this.parseISO8601(isoMatch[0])
    }

    const slashMatch =
      DockerSyslogParser.slashTimestampFormat.exec(cleanedMessage)
    if (slashMatch) {
      return this.parseSlashTimestamp(slashMatch[0])
    }

    return this.parseBSDTimestamp(bsdDate).toISOString()
  }

  private parseSlashTimestamp(value: string): string {
    const [datePart, timePart] = value.split(' ')
    if (!datePart || !timePart) return this.parseISO8601(value)

    const [year, month, day] = datePart.split('/')
    const [time, fraction] = timePart.split('.')

    const milliseconds = fraction ? fraction.padEnd(3, '0').slice(0, 3) : '000'
    const isoTimestamp = `${year}-${month}-${day}T${time}.${milliseconds}Z`

    return this.parseISO8601(isoTimestamp)
  }

  private stripBracketedSegments(message: string): string {
    return message.replaceAll(/\[.*?\]/g, '').trim()
  }
}
