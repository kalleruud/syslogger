import { serverConfig } from './backend'
import logger from './backend/managers/log.manager'
import { syslogSocketConfig } from './backend/managers/syslog.manager'

export const server = Bun.serve(serverConfig)
logger.info('syslogger', `Server started at ${server.url}`)

const socket = await Bun.udpSocket(syslogSocketConfig)
logger.info('syslogger', `Started syslog UDP server on port: ${socket.port}`)
