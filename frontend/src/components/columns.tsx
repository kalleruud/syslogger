import { ColumnDef } from "@tanstack/react-table";
import { SyslogMessage } from "../types";

export const SEVERITY_COLORS: Record<number, string> = {
  0: "text-red-400",       // Emergency
  1: "text-red-400",       // Alert
  2: "text-red-400",       // Critical
  3: "text-orange-400",    // Error
  4: "text-yellow-400",    // Warning
  5: "text-blue-400",      // Notice
  6: "text-sky-400",       // Info
  7: "text-zinc-400",      // Debug
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

export const SEVERITY_LABELS: Record<number, string> = {
  0: "emerg",
  1: "alert",
  2: "crit",
  3: "err",
  4: "warn",
  5: "notice",
  6: "info",
  7: "debug",
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
        <span className="text-xs">
          {new Date(timestamp).toLocaleString()}
        </span>
      );
    },
  },
  {
    id: "severity",
    accessorKey: "severity",
    size: 80,
    minSize: 60,
    header: "Severity",
    cell: ({ row }) => {
      const severity = row.getValue("severity") as number;
      return (
        <span>[{SEVERITY_LABELS[severity] || `lvl${severity}`}]</span>
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
      <span>{row.getValue("hostname")}</span>
    ),
  },
  {
    id: "appname",
    accessorKey: "appname",
    size: 140,
    minSize: 80,
    header: "Application",
    cell: ({ row }) => (
      <span>{row.getValue("appname")}</span>
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
      return <span>{names[facility] || String(facility)}</span>;
    },
  },
  {
    id: "procid",
    accessorKey: "procid",
    size: 100,
    minSize: 60,
    header: "ProcID",
    cell: ({ row }) => (
      <span>{row.getValue("procid") || "\u2014"}</span>
    ),
  },
  {
    id: "msgid",
    accessorKey: "msgid",
    size: 100,
    minSize: 60,
    header: "MsgID",
    cell: ({ row }) => (
      <span>{row.getValue("msgid") || "\u2014"}</span>
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
        <span className="text-xs whitespace-pre-wrap break-all">
          {message}
        </span>
      );
    },
  },
];
