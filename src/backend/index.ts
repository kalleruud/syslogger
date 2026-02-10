import { getLogs } from '@/database/queries'
import config from '@/lib/config'
import { serve } from 'bun'
import { createWebSocketHandler } from './websocket'

const indexHtml = await Bun.file('src/frontend/public/index.html').text()

class BunResponse extends Response {
  override headers: Headers = new Headers({
    ...super.headers,
    'Access-Control-Allow-Origin': config.cors.origin,
  })
}

export const serverConfig: Parameters<typeof serve>[0] = {
  port: config.port,

  fetch(req, server) {
    const url = new URL(req.url)

    // Handle WebSocket upgrade
    if (
      server.upgrade(req, {
        data: {
          id: '',
          connectedAt: new Date(),
        },
      })
    ) {
      return // WebSocket upgrade successful
    }

    // API Routes
    if (url.pathname === '/api/logs' && req.method === 'GET') {
      const params = url.searchParams
      const filters = {
        limit: params.has('limit') ? parseInt(params.get('limit')!) : undefined,
        offset: params.has('offset')
          ? parseInt(params.get('offset')!)
          : undefined,
        severity: params.has('severity')
          ? params.get('severity')!.split(',').map(Number)
          : undefined,
        hostname: params.get('hostname') ?? undefined,
        appname: params.get('appname') ?? undefined,
        search: params.get('search') ?? undefined,
        tagIds: params.has('tags')
          ? params.get('tags')!.split(',').map(Number)
          : undefined,
      }

      return getLogs(filters).then(result => BunResponse.json(result))
    }

    // Serve index.html for all other routes (SPA)
    return new Response(indexHtml, {
      headers: {
        'Content-Type': 'text/html',
        'Access-Control-Allow-Origin': config.cors.origin,
      },
    })
  },

  websocket: createWebSocketHandler(),

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
