import logger from '@/backend/managers/log.manager'
import { insertLog } from '@/database/queries'
import config from '@/lib/config'
import parseSyslog from '../parsers/parser'
import { broadcastLog } from '../websocket'

/**
 * Strips ANSI escape codes from a string.
 * Removes color codes and other SGR (Select Graphic Rendition) sequences.
 * Example: "\x1b[31mRED\x1b[0m" becomes "RED"
 */
function stripAnsiCodes(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replaceAll(/\x1b\[[0-9;]*m/g, '')
}

export const syslogSocketConfig: Bun.udp.SocketOptions<'buffer'> = {
  port: config.syslog.port,

  socket: {
    data: handleData,
    error: handleError,
  },
}

async function handleData(
  _socket: Bun.udp.Socket<'buffer'>,
  data: Buffer<ArrayBufferLike>
) {
  const rawMessage = data.toString('utf-8').trimEnd()
  const message = stripAnsiCodes(rawMessage)
  console.debug(message)
  const parsed = parseSyslog(message)

  const log = await insertLog(parsed.log)

  broadcastLog(log)
}

async function handleError(_socket: Bun.udp.Socket<'buffer'>, error: Error) {
  logger.error('syslog', `UDP error: ${error.message}`)
}
