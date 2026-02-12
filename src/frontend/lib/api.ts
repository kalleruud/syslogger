import type { LogWithTags } from '@/database/schema'

export interface PaginatedLogsResult {
  data: LogWithTags[]
  total: number
  limit: number
  offset: number
}

export interface FetchLogsParams {
  limit?: number
  offset?: number
  severity?: number[]
  hostname?: string
  appname?: string
  search?: string
  tagIds?: number[]
}

/**
 * Build query string from fetch params
 */
function buildQueryString(params: FetchLogsParams): string {
  const searchParams = new URLSearchParams()

  if (params.limit !== undefined) {
    searchParams.set('limit', params.limit.toString())
  }
  if (params.offset !== undefined) {
    searchParams.set('offset', params.offset.toString())
  }
  if (params.severity?.length) {
    searchParams.set('severity', params.severity.join(','))
  }
  if (params.hostname) {
    searchParams.set('hostname', params.hostname)
  }
  if (params.appname) {
    searchParams.set('appname', params.appname)
  }
  if (params.search) {
    searchParams.set('search', params.search)
  }
  if (params.tagIds?.length) {
    searchParams.set('tags', params.tagIds.join(','))
  }

  return searchParams.toString()
}

/**
 * Fetch logs from the API with pagination and optional filters
 */
export async function fetchLogs(
  params: FetchLogsParams = {}
): Promise<PaginatedLogsResult> {
  const queryString = buildQueryString(params)
  const url = `/api/logs${queryString ? `?${queryString}` : ''}`

  try {
    const response = await fetch(url)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage =
        errorData.error ||
        `HTTP error ${response.status}: ${response.statusText}`
      throw new Error(errorMessage)
    }

    const result = await response.json()
    return result as PaginatedLogsResult
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Failed to fetch logs:', message)
    throw new Error(`Failed to fetch logs: ${message}`)
  }
}
