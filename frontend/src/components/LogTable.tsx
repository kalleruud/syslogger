import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
} from "@tanstack/react-table";
import { SyslogMessage } from "../types";
import { columns } from "./columns";
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
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface LogTableProps {
  logs: SyslogMessage[];
  isLoading?: boolean;
  onRowClick?: (log: SyslogMessage) => void;
  onLoadMore?: (offset: number, limit: number) => Promise<SyslogMessage[]>;
}

const LOGS_PER_PAGE = 100;

export function LogTable({ logs, isLoading = false, onRowClick, onLoadMore }: LogTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "timestamp", desc: true },
  ]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState<number | undefined>();
  const [hostnameFilter, setHostnameFilter] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasMoreRef = useRef(true);

  // Extract unique hostnames and severities for filtering
  const { hostnames, severities } = useMemo(() => {
    const uniqueHostnames = Array.from(new Set(logs.map((log) => log.hostname)));
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

  // Handle infinite scroll
  const handleScroll = useCallback(async () => {
    if (!scrollContainerRef.current || !onLoadMore || loadingMore || !hasMoreRef.current) {
      return;
    }

    const container = scrollContainerRef.current;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceToBottom = scrollHeight - (scrollTop + clientHeight);

    console.log(`[Scroll] scrollTop: ${scrollTop}, scrollHeight: ${scrollHeight}, clientHeight: ${clientHeight}, distance: ${distanceToBottom}`);

    // Trigger load when user scrolls to bottom (within 200px)
    if (distanceToBottom < 200) {
      console.log(`[Scroll] Loading more logs... (offset: ${logs.length})`);
      setLoadingMore(true);
      try {
        const newLogs = await onLoadMore(logs.length, LOGS_PER_PAGE);
        console.log(`[Scroll] Loaded ${newLogs.length} new logs`);
        if (newLogs.length < LOGS_PER_PAGE) {
          console.log('[Scroll] No more logs available');
          hasMoreRef.current = false;
        }
      } catch (error) {
        console.error("[Scroll] Error loading more logs:", error);
      } finally {
        setLoadingMore(false);
      }
    }
  }, [logs.length, onLoadMore, loadingMore]);

  return (
    <div className="w-full h-full flex flex-col border rounded-lg bg-card text-card-foreground shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Syslog Viewer</h2>
          <div className="text-sm text-muted-foreground">
            {filteredData.length} logs
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4 p-6 border-b flex-shrink-0">
        <div>
          <Input
            placeholder="Search by message, app, or hostname..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Severity</label>
            <select
              value={severityFilter ?? ""}
              onChange={(e) =>
                setSeverityFilter(e.target.value ? parseInt(e.target.value) : undefined)
              }
              className="w-full px-3 py-2 border border-input rounded-md text-sm"
            >
              <option value="">All Severities</option>
              {severities.map((sev) => (
                <option key={sev} value={sev}>
                  {["Emergency", "Alert", "Critical", "Error", "Warning", "Notice", "Info", "Debug"][sev]} ({sev})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Hostname</label>
            <select
              value={hostnameFilter}
              onChange={(e) => setHostnameFilter(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md text-sm"
            >
              <option value="">All Hostnames</option>
              {hostnames.map((hostname) => (
                <option key={hostname} value={hostname}>
                  {hostname}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
            className="rounded border-gray-300"
          />
          Auto-scroll to new logs
        </label>
      </div>

      {/* Table Container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        <Table className="w-full">
          <TableHeader className="sticky top-0 bg-muted z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
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
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8">
                  Loading logs...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8">
                  No logs found
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => onRowClick?.(row.original)}
                  className={onRowClick ? "cursor-pointer" : ""}
                >
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
              ))
            )}
          </TableBody>
        </Table>
        {loadingMore && (
          <div className="flex justify-center items-center py-4 bg-muted/50">
            <div className="text-sm text-muted-foreground">Loading more logs...</div>
          </div>
        )}
        {!hasMoreRef.current && logs.length > 0 && (
          <div className="flex justify-center items-center py-4 bg-muted/50">
            <div className="text-sm text-muted-foreground">No more logs</div>
          </div>
        )}
      </div>
    </div>
  );
}
