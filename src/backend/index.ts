import { close, open, type BunSocketData } from '@/backend/websocket'
import config from '@/lib/config'
import index from '@public/index.html'

class BunResponse extends Response {
  override headers: Headers = new Headers({
    ...super.headers,
    // 'Access-Control-Allow-Origin': config.cors.origin,
  })
}

export const serverConfig: Bun.Serve.Options<BunSocketData> = {
  port: config.port,

  routes: {
    // Serve React
    '/': index,

    '/ws': {
      async GET(req, server) {
        // Upgrade HTTP request to WebSocket connection
        const success = server.upgrade(req, { data: { id: 'test' } })

        // Return a fallback response if upgrade fails
        if (!success) {
          return new Response('WebSocket upgrade failed', { status: 400 })
        }

        // The connection is handled by the websocket handlers
        return undefined
      },
    },
  },

  websocket: {
    data: {} as BunSocketData,
    message(ws) {
      console.debug(
        'Recieved message from client:',
        JSON.stringify(ws, undefined, 2)
      )
    },
    open: open,
    close: close,
  },

  development: config.development && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },

  error(error) {
    console.error('Server error:', error)

    if (!config.development) {
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }

    return Response.json(
      {
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    )
  },
}
