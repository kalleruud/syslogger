import { useState, useMemo, useCallback, useRef } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
} from "@tanstack/react-table";
import { SyslogMessage } from "../types";
import { columns, SEVERITY_NAMES } from "./columns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Select } from "./ui/select";
import { Skeleton } from "./ui/skeleton";
import { Monitor, Search, X, Loader2, ChevronRight, ChevronDown } from "lucide-react";

interface LogTableProps {
  logs: SyslogMessage[];
  isLoading?: boolean;
  onLoadMore?: (offset: number, limit: number) => Promise<SyslogMessage[]>;
}

const LOGS_PER_PAGE = 100;

export function LogTable({ logs, isLoading = false, onLoadMore }: LogTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "timestamp", desc: true },
  ]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState<number | undefined>();
  const [hostnameFilter, setHostnameFilter] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasMoreRef = useRef(true);

  const hasActiveFilters = globalFilter || severityFilter !== undefined || hostnameFilter;

  // Extract unique hostnames and severities for filtering
  const { hostnames, severities } = useMemo(() => {
    const uniqueHostnames = Array.from(new Set(logs.map((log) => log.hostname))).sort();
    const uniqueSeverities = Array.from(new Set(logs.map((log) => log.severity))).sort((a, b) => a - b);
    return { hostnames: uniqueHostnames, severities: uniqueSeverities };
  }, [logs]);

  // Apply custom filters
  const filteredData = useMemo(() => {
    return logs.filter((log) => {
      const matchesGlobalFilter =
        !globalFilter ||
        log.message.toLowerCase().includes(globalFilter.toLowerCase()) ||
        log.appname.toLowerCase().includes(globalFilter.toLowerCase()) ||
        log.hostname.toLowerCase().includes(globalFilter.toLowerCase());

      const matchesSeverity = severityFilter === undefined || log.severity === severityFilter;
      const matchesHostname = !hostnameFilter || log.hostname === hostnameFilter;

      return matchesGlobalFilter && matchesSeverity && matchesHostname;
    });
  }, [logs, globalFilter, severityFilter, hostnameFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const handleClearFilters = useCallback(() => {
    setGlobalFilter("");
    setSeverityFilter(undefined);
    setHostnameFilter("");
    setSorting([{ id: "timestamp", desc: true }]);
  }, []);

  const toggleRow = useCallback((rowId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  }, []);

  // Handle infinite scroll
  const handleScroll = useCallback(async () => {
    if (!scrollContainerRef.current || !onLoadMore || loadingMore || !hasMoreRef.current) {
      return;
    }

    const container = scrollContainerRef.current;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceToBottom = scrollHeight - (scrollTop + clientHeight);

    if (distanceToBottom < 200) {
      setLoadingMore(true);
      try {
        const newLogs = await onLoadMore(logs.length, LOGS_PER_PAGE);
        if (newLogs.length < LOGS_PER_PAGE) {
          hasMoreRef.current = false;
        }
      } catch {
        // silently handle scroll load errors
      } finally {
        setLoadingMore(false);
      }
    }
  }, [logs.length, onLoadMore, loadingMore]);

  const FACILITY_NAMES: Record<number, string> = {
    0: "kern", 1: "user", 2: "mail", 3: "daemon", 4: "auth", 5: "syslog",
    6: "lpr", 7: "news", 8: "uucp", 9: "cron", 10: "authpriv", 11: "ftp",
    16: "local0", 17: "local1", 18: "local2", 19: "local3",
    20: "local4", 21: "local5", 22: "local6", 23: "local7",
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mr-auto">
          <Monitor className="h-4 w-4" />
          <span className="font-medium text-foreground">{filteredData.length}</span>
          <span>entries</span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-56 pl-8"
          />
        </div>

        {/* Severity filter */}
        <Select
          value={severityFilter ?? ""}
          onChange={(e) =>
            setSeverityFilter(e.target.value ? parseInt(e.target.value) : undefined)
          }
          className="w-40"
        >
          <option value="">All Severities</option>
          {severities.map((sev) => (
            <option key={sev} value={sev}>
              {SEVERITY_NAMES[sev] || `Level ${sev}`}
            </option>
          ))}
        </Select>

        {/* Hostname filter */}
        <Select
          value={hostnameFilter}
          onChange={(e) => setHostnameFilter(e.target.value)}
          className="w-40"
        >
          <option value="">All Hosts</option>
          {hostnames.map((hostname) => (
            <option key={hostname} value={hostname}>
              {hostname}
            </option>
          ))}
        </Select>

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        {/* Auto-scroll toggle */}
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none ml-2">
          <div className="relative">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="peer sr-only"
            />
            <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-input transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground">
              {autoScroll && (
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
          </div>
          Auto-scroll
        </label>
      </div>

      {/* Table Container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        <Table className="w-full">
          <TableHeader className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-border hover:bg-transparent">
                <TableHead className="w-8" />
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="whitespace-nowrap">
                    {header.isPlaceholder
                      ? null
                      : header.column.columnDef.header
                        ? typeof header.column.columnDef.header === 'function'
                          ? header.column.columnDef.header(header.getContext())
                          : header.column.columnDef.header
                        : null}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Skeleton loading rows
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`} className="border-b border-border">
                  <TableCell className="w-8" />
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="text-center py-12 text-muted-foreground">
                  No logs found
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => {
                const isExpanded = expandedRows.has(row.id);
                const log = row.original;
                return (
                  <>
                    <TableRow
                      key={row.id}
                      onClick={() => toggleRow(row.id)}
                      className="cursor-pointer border-b border-border"
                    >
                      <TableCell className="w-8 px-2">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="whitespace-nowrap">
                          {cell.column.columnDef.cell
                            ? typeof cell.column.columnDef.cell === 'function'
                              ? cell.column.columnDef.cell(cell.getContext())
                              : cell.column.columnDef.cell
                            : null}
                        </TableCell>
                      ))}
                    </TableRow>
                    {isExpanded && (
                      <TableRow key={`${row.id}-expanded`} className="border-b border-border hover:bg-transparent">
                        <TableCell colSpan={columns.length + 1} className="p-0">
                          <div className="animate-fade-in bg-muted/30 px-6 py-4 border-t border-border">
                            {/* Field grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-3 mb-4">
                              <div>
                                <div className="text-xs text-muted-foreground mb-0.5">Timestamp</div>
                                <div className="text-sm font-mono text-foreground">{new Date(log.timestamp).toLocaleString()}</div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground mb-0.5">Hostname</div>
                                <div className="text-sm text-foreground">{log.hostname}</div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground mb-0.5">Application</div>
                                <div className="text-sm text-foreground">{log.appname || "—"}</div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground mb-0.5">ProcID</div>
                                <div className="text-sm font-mono text-foreground">{log.procid || "—"}</div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground mb-0.5">MsgID</div>
                                <div className="text-sm font-mono text-foreground">{log.msgid || "—"}</div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground mb-0.5">Facility</div>
                                <div className="text-sm text-foreground">{FACILITY_NAMES[log.facility] || log.facility}</div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground mb-0.5">Severity</div>
                                <div className="text-sm text-foreground">{SEVERITY_NAMES[log.severity] || log.severity} ({log.severity})</div>
                              </div>
                            </div>

                            {/* Full message */}
                            <div className="mb-3">
                              <div className="text-xs text-muted-foreground mb-1">Message</div>
                              <pre className="text-sm font-mono text-foreground bg-background/50 rounded-md p-3 whitespace-pre-wrap break-all border border-border">
                                {log.message}
                              </pre>
                            </div>

                            {/* Raw syslog */}
                            {log.raw && (
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">Raw Syslog</div>
                                <pre className="text-xs font-mono text-muted-foreground bg-background/50 rounded-md p-3 whitespace-pre-wrap break-all border border-border">
                                  {log.raw}
                                </pre>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })
            )}
          </TableBody>
        </Table>
        {loadingMore && (
          <div className="flex justify-center items-center gap-2 py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Loading more...</span>
          </div>
        )}
        {!hasMoreRef.current && logs.length > 0 && (
          <div className="flex justify-center items-center py-4">
            <span className="text-sm text-muted-foreground">No more logs</span>
          </div>
        )}
      </div>
    </div>
  );
}
