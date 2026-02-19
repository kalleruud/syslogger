import {
  getLogs,
  getUniqueAppnames,
  getUniqueHostnames,
  type LogFilters,
} from '@/database/queries'
import logger from '../managers/log.manager'
import { error, json } from '../utils/api'

/**
 * Parse query parameter as number with fallback to default value
 */
function parseNumberParam(value: string | null, defaultValue: number): number {
  if (value === null) return defaultValue
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? defaultValue : parsed
}

/**
 * Parse comma-separated query parameter as array of numbers
 */
function parseNumberArrayParam(value: string | null): number[] | undefined {
  if (!value) return undefined
  return value
    .split(',')
    .map(v => Number.parseInt(v.trim(), 10))
    .filter(n => !Number.isNaN(n))
}

/**
 * Parse comma-separated query parameter as array of strings
 */
function parseStringArrayParam(value: string | null): string[] | undefined {
  if (!value) return undefined
  return value
    .split(',')
    .map(v => v.trim())
    .filter(s => s.length > 0)
}

/**
 * Extract log filters from URL search params
 */
function extractFiltersFromRequest(url: URL): LogFilters {
  const params = url.searchParams

  const filters: LogFilters = {
    limit: parseNumberParam(params.get('limit'), 100),
    offset: parseNumberParam(params.get('offset'), 0),
  }

  const severity = parseNumberArrayParam(params.get('severity'))
  if (severity?.length) filters.severity = severity

  const hostname = parseStringArrayParam(params.get('hostname'))
  if (hostname?.length) filters.hostname = hostname

  const appname = parseStringArrayParam(params.get('appname'))
  if (appname?.length) filters.appname = appname

  const search = params.get('search')
  if (search) filters.search = search

  const beforeTimestamp = params.get('beforeTimestamp')
  if (beforeTimestamp) filters.beforeTimestamp = beforeTimestamp

  return filters
}

/**
 * Handler for GET /api/logs
 * Fetches logs with optional filtering and pagination
 */
export async function handleGetLogs(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url)
    const filters = extractFiltersFromRequest(url)

    logger.debug(
      'api',
      `Fetching logs with filters: ${JSON.stringify(filters)}`
    )

    const result = await getLogs(filters)

    logger.debug(
      'api',
      `Returned ${result.data.length} logs (total: ${result.total}, offset: ${result.offset})`
    )

    return json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    logger.error('api', `Failed to fetch logs: ${message}`)
    return error('Failed to fetch logs', 500)
  }
}

/**
 * Handler for GET /api/filters/appnames
 * Fetches unique application names for filtering
 */
export async function handleGetAppnames(): Promise<Response> {
  try {
    logger.debug('api', 'Fetching unique appnames')
    const appnames = await getUniqueAppnames()
    logger.debug('api', `Returned ${appnames.length} unique appnames`)
    return json(appnames)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    logger.error('api', `Failed to fetch appnames: ${message}`)
    return error('Failed to fetch appnames', 500)
  }
}

/**
 * Handler for GET /api/filters/hostnames
 * Fetches unique hostnames for filtering
 */
export async function handleGetHostnames(): Promise<Response> {
  try {
    logger.debug('api', 'Fetching unique hostnames')
    const hostnames = await getUniqueHostnames()
    logger.debug('api', `Returned ${hostnames.length} unique hostnames`)
    return json(hostnames)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    logger.error('api', `Failed to fetch hostnames: ${message}`)
    return error('Failed to fetch hostnames', 500)
  }
}
