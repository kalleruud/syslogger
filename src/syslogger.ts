import { serverConfig } from './backend'
import { getSyslogReceiver } from './backend/managers/syslog.manager'
import { shutdownManager } from './backend/utils/shutdown'

const server = Bun.serve(serverConfig)

shutdownManager(server)
await getSyslogReceiver().start()

console.log(`🚀 Server running at ${server.url}`)
