import { insertLog } from '@/database/queries'
import type { NewLog } from '@/database/schema'
import { broadcastLog } from '../websocket'

const FACILITY_LOCAL0 = 16
const HOSTNAME = 'syslogger'
const MULTIPLIER_FOR_PRIORITY = 8

const SEVERITY = {
  DEBUG: 7,
  INFO: 6,
  WARNING: 4,
  ERROR: 3,
} as const

const calculatePriority = (severity: number): number => {
  return FACILITY_LOCAL0 * MULTIPLIER_FOR_PRIORITY + severity
}

const formatRawSyslogMessage = (
  priority: number,
  timestamp: string,
  appname: string,
  message: string
): string => {
  return `<${priority}>1 ${timestamp} ${HOSTNAME} ${appname} - - - ${message}`
}

const createLogEntry = (
  severity: number,
  appname: string,
  message: string
): NewLog => {
  const timestamp = new Date().toISOString()
  const priority = calculatePriority(severity)

  return {
    timestamp,
    severity,
    facility: FACILITY_LOCAL0,
    hostname: HOSTNAME,
    appname,
    message,
    raw: formatRawSyslogMessage(priority, timestamp, appname, message),
  }
}

const persistLog = async (
  severity: number,
  appname: string,
  message: string
): Promise<void> => {
  try {
    const logEntry = createLogEntry(severity, appname, message)
    const savedLog = await insertLog(logEntry)
    broadcastLog(savedLog)
  } catch (error) {
    console.error('[CRITICAL] Failed to log:', error)
  }
}

const writeToConsole = (
  level: string,
  appname: string,
  message: string
): void => {
  console[level.toLowerCase() as 'debug' | 'info' | 'warn' | 'error'](
    `[${level}] ${appname}:`,
    message
  )
}

const createLogFunction = (severity: number, level: string) => {
  return (appname: string, message: string): void => {
    writeToConsole(level, appname, message)
    void persistLog(severity, appname, message)
  }
}

const logger = {
  debug: createLogFunction(SEVERITY.DEBUG, 'DEBUG'),
  info: createLogFunction(SEVERITY.INFO, 'INFO'),
  warn: createLogFunction(SEVERITY.WARNING, 'WARN'),
  error: createLogFunction(SEVERITY.ERROR, 'ERROR'),
}

export default logger
