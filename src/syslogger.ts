import { serverConfig } from './backend'
import logger from './backend/managers/log.manager'
import { syslogSocketConfig } from './backend/managers/syslog.manager'

const server = Bun.serve(serverConfig)
const socket = await Bun.udpSocket(syslogSocketConfig)

logger.info('syslogger', `Server started at ${server.url}`)
logger.info('syslogger', `Started syslog UDP server on port: ${socket.port}`)
