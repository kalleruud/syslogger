import { SEVERITIES } from '@/lib/severities'
import { SyslogParser, type ParsedLog } from './base.parser'

type ParsedTag = {
  appname: string | null
  procid: string | null
}

export default class Rfc3164SyslogParser extends SyslogParser {
  name = 'rfc3164' as const
  format =
    /^<(?<pri>\d{1,3})>(?<date>\w{3} {1,2}[1-3]?\d \d{2}:\d{2}:\d{2}) (?<hostname>[^ ]+) (?<tag>[^:]+): ?(?<message>.*)/

  public parse(rawMessage: string): ParsedLog {
    const parsed = this.parseParts(rawMessage)
    const priority = this.tryParsePri(parsed.pri)
    const severityOverride =
      priority.severity === SEVERITIES.info.level
        ? this.identifySeverity(parsed.message)
        : undefined

    return {
      parser: this.name,
      log: {
        raw: rawMessage,
        facility: priority.facility,
        severity: severityOverride?.level ?? priority.severity,
        timestamp: this.parseBSDTimestamp(parsed.date).toISOString(),
        hostname: parsed.hostname,
        appname: parsed.appname,
        procid: parsed.procid,
        msgid: null,
        message: parsed.message,
      },
    }
  }

  private parseParts(rawMessage: string) {
    const match = this.format.exec(rawMessage)
    if (!match?.groups) {
      throw new Error('Message does not match RFC3164 format')
    }

    const { pri, date, hostname, tag, message } = match.groups

    if (!pri) throw new Error(`PRI not found!: ${rawMessage}`)
    if (!date) throw new Error(`Date not found!: ${rawMessage}`)
    if (!hostname) throw new Error(`Hostname not found!: ${rawMessage}`)
    if (!message) throw new Error(`Message not found!: ${rawMessage}`)

    const { appname, procid } = this.parseTag(tag)

    return {
      pri,
      date,
      hostname,
      appname,
      procid,
      message,
    }
  }

  private parseTag(tag?: string): ParsedTag {
    if (!tag) return { appname: null, procid: null }

    const match = /^(?<appname>[^[]+)(?:\[(?<procid>[^\]]+)\])?$/.exec(
      tag.trim()
    )

    if (!match?.groups) return { appname: tag.trim(), procid: null }

    return {
      appname: match.groups.appname?.trim() ?? null,
      procid: match.groups.procid?.trim() ?? null,
    }
  }
}
