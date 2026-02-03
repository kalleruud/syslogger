import { useState, useEffect, useCallback, useRef } from "react";
import { VisibilityState } from "@tanstack/react-table";
import { SyslogMessage } from "./types";
import { LogTable } from "./components/LogTable";
import { LogSidebar } from "./components/LogSidebar";
import { useWebSocket } from "./hooks/useWebSocket";
import { useSearchParams } from "./hooks/useSearchParams";
import { MultiSelect } from "./components/ui/multi-select";
import { columns, SEVERITY_NAMES } from "./components/columns";
import { Input } from "./components/ui/input";
import { Terminal, AlertCircle, Search, Columns } from "lucide-react";

const LOGS_PER_PAGE = 100;

const SEVERITY_OPTIONS = Array.from({ length: 8 }, (_, i) => ({
  value: String(i),
  label: SEVERITY_NAMES[i] || `Level ${i}`,
}));

const DEFAULT_VISIBLE_COLUMNS: VisibilityState = {
  timestamp: true,
  severity: true,
  hostname: true,
  appname: true,
  message: true,
  facility: false,
  procid: false,
  msgid: false,
};

function App() {
  const [logs, setLogs] = useState<SyslogMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [selectedLog, setSelectedLog] = useState<SyslogMessage | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [appnameOptions, setAppnameOptions] = useState<string[]>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(DEFAULT_VISIBLE_COLUMNS);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const columnPickerRef = useRef<HTMLDivElement>(null);
  const fetchIdRef = useRef(0);

  const { search, severities, appnames, setSearch, setSeverities, setAppnames } = useSearchParams();

  // Build query string from current filters
  const buildQueryString = useCallback((extraParams?: Record<string, string>) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (severities.length > 0) params.set("severity", severities.join(","));
    if (appnames.length > 0) params.set("appname", appnames.join(","));
    if (extraParams) {
      for (const [k, v] of Object.entries(extraParams)) {
        params.set(k, v);
      }
    }
    return params.toString();
  }, [search, severities, appnames]);

  // Fetch log count
  const fetchCount = useCallback(async () => {
    try {
      const qs = buildQueryString();
      const response = await fetch(`/api/logs/count${qs ? `?${qs}` : ""}`);
      if (response.ok) {
        const data = await response.json();
        setTotalCount(data.count);
      }
    } catch {
      // silently fail
    }
  }, [buildQueryString]);

  // Fetch logs (initial)
  const fetchLogs = useCallback(async () => {
    const id = ++fetchIdRef.current;
    try {
      setIsLoading(true);
      setHasMore(true);
      const qs = buildQueryString({ limit: String(LOGS_PER_PAGE) });
      const response = await fetch(`/api/logs?${qs}`);
      if (!response.ok) throw new Error("Failed to fetch logs");
      const data: SyslogMessage[] = await response.json();

      if (id !== fetchIdRef.current) return; // stale

      // API returns DESC, reverse for display (oldest at top, newest at bottom)
      data.reverse();
      setLogs(data);
      setHasMore(data.length >= LOGS_PER_PAGE);
      setError(null);
    } catch (err) {
      if (id !== fetchIdRef.current) return;
      setError(err instanceof Error ? err.message : "Failed to fetch logs");
    } finally {
      if (id === fetchIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [buildQueryString]);

  // Fetch appname options
  useEffect(() => {
    async function loadAppnames() {
      try {
        const response = await fetch("/api/appnames");
        if (response.ok) {
          const data: string[] = await response.json();
          setAppnameOptions(data);
        }
      } catch {
        // silently fail
      }
    }
    loadAppnames();
  }, []);

  // Re-fetch when filters change
  useEffect(() => {
    fetchLogs();
    fetchCount();
  }, [fetchLogs, fetchCount]);

  // Load more (older logs, prepend)
  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const qs = buildQueryString({
        limit: String(LOGS_PER_PAGE),
        offset: String(logs.length),
      });
      const response = await fetch(`/api/logs?${qs}`);
      if (!response.ok) throw new Error("Failed to fetch more logs");
      const data: SyslogMessage[] = await response.json();
      data.reverse();
      if (data.length < LOGS_PER_PAGE) {
        setHasMore(false);
      }
      if (data.length > 0) {
        setLogs((prev) => [...data, ...prev]);
      }
    } catch {
      // silently handle
    } finally {
      setLoadingMore(false);
    }
  }, [buildQueryString, logs.length, loadingMore, hasMore]);

  // WebSocket: append new logs at end
  const handleNewLog = useCallback((log: SyslogMessage) => {
    // Check if log matches current filters
    if (severities.length > 0 && !severities.includes(log.severity)) return;
    if (appnames.length > 0 && !appnames.includes(log.appname)) return;
    if (search && !log.message.toLowerCase().includes(search.toLowerCase()) &&
        !log.appname.toLowerCase().includes(search.toLowerCase()) &&
        !log.hostname.toLowerCase().includes(search.toLowerCase())) return;

    setLogs((prev) => [...prev, log]);
    setTotalCount((prev) => prev + 1);
  }, [severities, appnames, search]);

  const { isConnected } = useWebSocket(handleNewLog);

  // Search with debounce
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const [searchInput, setSearchInput] = useState(search);

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setSearch(value);
    }, 300);
  }, [setSearch]);

  // Close column picker on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (columnPickerRef.current && !columnPickerRef.current.contains(e.target as Node)) {
        setShowColumnPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleColumn = useCallback((columnId: string) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [columnId]: !prev[columnId],
    }));
  }, []);

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center gap-3 px-4 py-2 border-b border-border flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-2">
          <Terminal className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">syslogger</span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-48 pl-8 h-8 text-xs"
          />
        </div>

        {/* Severity multi-select */}
        <MultiSelect
          options={SEVERITY_OPTIONS}
          selected={severities.map(String)}
          onChange={(vals) => setSeverities(vals.map(Number))}
          placeholder="Severity"
          className="w-36"
        />

        {/* Appname multi-select */}
        <MultiSelect
          options={appnameOptions.map(a => ({ value: a, label: a }))}
          selected={appnames}
          onChange={setAppnames}
          placeholder="App"
          className="w-36"
        />

        {/* Column selector */}
        <div ref={columnPickerRef} className="relative">
          <button
            onClick={() => setShowColumnPicker(!showColumnPicker)}
            className="flex items-center gap-1 h-8 px-2 rounded-md border border-input bg-background text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <Columns className="h-3 w-3" />
            Columns
          </button>
          {showColumnPicker && (
            <div className="absolute top-full right-0 z-50 mt-1 min-w-[160px] rounded-md border border-border bg-popover shadow-lg py-1">
              {columns.map((col) => {
                const id = col.id!;
                const visible = columnVisibility[id] !== false;
                return (
                  <button
                    key={id}
                    onClick={() => toggleColumn(id)}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-popover-foreground hover:bg-muted/50 transition-colors"
                  >
                    <div className={`flex h-3 w-3 shrink-0 items-center justify-center rounded-sm border border-input transition-colors ${visible ? "border-primary bg-primary text-primary-foreground" : ""}`}>
                      {visible && (
                        <svg className="h-2 w-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    {typeof col.header === "string" ? col.header : id}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Count */}
        <span className="text-xs text-muted-foreground">
          {totalCount.toLocaleString()} entries
        </span>

        {/* Auto-scroll */}
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
            className="sr-only peer"
          />
          <div className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border border-input transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground">
            {autoScroll && (
              <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
          Auto-scroll
        </label>

        {/* Connection status */}
        <div
          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs border ${
            isConnected
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-red-500/30 bg-red-500/10 text-red-400"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isConnected ? "bg-emerald-400 animate-pulse" : "bg-red-400"
            }`}
          />
          {isConnected ? "Live" : "Disconnected"}
        </div>
      </header>

      {error && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-destructive/30 bg-destructive/10 text-xs text-destructive">
          <AlertCircle className="h-3 w-3 flex-shrink-0" />
          {error}
        </div>
      )}

      <main className="flex-1 overflow-hidden">
        <LogTable
          logs={logs}
          isLoading={isLoading}
          loadingMore={loadingMore}
          hasMore={hasMore}
          autoScroll={autoScroll}
          columnVisibility={columnVisibility}
          onSelectLog={setSelectedLog}
          onLoadMore={handleLoadMore}
        />
      </main>

      {selectedLog && (
        <LogSidebar log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  );
}

export default App;
