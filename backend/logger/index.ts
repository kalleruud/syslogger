import { insertLogWithTags } from '@database/queries'
import type { NewLog } from '@database/schema'

const HOSTNAME = 'syslogger'
const FACILITY = 16 // local0

type BroadcastFn = (log: unknown) => void

let broadcastFn: BroadcastFn | null = null

/**
 * Set the broadcast function for WebSocket integration.
 * When set, all logged messages will be broadcast to connected clients.
 */
export function setBroadcast(fn: BroadcastFn): void {
  broadcastFn = fn
}

/**
 * Internal logging function that writes to the database.
 * Falls back to console.error on database failures to avoid infinite loops.
 */
async function log(
  severity: number,
  appname: string,
  message: string,
  tags?: string[]
): Promise<void> {
  const timestamp = new Date().toISOString()
  const priority = FACILITY * 8 + severity
  const raw = `<${priority}>1 ${timestamp} ${HOSTNAME} ${appname} - - - ${message}`

  const logEntry: NewLog = {
    timestamp,
    severity,
    facility: FACILITY,
    hostname: HOSTNAME,
    appname,
    message,
    raw,
  }

  const allTags = ['internal', ...(tags ?? [])]

  try {
    const result = await insertLogWithTags(logEntry, allTags)
    if (broadcastFn) {
      broadcastFn(result)
    }
  } catch (error) {
    // Fall back to console to avoid infinite loops
    console.error('[syslogger]', appname, message, error)
  }
}

export const logger = {
  debug: (appname: string, message: string, tags?: string[]) =>
    log(7, appname, message, tags),
  info: (appname: string, message: string, tags?: string[]) =>
    log(6, appname, message, tags),
  warn: (appname: string, message: string, tags?: string[]) =>
    log(4, appname, message, tags),
  error: (appname: string, message: string, tags?: string[]) =>
    log(3, appname, message, tags),
}
