import { SyslogParser, type ParsedLog } from './base.parser'
import DockerSyslogParser from './docker.parser'
import FallbackParser from './fallback.parser'

const parsers: SyslogParser[] = [new DockerSyslogParser(), new FallbackParser()]

export default function parseSyslog(rawMessage: string): ParsedLog {
  for (const parser of Object.values(parsers)) {
    if (!parser.isParsable(rawMessage)) continue
    return parser.parse(rawMessage)
  }

  throw new Error(`No supported parsers for: '${rawMessage}'`)
}
