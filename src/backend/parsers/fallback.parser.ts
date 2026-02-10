import { SyslogParser } from './base.parser'

export default class FallbackParser extends SyslogParser {
  name = 'fallback' as const
  format = /^<(?<pri>\d{1,3})>(?<message>.*)/

  public override parse(rawMessage: string) {
    const match = this.format.exec(rawMessage)
    if (!match?.groups) {
      throw new Error('Message does not match syslog format')
    }

    const { pri, message } = match.groups

    if (!pri) throw new Error(`PRI not found!: ${rawMessage}`)
    if (!message) throw new Error(`Message not found!: ${rawMessage}`)

    const tags = this.parseTags(message)
    const priority = this.tryParsePri(pri, tags)

    return {
      log: {
        raw: rawMessage,
        ...priority,
        message: message,
        timestamp: new Date()?.toISOString(),
        appname: null,
        procid: null,
        msgid: null,
        hostname: null,
      },
      tags,
    }
  }
}
