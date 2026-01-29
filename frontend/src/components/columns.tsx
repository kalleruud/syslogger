import { ColumnDef } from "@tanstack/react-table";
import { SyslogMessage } from "../types";
import { Badge } from "./ui/badge";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { Button } from "./ui/button";

const SEVERITY_COLORS: Record<number, string> = {
  0: "bg-red-500/15 text-red-400 border-red-500/20",       // Emergency
  1: "bg-red-500/15 text-red-400 border-red-500/20",       // Alert
  2: "bg-red-500/15 text-red-400 border-red-500/20",       // Critical
  3: "bg-orange-500/15 text-orange-400 border-orange-500/20", // Error
  4: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20", // Warning
  5: "bg-blue-500/15 text-blue-400 border-blue-500/20",    // Notice
  6: "bg-sky-500/15 text-sky-400 border-sky-500/20",       // Info
  7: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",    // Debug
};

export const SEVERITY_NAMES: Record<number, string> = {
  0: "Emergency",
  1: "Alert",
  2: "Critical",
  3: "Error",
  4: "Warning",
  5: "Notice",
  6: "Info",
  7: "Debug",
};

function SortIcon({ column }: { column: { getIsSorted: () => false | "asc" | "desc" } }) {
  const sorted = column.getIsSorted();
  if (sorted === "asc") return <ArrowUp className="ml-1 h-3.5 w-3.5" />;
  if (sorted === "desc") return <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  return <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-50" />;
}

export const columns: ColumnDef<SyslogMessage>[] = [
  {
    accessorKey: "timestamp",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Timestamp
        <SortIcon column={column} />
      </Button>
    ),
    cell: ({ row }) => {
      const timestamp = row.getValue("timestamp") as string;
      return (
        <div className="text-xs font-mono text-muted-foreground">
          {new Date(timestamp).toLocaleString()}
        </div>
      );
    },
  },
  {
    accessorKey: "severity",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Severity
        <SortIcon column={column} />
      </Button>
    ),
    cell: ({ row }) => {
      const severity = row.getValue("severity") as number;
      return (
        <Badge className={SEVERITY_COLORS[severity] || "bg-zinc-500/15 text-zinc-400 border-zinc-500/20"}>
          {SEVERITY_NAMES[severity] || `Level ${severity}`}
        </Badge>
      );
    },
  },
  {
    accessorKey: "hostname",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Hostname
        <SortIcon column={column} />
      </Button>
    ),
    cell: ({ row }) => {
      return <div className="font-medium text-foreground">{row.getValue("hostname")}</div>;
    },
  },
  {
    accessorKey: "appname",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Application
        <SortIcon column={column} />
      </Button>
    ),
    cell: ({ row }) => {
      return <div className="text-foreground">{row.getValue("appname")}</div>;
    },
  },
  {
    accessorKey: "message",
    header: "Message",
    cell: ({ row }) => {
      const message = row.getValue("message") as string;
      return (
        <div className="max-w-md truncate font-mono text-xs text-muted-foreground">
          {message}
        </div>
      );
    },
  },
];
