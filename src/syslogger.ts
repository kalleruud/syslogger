import { Server as Engine } from '@socket.io/bun-engine'
import { Server } from 'socket.io'
import { serverConfig } from './backend'
import logger from './backend/managers/log.manager'
import { syslogSocketConfig } from './backend/managers/syslog.manager'
import Connect from './backend/websocket'
import config from './lib/config'
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from './lib/socket.io'

const server = Bun.serve(serverConfig)
const socket = await Bun.udpSocket(syslogSocketConfig)

const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>({
  cors: {
    origin: [config.cors.origin],
    credentials: true,
  },
})

const engine = new Engine({
  path: '/socket.io/',
})

io.bind(engine)
io.on('connect', s => Connect(s))

export const broadcast: typeof io.emit = (ev, ...args) => {
  return io.emit(ev, ...args)
}

logger.info('syslogger', `Server started at ${server.url}`)
logger.info('syslogger', `Started syslog UDP server on port: ${socket.port}`)
