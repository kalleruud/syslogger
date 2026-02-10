import { parsePriority, type ParsedLog } from '../managers/syslog.manager'
import { parseISO8601, parseNilValue } from './utils'

const RFC5424_PATTERN =
  /^<(\d{1,3})>1\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)(?:\s+(.*))?$/

export const parseRFC5424 = (message: string): ParsedLog | null => {
  const match = RFC5424_PATTERN.exec(message)
  if (!match) return null

  const [
    ,
    pri,
    timestamp,
    hostname,
    appname,
    procid,
    msgid,
    structuredData,
    msg,
  ] = match

  const priority = Number.parseInt(pri!, 10)
  if (Number.isNaN(priority) || priority > 191) return null

  const { facility, severity } = parsePriority(priority)

  return {
    timestamp: parseISO8601(timestamp!),
    severity,
    facility,
    hostname: parseNilValue(hostname!),
    appname: parseNilValue(appname!),
    procid: parseNilValue(procid!),
    msgid: parseNilValue(msgid!),
    structuredData: parseNilValue(structuredData!),
    message: msg ?? '',
    raw: message,
  }
}

export const isRFC5424 = (message: string) => /^<\d{1,3}>1\s/.test(message)
