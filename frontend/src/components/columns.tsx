import { ColumnDef } from "@tanstack/react-table";
import { SyslogMessage } from "../types";
import { Badge } from "./ui/badge";

export const SEVERITY_COLORS: Record<number, string> = {
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

export const columns: ColumnDef<SyslogMessage>[] = [
  {
    id: "timestamp",
    accessorKey: "timestamp",
    size: 190,
    minSize: 120,
    header: "Timestamp",
    cell: ({ row }) => {
      const timestamp = row.getValue("timestamp") as string;
      return (
        <span className="text-xs text-muted-foreground">
          {new Date(timestamp).toLocaleString()}
        </span>
      );
    },
  },
  {
    id: "severity",
    accessorKey: "severity",
    size: 100,
    minSize: 70,
    header: "Severity",
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
    id: "hostname",
    accessorKey: "hostname",
    size: 140,
    minSize: 80,
    header: "Hostname",
    cell: ({ row }) => (
      <span className="text-foreground">{row.getValue("hostname")}</span>
    ),
  },
  {
    id: "appname",
    accessorKey: "appname",
    size: 140,
    minSize: 80,
    header: "Application",
    cell: ({ row }) => (
      <span className="text-foreground">{row.getValue("appname")}</span>
    ),
  },
  {
    id: "facility",
    accessorKey: "facility",
    size: 100,
    minSize: 70,
    header: "Facility",
    cell: ({ row }) => {
      const facility = row.getValue("facility") as number;
      const names: Record<number, string> = {
        0: "kern", 1: "user", 2: "mail", 3: "daemon", 4: "auth", 5: "syslog",
        6: "lpr", 7: "news", 8: "uucp", 9: "cron", 10: "authpriv", 11: "ftp",
        16: "local0", 17: "local1", 18: "local2", 19: "local3",
        20: "local4", 21: "local5", 22: "local6", 23: "local7",
      };
      return <span className="text-muted-foreground">{names[facility] || String(facility)}</span>;
    },
  },
  {
    id: "procid",
    accessorKey: "procid",
    size: 100,
    minSize: 60,
    header: "ProcID",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.getValue("procid") || "\u2014"}</span>
    ),
  },
  {
    id: "msgid",
    accessorKey: "msgid",
    size: 100,
    minSize: 60,
    header: "MsgID",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.getValue("msgid") || "\u2014"}</span>
    ),
  },
  {
    id: "message",
    accessorKey: "message",
    size: 500,
    minSize: 100,
    header: "Message",
    cell: ({ row }) => {
      const message = row.getValue("message") as string;
      return (
        <span className="text-xs text-muted-foreground whitespace-pre-wrap break-all">
          {message}
        </span>
      );
    },
  },
];
