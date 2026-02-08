import type { ParsedLog } from '../types'
import { parsePriority } from '../types'
import { parseBSDTimestamp, parseTag } from './utils'

export const parseRFC3164 = (message: string): ParsedLog | null => {
  const priMatch = /^<(\d{1,3})>(.*)$/.exec(message)
  if (!priMatch) return null

  const priority = Number.parseInt(priMatch[1]!, 10)
  if (Number.isNaN(priority) || priority > 191) return null

  const { facility, severity } = parsePriority(priority)
  const rest = priMatch[2]!

  // Parse timestamp
  const tsMatch = /^([A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\s+(.*)$/.exec(
    rest
  )
  const timestamp = tsMatch
    ? parseBSDTimestamp(tsMatch[1]!)
    : new Date().toISOString()
  const remainder = tsMatch ? tsMatch[2]! : rest

  // Parse hostname and tag
  const parts = /^(\S+)\s+(.*)$/.exec(remainder)
  if (!parts)
    return {
      timestamp,
      severity,
      facility,
      message: remainder.trim(),
      raw: message,
    }

  const [, first, after] = parts
  const hasTagChars = first!.includes(':') || first!.includes('[')

  let hostname: string | undefined
  let appname: string | undefined
  let procid: string | undefined
  let msg: string

  if (hasTagChars) {
    // First part is TAG
    const tag = parseTag(first!)
    appname = tag.appname
    procid = tag.procid
    msg = after!
  } else {
    // First part is hostname
    hostname = first
    const tagMatch = /^(\S+?):\s*(.*)$/.exec(after!)
    if (tagMatch) {
      const tag = parseTag(tagMatch[1]!)
      appname = tag.appname
      procid = tag.procid
      msg = tagMatch[2]!
    } else {
      msg = after!
    }
  }

  return {
    timestamp,
    severity,
    facility,
    hostname,
    appname,
    procid,
    message: msg.trim(),
    raw: message,
  }
}

export const isRFC3164 = (message: string) =>
  /^<\d{1,3}>[^1]/.test(message) || /^<\d{1,3}>$/.test(message)
