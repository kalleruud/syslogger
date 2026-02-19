import type { Log } from '@/database/schema'

export interface PaginatedLogsResult {
  data: Log[]
  total: number
  limit: number
  offset: number
}

export interface FetchLogsParams {
  limit?: number
  offset?: number
  severity?: number[]
  hostname?: string[]
  appname?: string[]
  search?: string
  beforeTimestamp?: string
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
  if (params.hostname?.length) {
    searchParams.set('hostname', params.hostname.join(','))
  }
  if (params.appname?.length) {
    searchParams.set('appname', params.appname.join(','))
  }
  if (params.search) {
    searchParams.set('search', params.search)
  }
  if (params.beforeTimestamp) {
    searchParams.set('beforeTimestamp', params.beforeTimestamp)
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

/**
 * Fetch unique application names for filtering
 */
export async function fetchUniqueAppnames(): Promise<string[]> {
  try {
    const response = await fetch('/api/filters/appnames')

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage =
        errorData.error ||
        `HTTP error ${response.status}: ${response.statusText}`
      throw new Error(errorMessage)
    }

    const result = await response.json()
    return result as string[]
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Failed to fetch appnames:', message)
    throw new Error(`Failed to fetch appnames: ${message}`)
  }
}

/**
 * Fetch unique hostnames for filtering
 */
export async function fetchUniqueHostnames(): Promise<string[]> {
  try {
    const response = await fetch('/api/filters/hostnames')

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage =
        errorData.error ||
        `HTTP error ${response.status}: ${response.statusText}`
      throw new Error(errorMessage)
    }

    const result = await response.json()
    return result as string[]
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Failed to fetch hostnames:', message)
    throw new Error(`Failed to fetch hostnames: ${message}`)
  }
}
