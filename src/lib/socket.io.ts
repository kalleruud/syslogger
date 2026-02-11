import type { LogWithTags } from '@/database/schema'
import type { Socket } from 'socket.io'

export type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>

export type SuccessResponse = {
  success: true
}

export type ErrorResponse = {
  success: false
  message: string
}

export interface ServerToClientEvents {
  new_log: (r: LogWithTags) => void
}

export interface ClientToServerEvents {
  connect: () => void
  disconnect: () => void
  connect_error: (err: Error) => void
  health: (
    r: undefined,
    callback: (r: SuccessResponse | ErrorResponse) => void
  ) => void
}

export interface InterServerEvents {
  ping: () => void
}

export interface SocketData {
  token: string
  userId: string
}

// ---------- helpers & types ----------
type RequestOf<F> =
  // no args
  F extends () => void
    ? undefined
    : // callback-only (first param is callback) => no request
      F extends (cb: any) => void
      ? undefined
      : // req + callback
        F extends (req: infer R, cb: any) => void
        ? R
        : // single-arg non-callback
          F extends (arg: infer A) => void
          ? A
          : never

type CallbackOf<F> =
  // callback-only
  F extends (cb: infer C) => void
    ? C
    : // req + callback
      F extends (req: any, cb: infer C) => void
      ? C
      : undefined

type ResponseOf<F> = CallbackOf<F> extends (res: infer R) => void ? R : void

type HasCallback<F> = CallbackOf<F> extends undefined ? false : true

// --- helpers that accept an event key (Ev) ---
export type EventReq<Ev extends keyof ClientToServerEvents> = RequestOf<
  ClientToServerEvents[Ev]
>

export type EventCb<Ev extends keyof ClientToServerEvents> = CallbackOf<
  ClientToServerEvents[Ev]
>

export type EventRes<Ev extends keyof ClientToServerEvents> = ResponseOf<
  ClientToServerEvents[Ev]
>

export type EventHasCallback<Ev extends keyof ClientToServerEvents> =
  HasCallback<ClientToServerEvents[Ev]>
