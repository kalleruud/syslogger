import { useState, useMemo, useCallback } from "react";
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
}

export function LogTable({ logs, isLoading = false, onRowClick }: LogTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "timestamp", desc: true },
  ]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState<number | undefined>();
  const [hostnameFilter, setHostnameFilter] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);

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

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Syslog Viewer</CardTitle>
          <div className="text-sm text-muted-foreground">
            {filteredData.length} logs
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 min-h-0">
        {/* Filters */}
        <div className="space-y-4">
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

        {/* Table */}
        <div className="border rounded-md flex-1 overflow-y-auto min-h-0">
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
        </div>
      </CardContent>
    </Card>
  );
}
