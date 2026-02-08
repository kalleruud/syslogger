import {
  getAllTags,
  getLogById,
  getLogs,
  getUniqueAppnames,
  getUniqueHostnames,
  type LogFilters,
} from '@database/queries'
import logger from '../managers/log.manager'
import { getSyslogReceiver } from '../syslog/receiver'
import { addCorsHeaders } from './cors'

/**
 * Handle API routes
 */
export async function handleApiRoute(
  pathname: string,
  url: URL
): Promise<Response> {
  try {
    // GET /api/logs - Get logs with filters
    if (pathname === '/api/logs' && url.searchParams) {
      const filters: LogFilters = {}

      // Parse severity filter (comma-separated)
      const severityParam = url.searchParams.get('severity')
      if (severityParam) {
        filters.severity = severityParam
          .split(',')
          .map(s => Number.parseInt(s, 10))
      }

      // Parse other filters
      if (url.searchParams.get('hostname')) {
        filters.hostname = url.searchParams.get('hostname')!
      }
      if (url.searchParams.get('appname')) {
        filters.appname = url.searchParams.get('appname')!
      }
      if (url.searchParams.get('search')) {
        filters.search = url.searchParams.get('search')!
      }

      // Parse tag IDs filter (comma-separated)
      const tagIdsParam = url.searchParams.get('tagIds')
      if (tagIdsParam) {
        filters.tagIds = tagIdsParam
          .split(',')
          .map(id => Number.parseInt(id, 10))
      }

      // Parse pagination
      const limitParam = url.searchParams.get('limit')
      const offsetParam = url.searchParams.get('offset')
      if (limitParam) {
        filters.limit = Number.parseInt(limitParam, 10)
      }
      if (offsetParam) {
        filters.offset = Number.parseInt(offsetParam, 10)
      }

      const result = await getLogs(filters)
      return jsonResponse(result)
    }

    // GET /api/logs/:id - Get single log by ID
    if (pathname.startsWith('/api/logs/')) {
      const id = Number.parseInt(pathname.replace('/api/logs/', ''), 10)
      if (Number.isNaN(id)) {
        return jsonResponse({ error: 'Invalid log ID' }, 400)
      }

      const log = await getLogById(id)
      if (!log) {
        return jsonResponse({ error: 'Log not found' }, 404)
      }

      return jsonResponse(log)
    }

    // GET /api/tags - Get all tags
    if (pathname === '/api/tags') {
      const tags = await getAllTags()
      return jsonResponse(tags)
    }

    // GET /api/filters/hostnames - Get unique hostnames
    if (pathname === '/api/filters/hostnames') {
      const hostnames = await getUniqueHostnames()
      return jsonResponse(hostnames)
    }

    // GET /api/filters/appnames - Get unique app names
    if (pathname === '/api/filters/appnames') {
      const appnames = await getUniqueAppnames()
      return jsonResponse(appnames)
    }

    // GET /api/stats - Get server statistics
    if (pathname === '/api/stats') {
      const receiver = getSyslogReceiver()
      const stats = receiver.getStats()
      return jsonResponse(stats)
    }

    // 404 for unknown API routes
    return jsonResponse({ error: 'Not found' }, 404)
  } catch (error) {
    logger.error('http-server', `API error for ${pathname}: ${error}`)
    return jsonResponse({ error: 'Internal server error' }, 500)
  }
}

/**
 * Create JSON response with CORS headers
 */
function jsonResponse(data: unknown, status: number = 200): Response {
  const response = new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
  return addCorsHeaders(response)
}
