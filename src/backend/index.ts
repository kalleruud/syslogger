import { wsConfig, wsEndpoint, type BunSocketData } from '@/backend/websocket'
import config from '@/lib/config'
import index from '@public/index.html'

export const serverConfig: Bun.Serve.Options<BunSocketData> = {
  port: config.port,

  routes: {
    // Serve websockets
    ...wsEndpoint,

    // Serve React
    '/': index,
  },

  websocket: wsConfig,

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
