import { insertLogWithTags } from '@database/queries'
import type { NewLog } from '@database/schema'

const FACILITY = 16 // local0

const createLogEntry = (
  severity: number,
  appname: string,
  message: string
): NewLog => {
  const timestamp = new Date().toISOString()
  const priority = FACILITY * 8 + severity
  return {
    timestamp,
    severity,
    facility: FACILITY,
    hostname: 'syslogger',
    appname,
    message,
    raw: `<${priority}>1 ${timestamp} syslogger ${appname} - - - ${message}`,
  }
}

const log = async (
  severity: number,
  appname: string,
  message: string,
  tags?: string[]
) => {
  try {
    const saved = await insertLogWithTags(
      createLogEntry(severity, appname, message),
      ['internal', ...(tags ?? [])]
    )
    import('../server/websocket')
      .then(({ wsManager }) => wsManager.broadcastLog(saved))
      .catch(() => {})
  } catch (error) {
    console.error('[CRITICAL] Failed to log:', error)
  }
}

const logger = {
  debug: (app: string, msg: string, tags?: string[]) => (
    console.debug(`[DEBUG] ${app}:`, msg),
    log(7, app, msg, tags)
  ),
  info: (app: string, msg: string, tags?: string[]) => (
    console.info(`[INFO] ${app}:`, msg),
    log(6, app, msg, tags)
  ),
  warn: (app: string, msg: string, tags?: string[]) => (
    console.warn(`[WARN] ${app}:`, msg),
    log(4, app, msg, tags)
  ),
  error: (app: string, msg: string, tags?: string[]) => (
    console.error(`[ERROR] ${app}:`, msg),
    log(3, app, msg, tags)
  ),
}

export default logger
