import { getLogs, type LogFilters } from '@/database/queries'
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

  const hostname = params.get('hostname')
  if (hostname) filters.hostname = hostname

  const appname = params.get('appname')
  if (appname) filters.appname = appname

  const search = params.get('search')
  if (search) filters.search = search

  const tagIds = parseNumberArrayParam(params.get('tags'))
  if (tagIds?.length) filters.tagIds = tagIds

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
