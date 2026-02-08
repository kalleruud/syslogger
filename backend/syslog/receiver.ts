import { insertLogWithTags } from '@database/queries'
import type { NewLog } from '@database/schema'
import logger from '../managers/log.manager'
import { wsManager } from '../server/websocket'
import { parseSyslogMessage } from './parsers'
import type { ParsedLog } from './types'

const getSeverityTags = (severity: number) => {
  if (severity <= 2) return ['critical']
  if (severity === 3) return ['error']
  if (severity === 4) return ['warning']
  return []
}

class SyslogReceiver {
  private socket: { close: () => void } | null = null
  private messageCount = 0

  constructor(private readonly port: number = 5140) {}

  async start() {
    this.socket = await Bun.udpSocket({
      port: this.port,
      hostname: '0.0.0.0',
      socket: {
        data: (_, buffer) => this.handleMessage(buffer.toString('utf-8')),
        error: (_, error) =>
          logger.error('syslog', `UDP error: ${error.message}`),
        drain: () => {},
      },
    })
    logger.info('syslog', `UDP receiver started on 0.0.0.0:${this.port}`)
  }

  private handleMessage(message: string) {
    const trimmed = message.trim()
    if (!trimmed) return

    this.messageCount++
    if (this.messageCount % 100 === 0) {
      logger.debug('syslog', `Processed ${this.messageCount} messages`)
    }

    const result = parseSyslogMessage(trimmed)
    if (result.success && result.log) {
      this.storeAndBroadcast(result.log, result.parserUsed)
    }
  }

  private async storeAndBroadcast(log: ParsedLog, parser?: string) {
    try {
      const tags = [
        ...(parser ? [parser] : []),
        ...getSeverityTags(log.severity),
      ]
      const saved = await insertLogWithTags(log as NewLog, tags)
      wsManager.broadcastLog(saved)
    } catch (error) {
      logger.error('syslog', `Failed to store log: ${error}`)
    }
  }

  async stop() {
    if (this.socket) {
      logger.info('syslog', `Stopping receiver (${this.messageCount} messages)`)
      this.socket.close()
      this.socket = null
    }
  }

  getStats() {
    return {
      port: this.port,
      messageCount: this.messageCount,
      isRunning: !!this.socket,
    }
  }
}

let instance: SyslogReceiver | null = null

export const getSyslogReceiver = (port?: number) => {
  if (!instance) {
    const defaultPort = Number.parseInt(
      process.env['SYSLOG_PORT'] ?? '5140',
      10
    )
    instance = new SyslogReceiver(port ?? defaultPort)
  }
  return instance
}
