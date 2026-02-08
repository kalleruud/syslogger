const isDev = process.env['NODE_ENV'] !== 'production'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export const handlePreflight = () =>
  isDev
    ? new Response(null, { status: 204, headers: corsHeaders })
    : new Response('Not Allowed', { status: 405 })

export const addCors = (res: Response) => {
  if (!isDev) return res
  const headers = new Headers(res.headers)
  for (const [k, v] of Object.entries(corsHeaders)) headers.set(k, v)
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  })
}
