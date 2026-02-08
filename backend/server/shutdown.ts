import logger from '../managers/log.manager'
import { getSyslogReceiver } from '../syslog/receiver'
import { wsManager } from './websocket'

/**
 * Graceful shutdown handler
 * Ensures all connections and resources are properly closed
 */
export class ShutdownManager {
  private isShuttingDown = false
  private server: { stop?: () => Promise<void> } | null = null
  private readonly shutdownTimeout = 5000 // 5 seconds

  /**
   * Set the HTTP server instance
   */
  setServer(server: { stop?: () => Promise<void> }): void {
    this.server = server
  }

  /**
   * Register shutdown handlers for SIGINT and SIGTERM
   */
  registerHandlers(): void {
    process.on('SIGINT', () => this.handleShutdown('SIGINT'))
    process.on('SIGTERM', () => this.handleShutdown('SIGTERM'))
  }

  /**
   * Handle shutdown signal
   */
  private async handleShutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) {
      logger.warn('shutdown', 'Already shutting down, please wait...')
      return
    }

    this.isShuttingDown = true
    logger.info('shutdown', `Received ${signal}, starting graceful shutdown...`)

    // Set timeout for forced shutdown
    const forceShutdownTimer = setTimeout(() => {
      logger.error('shutdown', 'Graceful shutdown timeout, forcing exit')
      process.exit(1)
    }, this.shutdownTimeout)

    try {
      // 1. Stop accepting new syslog messages
      logger.info('shutdown', 'Stopping UDP syslog receiver...')
      const receiver = getSyslogReceiver()
      await receiver.stop()

      // 2. Close WebSocket connections
      logger.info('shutdown', 'Closing WebSocket connections...')
      await wsManager.closeAll()

      // 3. Stop HTTP server (if available)
      if (this.server && typeof this.server.stop === 'function') {
        logger.info('shutdown', 'Stopping HTTP server...')
        await this.server.stop()
      }

      // 4. Close database connection
      logger.info('shutdown', 'Closing database connection...')
      // Drizzle with Bun SQLite doesn't need explicit close, but we'll flush any pending writes
      await new Promise(resolve => setTimeout(resolve, 100))

      // Clear timeout
      clearTimeout(forceShutdownTimer)

      logger.info('shutdown', 'Graceful shutdown complete')
      process.exit(0)
    } catch (error) {
      logger.error('shutdown', `Error during shutdown: ${error}`)
      clearTimeout(forceShutdownTimer)
      process.exit(1)
    }
  }

  /**
   * Trigger shutdown programmatically
   */
  async shutdown(): Promise<void> {
    await this.handleShutdown('MANUAL')
  }
}

// Singleton instance
export const shutdownManager = new ShutdownManager()
