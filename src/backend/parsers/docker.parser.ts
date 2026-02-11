import { SyslogParser, type ParsedLog } from './base.parser'

/*
 * Example syslog messages:
 *
 * ISO 8601 format:
 * <30>Feb 10 17:52:00 media-seerr[15379]: 2026-02-10T16:52:00.008Z [debug][Jobs]: Starting scheduled job: Download Sync
 *
 * Slash-separated format:
 * <30>Feb 10 17:49:11 media-unpackerr[15379]: [INFO] 2026/02/10 17:49:11.149257 logs.go:123: [Unpackerr] Message
 *
 * BSD fallback (no embedded timestamp):
 * <30>Feb 10 17:49:11 media-unpackerr[15379]: [INFO] Some message without timestamp
 */

export default class DockerSyslogParser extends SyslogParser {
  name = 'docker' as const
  format =
    /^<(?<pri>\d{1,3})>(?<date>\w{3} {1,2}[1-3]?\d \d{2}:\d{2}:\d{2}) (?<name>.+?)\[(?<procid>\d+?)\]: (?<message>.*)/

  private static readonly isoTimestampFormat =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?/
  private static readonly slashTimestampFormat =
    /^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}(?:\.\d{6})?/

  public parse(rawMessage: string) {
    const parsed = this.parseParts(rawMessage)
    const tags = this.parseTags(parsed.message)
    const timestamp = this.extractTimestamp(parsed.date, parsed.message)
    const priority = this.tryParsePri(parsed.pri, tags)

    return {
      log: {
        raw: rawMessage,
        ...parsed,
        ...priority,
        timestamp,
        msgid: null,
        hostname: null,
      },
      tags,
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
    const cleanedMessage = this.removeTagsAndTrim(message)

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

  private removeTagsAndTrim(message: string): string {
    return message.replace(/\[.*?\]/g, '').trim()
  }

  private parseSlashTimestamp(timestamp: string): string {
    const match =
      /^(?<year>\d{4})\/(?<month>\d{2})\/(?<day>\d{2}) (?<hour>\d{2}):(?<minute>\d{2}):(?<second>\d{2})(?:\.(?<micro>\d{6}))?/.exec(
        timestamp
      )

    if (!match?.groups) {
      throw new Error(`Slash timestamp parsing failed for: '${timestamp}'`)
    }

    const { year, month, day, hour, minute, second, micro } = match.groups

    const milliseconds = micro ? Math.floor(Number.parseInt(micro) / 1000) : 0
    const ms = milliseconds.toString().padStart(3, '0')

    return `${year}-${month}-${day}T${hour}:${minute}:${second}.${ms}Z`
  }
}
