import type { LogWithTags } from '@/database/schema'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export interface FilterState {
  excludedSeverity: number[] // Blacklist: excluded severity levels
  appname: string[]
  tagIds: number[]
  hostname: string[]
  search: string
}

interface FilterContextType {
  filters: FilterState
  setFilters: (filters: Partial<FilterState>) => void
  clearFilters: () => void
  hasActiveFilters: boolean
  activeFilterCount: number
  applyFiltersToLog: (log: LogWithTags) => boolean
}

const FilterContext = createContext<FilterContextType | undefined>(undefined)

const EMPTY_FILTERS: FilterState = {
  excludedSeverity: [], // Empty = all severities included
  appname: [],
  tagIds: [],
  hostname: [],
  search: '',
}

function parseFiltersFromURL(searchParams: URLSearchParams): FilterState {
  const filters: FilterState = { ...EMPTY_FILTERS }

  const excludedSeverity = searchParams.get('excludedSeverity')
  if (excludedSeverity) {
    filters.excludedSeverity = excludedSeverity
      .split(',')
      .map(v => Number.parseInt(v.trim(), 10))
      .filter(n => !Number.isNaN(n) && n >= 0 && n <= 7)
  }

  const appname = searchParams.get('appname')
  if (appname) {
    filters.appname = appname
      .split(',')
      .map(v => v.trim())
      .filter(s => s.length > 0)
  }

  const tagIds = searchParams.get('tags')
  if (tagIds) {
    filters.tagIds = tagIds
      .split(',')
      .map(v => Number.parseInt(v.trim(), 10))
      .filter(n => !Number.isNaN(n))
  }

  const hostname = searchParams.get('hostname')
  if (hostname) {
    filters.hostname = hostname
      .split(',')
      .map(v => v.trim())
      .filter(s => s.length > 0)
  }

  const search = searchParams.get('search')
  if (search) {
    filters.search = search.trim()
  }

  return filters
}

function serializeFiltersToURL(filters: FilterState): URLSearchParams {
  // Start with existing URL params to preserve non-filter params (e.g., columns)
  const params = new URLSearchParams(window.location.search)

  // Remove all filter params first
  params.delete('excludedSeverity')
  params.delete('appname')
  params.delete('tags')
  params.delete('hostname')
  params.delete('search')

  // Add filter params if they have values
  if (filters.excludedSeverity.length > 0) {
    params.set('excludedSeverity', filters.excludedSeverity.join(','))
  }
  if (filters.appname.length > 0) {
    params.set('appname', filters.appname.join(','))
  }
  if (filters.tagIds.length > 0) {
    params.set('tags', filters.tagIds.join(','))
  }
  if (filters.hostname.length > 0) {
    params.set('hostname', filters.hostname.join(','))
  }
  if (filters.search.length > 0) {
    params.set('search', filters.search)
  }

  return params
}

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFiltersState] = useState<FilterState>(() => {
    const searchParams = new URLSearchParams(window.location.search)
    return parseFiltersFromURL(searchParams)
  })

  const setFilters = useCallback((partialFilters: Partial<FilterState>) => {
    setFiltersState(prev => ({ ...prev, ...partialFilters }))
  }, [])

  const clearFilters = useCallback(() => {
    setFiltersState(EMPTY_FILTERS)
  }, [])

  const hasActiveFilters = useMemo(
    () =>
      filters.excludedSeverity.length > 0 ||
      filters.appname.length > 0 ||
      filters.tagIds.length > 0 ||
      filters.hostname.length > 0 ||
      filters.search.length > 0,
    [filters]
  )

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.excludedSeverity.length > 0) count++
    if (filters.appname.length > 0) count++
    if (filters.tagIds.length > 0) count++
    if (filters.hostname.length > 0) count++
    if (filters.search.length > 0) count++
    return count
  }, [filters])

  const applyFiltersToLog = useCallback(
    (log: LogWithTags): boolean => {
      // Exclude logs with excluded severity levels
      if (
        filters.excludedSeverity.length > 0 &&
        filters.excludedSeverity.includes(log.severity)
      ) {
        return false
      }

      if (
        filters.appname.length > 0 &&
        log.appname &&
        !filters.appname.includes(log.appname)
      ) {
        return false
      }

      if (filters.hostname.length > 0) {
        if (!log.hostname) return false
        if (!filters.hostname.includes(log.hostname)) return false
      }

      if (filters.tagIds.length > 0) {
        const logTagIds = log.tags.map(tag => tag.id)
        const hasMatchingTag = filters.tagIds.some(tagId =>
          logTagIds.includes(tagId)
        )
        if (!hasMatchingTag) return false
      }

      // Full-text search across message, appname, and hostname
      if (filters.search.length > 0) {
        const searchLower = filters.search.toLowerCase()
        const messageMatch = log.message.toLowerCase().includes(searchLower)
        const appnameMatch =
          log.appname?.toLowerCase().includes(searchLower) ?? false
        const hostnameMatch =
          log.hostname?.toLowerCase().includes(searchLower) ?? false

        if (!messageMatch && !appnameMatch && !hostnameMatch) {
          return false
        }
      }

      return true
    },
    [filters]
  )

  useEffect(() => {
    const params = serializeFiltersToURL(filters)
    const queryString = params.toString()
    const newUrl = queryString
      ? `${window.location.pathname}?${queryString}`
      : window.location.pathname

    window.history.pushState({}, '', newUrl)
  }, [filters])

  useEffect(() => {
    const handlePopState = () => {
      const searchParams = new URLSearchParams(window.location.search)
      const newFilters = parseFiltersFromURL(searchParams)
      setFiltersState(newFilters)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const value = useMemo(
    () => ({
      filters,
      setFilters,
      clearFilters,
      hasActiveFilters,
      activeFilterCount,
      applyFiltersToLog,
    }),
    [
      filters,
      setFilters,
      clearFilters,
      hasActiveFilters,
      activeFilterCount,
      applyFiltersToLog,
    ]
  )

  return (
    <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFilters() {
  const context = useContext(FilterContext)
  if (!context) {
    throw new Error('useFilters must be used within FilterProvider')
  }
  return context
}
