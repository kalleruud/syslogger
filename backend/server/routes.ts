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

const json = (data: unknown, status = 200) =>
  addCors(
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  )

const parseFilters = (params: URLSearchParams): LogFilters => ({
  severity: params.get('severity')?.split(',').map(Number),
  hostname: params.get('hostname') ?? undefined,
  appname: params.get('appname') ?? undefined,
  search: params.get('search') ?? undefined,
  tagIds: params.get('tagIds')?.split(',').map(Number),
  limit: params.get('limit') ? Number(params.get('limit')) : undefined,
  offset: params.get('offset') ? Number(params.get('offset')) : undefined,
})

export const handleApiRoute = async (
  path: string,
  url: URL
): Promise<Response> => {
  try {
    if (path === '/api/logs')
      return json(await getLogs(parseFilters(url.searchParams)))
    if (path.startsWith('/api/logs/')) {
      const id = Number(path.replace('/api/logs/', ''))
      if (Number.isNaN(id)) return json({ error: 'Invalid ID' }, 400)
      const log = await getLogById(id)
      return log ? json(log) : json({ error: 'Not found' }, 404)
    }
    if (path === '/api/tags') return json(await getAllTags())
    if (path === '/api/filters/hostnames')
      return json(await getUniqueHostnames())
    if (path === '/api/filters/appnames') return json(await getUniqueAppnames())
    if (path === '/api/stats') return json(getSyslogReceiver().getStats())
    return json({ error: 'Not found' }, 404)
  } catch (error) {
    logger.error('api', `Error for ${path}: ${error}`)
    return json({ error: 'Server error' }, 500)
  }
}
