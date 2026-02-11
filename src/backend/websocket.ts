import type {
  ClientToServerEvents,
  ErrorResponse,
  EventReq,
  EventRes,
  SuccessResponse,
  TypedSocket,
} from '@/lib/socket.io'
import logger from './managers/log.manager'

export default async function Connect(s: TypedSocket) {
  logger.debug('websocket', `Connected: ${s.id}`)

  s.on('disconnect', () => logger.debug('websocket', `Disconnected: ${s.id}`))

  setup(s, 'health', health)
}

async function health(): Promise<SuccessResponse | ErrorResponse> {
  return { success: true }
}

function setup<Ev extends keyof ClientToServerEvents>(
  s: TypedSocket,
  event: Ev,
  handler: (s: TypedSocket, r: EventReq<Ev>) => Promise<EventRes<Ev>>
) {
  s.on(event, ((r: EventReq<Ev>, callback?: any) =>
    handler(s, r)
      .then(callback)
      .catch(e => {
        console.warn(e.message)
        callback({ success: false, message: e.message } satisfies ErrorResponse)
      })) as any)
}
