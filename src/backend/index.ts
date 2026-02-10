import config from '@/lib/config'
import index from '@public/index.html'
import { serve } from 'bun'

class BunResponse extends Response {
  override headers: Headers = new Headers({
    ...super.headers,
    'Access-Control-Allow-Origin': config.cors.origin,
  })
}

const server = serve({
  port: config.port,

  routes: {
    // Serve index.html for all unmatched routes.
    '/*': index,

    '/api/hello': {
      async GET() {
        return BunResponse.json({
          message: 'Hello, world!',
          method: 'GET',
        })
      },
      async PUT() {
        return BunResponse.json({
          message: 'Hello, world!',
          method: 'PUT',
        })
      },
    },

    '/api/hello/:name': async req => {
      const name = req.params.name
      return BunResponse.json({
        message: `Hello, ${name}!`,
      })
    },
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
})

console.log(`🚀 Server running at ${server.url}`)
