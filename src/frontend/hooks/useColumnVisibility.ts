import { useCallback, useEffect, useMemo, useState } from 'react'

export type ColumnKey =
  | 'timestamp'
  | 'appname'
  | 'facility'
  | 'severity'
  | 'hostname'
  | 'procid'
  | 'msgid'
  | 'tags'
  | 'message'

export type ColumnDefinition = {
  key: ColumnKey
  label: string
  alwaysVisible: boolean
}

export const COLUMNS: ColumnDefinition[] = [
  { key: 'timestamp', label: 'Timestamp', alwaysVisible: false },
  { key: 'appname', label: 'App Name', alwaysVisible: false },
  { key: 'facility', label: 'Facility', alwaysVisible: false },
  { key: 'severity', label: 'Severity', alwaysVisible: false },
  { key: 'hostname', label: 'Hostname', alwaysVisible: false },
  { key: 'procid', label: 'Process ID', alwaysVisible: false },
  { key: 'msgid', label: 'Message ID', alwaysVisible: false },
  { key: 'tags', label: 'Tags', alwaysVisible: false },
  { key: 'message', label: 'Message', alwaysVisible: true },
]

export function useColumnVisibility() {
  const [searchKey, setSearchKey] = useState(0)

  useEffect(() => {
    const handlePopState = () => setSearchKey(prev => prev + 1)
    globalThis.addEventListener('popstate', handlePopState)
    return () => globalThis.removeEventListener('popstate', handlePopState)
  }, [])

  const searchParams = useMemo(() => {
    if (typeof globalThis === 'undefined') return new URLSearchParams()
    return new URLSearchParams(globalThis.location.search)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKey])

  const visibleColumns = useMemo<Set<ColumnKey>>(() => {
    const columnsParam = searchParams.get('columns')

    if (!columnsParam) {
      // Default: only message visible
      return new Set<ColumnKey>(['message'])
    }

    const columns = columnsParam.split(',').filter(Boolean) as ColumnKey[]
    const columnSet = new Set<ColumnKey>(columns)

    // Always ensure message is visible
    columnSet.add('message')

    return columnSet
  }, [searchParams])

  const toggleColumn = useCallback(
    (column: ColumnKey) => {
      // Cannot toggle message column
      if (column === 'message') return

      const newVisible = new Set(visibleColumns)

      if (newVisible.has(column)) {
        newVisible.delete(column)
      } else {
        newVisible.add(column)
      }

      // Update URL - preserve existing filter params
      const newParams = new URLSearchParams(globalThis.location.search)
      const columnsArray = Array.from(newVisible)

      // Only include non-message columns in the URL (message is always visible)
      const columnsToStore = columnsArray.filter(c => c !== 'message')

      if (columnsToStore.length === 0) {
        newParams.delete('columns')
      } else {
        newParams.set('columns', columnsToStore.join(','))
      }

      const queryString = newParams.toString()
      const newUrl = `${globalThis.location.pathname}${queryString ? '?' + queryString : ''}`
      globalThis.history.pushState({}, '', newUrl)

      // Trigger a custom event so other components can react
      globalThis.dispatchEvent(new Event('popstate'))
    },
    [visibleColumns]
  )

  const isColumnVisible = useCallback(
    (column: ColumnKey) => visibleColumns.has(column),
    [visibleColumns]
  )

  return {
    visibleColumns,
    toggleColumn,
    isColumnVisible,
  }
}
