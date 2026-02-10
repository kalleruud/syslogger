import { serverConfig } from './backend'
import { shutdownManager } from './backend/utils/shutdown'

const server = Bun.serve(serverConfig)
shutdownManager(server)

console.log(`🚀 Server running at ${server.url}`)
