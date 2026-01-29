import { ColumnDef } from "@tanstack/react-table";
import { SyslogMessage } from "../types";
import { Badge } from "./ui/badge";
import { ArrowUpDown } from "lucide-react";
import { Button } from "./ui/button";

const SEVERITY_COLORS: Record<number, string> = {
  0: "bg-red-900 text-white",      // Emergency
  1: "bg-red-700 text-white",      // Alert
  2: "bg-red-600 text-white",      // Critical
  3: "bg-orange-600 text-white",   // Error
  4: "bg-yellow-600 text-white",   // Warning
  5: "bg-blue-600 text-white",     // Notice
  6: "bg-blue-500 text-white",     // Informational
  7: "bg-gray-600 text-white",     // Debug
};

const SEVERITY_NAMES: Record<number, string> = {
  0: "Emergency",
  1: "Alert",
  2: "Critical",
  3: "Error",
  4: "Warning",
  5: "Notice",
  6: "Info",
  7: "Debug",
};

export const columns: ColumnDef<SyslogMessage>[] = [
  {
    accessorKey: "timestamp",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Timestamp
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const timestamp = row.getValue("timestamp") as string;
      return <div className="text-xs">{new Date(timestamp).toLocaleString()}</div>;
    },
  },
  {
    accessorKey: "severity",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Severity
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const severity = row.getValue("severity") as number;
      return (
        <Badge className={SEVERITY_COLORS[severity] || "bg-gray-600 text-white"}>
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
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Hostname
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      return <div className="font-medium">{row.getValue("hostname")}</div>;
    },
  },
  {
    accessorKey: "appname",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Application
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      return <div>{row.getValue("appname")}</div>;
    },
  },
  {
    accessorKey: "message",
    header: "Message",
    cell: ({ row }) => {
      const message = row.getValue("message") as string;
      return (
        <div className="max-w-md truncate text-sm text-gray-700">
          {message}
        </div>
      );
    },
  },
];
