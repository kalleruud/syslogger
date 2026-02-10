import logger from '@/backend/managers/log.manager'
// import { getSyslogReceiver } from '@/backend/managers/syslog.manager'
// import { wsManager } from '../websocket'

class ShutdownManager {
  private shuttingDown = false
  private readonly server: ReturnType<typeof Bun.serve>

  constructor(server: ReturnType<typeof Bun.serve>) {
    this.registerHandlers()
    this.server = server
  }

  private registerHandlers() {
    const shutdown = (signal: string) => this.handleShutdown(signal)
    process.on('SIGINT', () => shutdown('SIGINT'))
    process.on('SIGTERM', () => shutdown('SIGTERM'))
  }

  private async handleShutdown(signal: string) {
    if (this.shuttingDown) return
    this.shuttingDown = true
    logger.info('shutdown', `Received ${signal}, shutting down...`)

    const timeout = setTimeout(() => process.exit(1), 5000)

    try {
      // await getSyslogReceiver().stop()
      // await wsManager.closeAll()
      if (this.server?.stop) await this.server.stop()
      // await new Promise(resolve => setTimeout(resolve, 100))
      clearTimeout(timeout)
      logger.info('shutdown', 'Graceful shutdown complete')
      process.exit(0)
    } catch (error) {
      logger.error('shutdown', `Error: ${error}`)
      clearTimeout(timeout)
      process.exit(1)
    }
  }
}

const shutdownManagerInstance = null as ShutdownManager | null

export const shutdownManager = (server: ReturnType<typeof Bun.serve>) => {
  if (shutdownManagerInstance) return shutdownManagerInstance
  return new ShutdownManager(server)
}
