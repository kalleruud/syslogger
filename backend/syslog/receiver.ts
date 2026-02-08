import { insertLogWithTags, type LogWithTags } from '@database/queries'
import type { NewLog } from '@database/schema'
import logger from '../managers/log.manager'
import { wsManager } from '../server/websocket'
import { parseSyslogMessage } from './parsers'

/**
 * UDP Syslog Receiver
 * Listens for syslog messages on a UDP port and processes them
 */
export class SyslogReceiver {
  private socket: { close: () => void } | null = null
  private readonly port: number
  private messageCount = 0

  constructor(port: number = 5140) {
    this.port = port
  }

  /**
   * Start the UDP receiver
   */
  async start(): Promise<void> {
    try {
      this.socket = await Bun.udpSocket({
        port: this.port,
        hostname: '0.0.0.0',

        socket: {
          data: (_, buffer, port, address) => {
            this.handleMessage(buffer, address, port)
          },

          error: (_, error) => {
            logger.error(
              'syslog-receiver',
              `UDP socket error: ${error.message}`
            )
          },

          drain: () => {
            // Called when socket is ready to send more data (not typically used for receiving)
          },
        },
      })

      logger.info(
        'syslog-receiver',
        `UDP syslog receiver started on 0.0.0.0:${this.port}`
      )
    } catch (error) {
      logger.error(
        'syslog-receiver',
        `Failed to start UDP receiver on port ${this.port}: ${error}`
      )
      throw error
    }
  }

  /**
   * Handle incoming syslog message
   */
  private handleMessage(buffer: Buffer, address: string, port: number): void {
    try {
      this.messageCount++

      // Convert buffer to string (assume UTF-8)
      const message = buffer.toString('utf-8').trim()

      if (!message) {
        return
      }

      // Log every 100 messages for monitoring
      if (this.messageCount % 100 === 0) {
        logger.debug(
          'syslog-receiver',
          `Processed ${this.messageCount} messages (last from ${address}:${port})`
        )
      }

      // Parse the message
      const parseResult = parseSyslogMessage(message)

      if (!parseResult.success || !parseResult.log) {
        logger.warn(
          'syslog-receiver',
          `Failed to parse message from ${address}:${port}: ${parseResult.error ?? 'Unknown error'}`
        )
        return
      }

      // Store in database and broadcast
      this.storeAndBroadcast(parseResult.log, parseResult.parserUsed)
    } catch (error) {
      logger.error(
        'syslog-receiver',
        `Error handling message from ${address}:${port}: ${error}`
      )
    }
  }

  /**
   * Store log in database and broadcast to WebSocket clients
   */
  private async storeAndBroadcast(
    parsedLog: import('./types').ParsedLog,
    parserUsed?: string
  ): Promise<void> {
    try {
      // Convert to database format
      const dbLog: NewLog = {
        timestamp: parsedLog.timestamp,
        severity: parsedLog.severity,
        facility: parsedLog.facility,
        hostname: parsedLog.hostname,
        appname: parsedLog.appname,
        procid: parsedLog.procid,
        msgid: parsedLog.msgid,
        message: parsedLog.message,
        raw: parsedLog.raw,
      }

      // Add tags based on parser used and severity
      const tags: string[] = []
      if (parserUsed) {
        tags.push(parserUsed)
      }

      // Add severity-based tags
      if (parsedLog.severity <= 2) {
        tags.push('critical')
      } else if (parsedLog.severity === 3) {
        tags.push('error')
      } else if (parsedLog.severity === 4) {
        tags.push('warning')
      }

      // Insert into database
      const logWithTags: LogWithTags = await insertLogWithTags(dbLog, tags)

      // Broadcast to connected WebSocket clients
      wsManager.broadcastLog(logWithTags)
    } catch (error) {
      logger.error('syslog-receiver', `Failed to store/broadcast log: ${error}`)
    }
  }

  /**
   * Stop the UDP receiver
   */
  async stop(): Promise<void> {
    if (this.socket) {
      logger.info(
        'syslog-receiver',
        `Stopping UDP receiver (processed ${this.messageCount} messages)`
      )
      this.socket.close()
      this.socket = null
    }
  }

  /**
   * Get receiver statistics
   */
  getStats() {
    return {
      port: this.port,
      messageCount: this.messageCount,
      isRunning: this.socket !== null,
    }
  }
}

// Singleton instance
let receiverInstance: SyslogReceiver | null = null

/**
 * Get or create the syslog receiver instance
 */
export function getSyslogReceiver(port?: number): SyslogReceiver {
  if (!receiverInstance) {
    const defaultPort = Number.parseInt(
      process.env['SYSLOG_PORT'] ?? '5140',
      10
    )
    receiverInstance = new SyslogReceiver(port ?? defaultPort)
  }
  return receiverInstance
}
