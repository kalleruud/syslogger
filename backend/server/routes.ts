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
import { addCors } from './cors'

const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
} as const

const JSON_CONTENT_TYPE = 'application/json'

const createJsonResponse = (
  data: unknown,
  status: number = HTTP_STATUS.OK
): Response => {
  return addCors(
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': JSON_CONTENT_TYPE },
    })
  )
}

const parseCommaSeparatedNumbers = (
  value: string | null
): number[] | undefined => {
  return value?.split(',').map(Number)
}

const parseOptionalNumber = (value: string | null): number | undefined => {
  return value ? Number(value) : undefined
}

const parseLogFilters = (params: URLSearchParams): LogFilters => ({
  severity: parseCommaSeparatedNumbers(params.get('severity')),
  hostname: params.get('hostname') ?? undefined,
  appname: params.get('appname') ?? undefined,
  search: params.get('search') ?? undefined,
  tagIds: parseCommaSeparatedNumbers(params.get('tagIds')),
  limit: parseOptionalNumber(params.get('limit')),
  offset: parseOptionalNumber(params.get('offset')),
})

const extractLogIdFromPath = (path: string): number => {
  return Number(path.replace('/api/logs/', ''))
}

const isValidId = (id: number): boolean => {
  return !Number.isNaN(id)
}

const handleGetLogs = async (
  searchParams: URLSearchParams
): Promise<Response> => {
  const filters = parseLogFilters(searchParams)
  const logs = await getLogs(filters)
  return createJsonResponse(logs)
}

const handleGetLogById = async (path: string): Promise<Response> => {
  const id = extractLogIdFromPath(path)

  if (!isValidId(id)) {
    return createJsonResponse({ error: 'Invalid ID' }, HTTP_STATUS.BAD_REQUEST)
  }

  const log = await getLogById(id)
  return log
    ? createJsonResponse(log)
    : createJsonResponse({ error: 'Not found' }, HTTP_STATUS.NOT_FOUND)
}

const handleGetTags = async (): Promise<Response> => {
  const tags = await getAllTags()
  return createJsonResponse(tags)
}

const handleGetUniqueHostnames = async (): Promise<Response> => {
  const hostnames = await getUniqueHostnames()
  return createJsonResponse(hostnames)
}

const handleGetUniqueAppnames = async (): Promise<Response> => {
  const appnames = await getUniqueAppnames()
  return createJsonResponse(appnames)
}

const handleGetStats = (): Response => {
  const stats = getSyslogReceiver().getStats()
  return createJsonResponse(stats)
}

const routeNotFound = (): Response => {
  return createJsonResponse({ error: 'Not found' }, HTTP_STATUS.NOT_FOUND)
}

const handleError = (path: string, error: unknown): Response => {
  logger.error('api', `Error for ${path}: ${error}`)
  return createJsonResponse({ error: 'Server error' }, HTTP_STATUS.SERVER_ERROR)
}

export const handleApiRoute = async (
  path: string,
  url: URL
): Promise<Response> => {
  try {
    if (path === '/api/logs') {
      return handleGetLogs(url.searchParams)
    }

    if (path.startsWith('/api/logs/')) {
      return handleGetLogById(path)
    }

    if (path === '/api/tags') {
      return handleGetTags()
    }

    if (path === '/api/filters/hostnames') {
      return handleGetUniqueHostnames()
    }

    if (path === '/api/filters/appnames') {
      return handleGetUniqueAppnames()
    }

    if (path === '/api/stats') {
      return handleGetStats()
    }

    return routeNotFound()
  } catch (error) {
    return handleError(path, error)
  }
}
