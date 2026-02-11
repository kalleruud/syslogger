import logger from '@/backend/managers/log.manager'
import { insertLogWithTags } from '@/database/queries'
import config from '@/lib/config'
import parseSyslog from '../parsers/parser'
import { broadcastLog } from '../websocket'

export const syslogSocketConfig = {
  port: config.syslog.port,

  socket: {
    data: handleData,
    error: handleError,
  },
} satisfies Bun.udp.SocketOptions<'buffer'>

async function handleData(
  _socket: Bun.udp.Socket<'buffer'>,
  data: Buffer<ArrayBufferLike>,
  _port: number,
  _address: string
) {
  const message = data.toString('utf-8').trimEnd()
  console.debug(message)
  const parsed = parseSyslog(message)

  const log = await insertLogWithTags(
    parsed.log,
    parsed.tags.map(t => t.name)
  )

  broadcastLog(log)
}

async function handleError(_socket: Bun.udp.Socket<'buffer'>, error: Error) {
  logger.error('syslog', `UDP error: ${error.message}`)
}
