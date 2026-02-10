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

  public parse(rawMessage: string) {
    const parsed = this.parseParts(rawMessage)
    const timestamp = this.parseBSDTimestamp(parsed.date)?.toISOString()
    const tags = this.parseTags(parsed.message)
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
}
