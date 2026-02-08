/**
 * CORS middleware for development
 * Only enabled when NODE_ENV !== 'production'
 */

const isDevelopment = process.env['NODE_ENV'] !== 'production'

/**
 * Get CORS headers for response
 */
export function getCorsHeaders(): Record<string, string> {
  if (!isDevelopment) {
    return {}
  }

  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400', // 24 hours
  }
}

/**
 * Handle CORS preflight requests
 */
export function handleCorsPreflightRequest(): Response {
  if (!isDevelopment) {
    return new Response('Method Not Allowed', { status: 405 })
  }

  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(),
  })
}

/**
 * Add CORS headers to a response
 */
export function addCorsHeaders(response: Response): Response {
  if (!isDevelopment) {
    return response
  }

  const headers = new Headers(response.headers)
  const corsHeaders = getCorsHeaders()

  for (const [key, value] of Object.entries(corsHeaders)) {
    headers.set(key, String(value))
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
