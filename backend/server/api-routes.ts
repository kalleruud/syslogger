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

// API route handlers for Bun.serve
export const apiRoutes = {
  '/api/logs': {
    async GET(req: Request) {
      try {
        const url = new URL(req.url)
        const filters = parseLogFilters(url.searchParams)
        const logs = await getLogs(filters)
        return addCors(Response.json(logs))
      } catch (error) {
        logger.error('api', `Error getting logs: ${error}`)
        return addCors(
          Response.json(
            { error: 'Server error' },
            { status: HTTP_STATUS.SERVER_ERROR }
          )
        )
      }
    },
  },

  '/api/logs/:id': {
    async GET(req: Request) {
      try {
        const id = Number(req.params.id)

        if (Number.isNaN(id)) {
          return addCors(
            Response.json(
              { error: 'Invalid ID' },
              { status: HTTP_STATUS.BAD_REQUEST }
            )
          )
        }

        const log = await getLogById(id)
        if (!log) {
          return addCors(
            Response.json(
              { error: 'Not found' },
              { status: HTTP_STATUS.NOT_FOUND }
            )
          )
        }

        return addCors(Response.json(log))
      } catch (error) {
        logger.error('api', `Error getting log by ID: ${error}`)
        return addCors(
          Response.json(
            { error: 'Server error' },
            { status: HTTP_STATUS.SERVER_ERROR }
          )
        )
      }
    },
  },

  '/api/tags': {
    async GET() {
      try {
        const tags = await getAllTags()
        return addCors(Response.json(tags))
      } catch (error) {
        logger.error('api', `Error getting tags: ${error}`)
        return addCors(
          Response.json(
            { error: 'Server error' },
            { status: HTTP_STATUS.SERVER_ERROR }
          )
        )
      }
    },
  },

  '/api/filters/hostnames': {
    async GET() {
      try {
        const hostnames = await getUniqueHostnames()
        return addCors(Response.json(hostnames))
      } catch (error) {
        logger.error('api', `Error getting hostnames: ${error}`)
        return addCors(
          Response.json(
            { error: 'Server error' },
            { status: HTTP_STATUS.SERVER_ERROR }
          )
        )
      }
    },
  },

  '/api/filters/appnames': {
    async GET() {
      try {
        const appnames = await getUniqueAppnames()
        return addCors(Response.json(appnames))
      } catch (error) {
        logger.error('api', `Error getting appnames: ${error}`)
        return addCors(
          Response.json(
            { error: 'Server error' },
            { status: HTTP_STATUS.SERVER_ERROR }
          )
        )
      }
    },
  },

  '/api/stats': {
    GET() {
      try {
        const stats = getSyslogReceiver().getStats()
        return addCors(Response.json(stats))
      } catch (error) {
        logger.error('api', `Error getting stats: ${error}`)
        return addCors(
          Response.json(
            { error: 'Server error' },
            { status: HTTP_STATUS.SERVER_ERROR }
          )
        )
      }
    },
  },
}
