import { insertLogWithTags } from '@database/queries'
import type { NewLog } from '@database/schema'
import logger from '../managers/log.manager'
import { wsManager } from '../server/websocket'
import { parseSyslogMessage } from './parsers'
import type { ParsedLog } from './types'

const DEFAULT_SYSLOG_PORT = 5140
const HOSTNAME = '0.0.0.0'
const LOG_PROGRESS_INTERVAL = 100

const SEVERITY_LEVEL = {
  EMERGENCY: 0,
  ALERT: 1,
  CRITICAL: 2,
  ERROR: 3,
  WARNING: 4,
} as const

const TAG = {
  CRITICAL: 'critical',
  ERROR: 'error',
  WARNING: 'warning',
} as const

const isCriticalSeverity = (severity: number): boolean => {
  return severity <= SEVERITY_LEVEL.CRITICAL
}

const isErrorSeverity = (severity: number): boolean => {
  return severity === SEVERITY_LEVEL.ERROR
}

const isWarningSeverity = (severity: number): boolean => {
  return severity === SEVERITY_LEVEL.WARNING
}

const getSeverityTags = (severity: number): string[] => {
  if (isCriticalSeverity(severity)) {
    return [TAG.CRITICAL]
  }
  if (isErrorSeverity(severity)) {
    return [TAG.ERROR]
  }
  if (isWarningSeverity(severity)) {
    return [TAG.WARNING]
  }
  return []
}

const combineTagsWithParser = (
  parserName: string | undefined,
  severityTags: string[]
): string[] => {
  return [...(parserName ? [parserName] : []), ...severityTags]
}

const isEmptyMessage = (message: string): boolean => {
  return message.trim().length === 0
}

const shouldLogProgress = (messageCount: number): boolean => {
  return messageCount % LOG_PROGRESS_INTERVAL === 0
}

class SyslogReceiver {
  private socket: { close: () => void } | null = null
  private messageCount = 0

  constructor(private readonly port: number = DEFAULT_SYSLOG_PORT) {}

  private logStartup(): void {
    logger.info('syslog', `UDP receiver started on ${HOSTNAME}:${this.port}`)
  }

  async start(): Promise<void> {
    this.socket = await Bun.udpSocket({
      port: this.port,
      hostname: HOSTNAME,
      socket: {
        data: (_, buffer) => this.handleIncomingData(buffer),
        error: (_, error) => this.handleUdpError(error),
        drain: () => {},
      },
    })

    this.logStartup()
  }

  private handleIncomingData(buffer: Buffer): void {
    const message = buffer.toString('utf-8')
    console.debug(message.trimEnd())
    this.processMessage(message.trimEnd())
  }

  private handleUdpError(error: Error): void {
    logger.error('syslog', `UDP error: ${error.message}`)
  }

  private processMessage(message: string): void {
    if (isEmptyMessage(message.trim())) return
    this.incrementMessageCount()
    this.logProgressIfNeeded()
    this.parseAndStore(message)
  }

  private incrementMessageCount(): void {
    this.messageCount++
  }

  private logProgressIfNeeded(): void {
    if (shouldLogProgress(this.messageCount)) {
      logger.debug('syslog', `Processed ${this.messageCount} messages`)
    }
  }

  private parseAndStore(message: string): void {
    const parseResult = parseSyslogMessage(message)

    if (parseResult.success && parseResult.log) {
      void this.persistAndBroadcast(parseResult.log, parseResult.parserUsed)
    }
  }

  private async persistAndBroadcast(
    log: ParsedLog,
    parserName?: string
  ): Promise<void> {
    try {
      const severityTags = getSeverityTags(log.severity)
      const allTags = combineTagsWithParser(parserName, severityTags)

      const savedLog = await insertLogWithTags(log as NewLog, allTags)
      wsManager.broadcastLog(savedLog)
    } catch (error) {
      logger.error('syslog', `Failed to store log: ${error}`)
    }
  }

  private logShutdown(): void {
    logger.info('syslog', `Stopping receiver (${this.messageCount} messages)`)
  }

  private closeSocket(): void {
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
  }

  async stop(): Promise<void> {
    if (!this.socket) {
      return
    }

    this.logShutdown()
    this.closeSocket()
  }

  getStats() {
    return {
      port: this.port,
      messageCount: this.messageCount,
      isRunning: this.socket !== null,
    }
  }
}

let singletonInstance: SyslogReceiver | null = null

const getDefaultPort = (): number => {
  return Number.parseInt(
    process.env['SYSLOG_PORT'] ?? String(DEFAULT_SYSLOG_PORT),
    10
  )
}

const createReceiverInstance = (port?: number): SyslogReceiver => {
  const portToUse = port ?? getDefaultPort()
  return new SyslogReceiver(portToUse)
}

export const getSyslogReceiver = (port?: number): SyslogReceiver => {
  singletonInstance ??= createReceiverInstance(port)
  return singletonInstance
}
