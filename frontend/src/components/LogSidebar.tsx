import { useEffect } from "react";
import { SyslogMessage } from "../types";
import { SEVERITY_NAMES, SEVERITY_COLORS } from "./columns";
import { X } from "lucide-react";
import { Badge } from "./ui/badge";

const FACILITY_NAMES: Record<number, string> = {
  0: "kern", 1: "user", 2: "mail", 3: "daemon", 4: "auth", 5: "syslog",
  6: "lpr", 7: "news", 8: "uucp", 9: "cron", 10: "authpriv", 11: "ftp",
  16: "local0", 17: "local1", 18: "local2", 19: "local3",
  20: "local4", 21: "local5", 22: "local6", 23: "local7",
};

interface LogSidebarProps {
  log: SyslogMessage;
  onClose: () => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  );
}

export function LogSidebar({ log, onClose }: LogSidebarProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />
      {/* Sidebar */}
      <div className="fixed top-0 right-0 h-full w-full max-w-lg z-50 bg-card border-l border-border animate-slide-in overflow-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-medium text-foreground">Log Details</span>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-0">
          <Field label="Timestamp">
            {new Date(log.timestamp).toLocaleString()}
          </Field>

          <Field label="Severity">
            <Badge className={SEVERITY_COLORS[log.severity] || "bg-zinc-500/15 text-zinc-400 border-zinc-500/20"}>
              {SEVERITY_NAMES[log.severity] || `Level ${log.severity}`}
            </Badge>
            <span className="ml-2 text-muted-foreground">({log.severity})</span>
          </Field>

          <Field label="Facility">
            {FACILITY_NAMES[log.facility] || String(log.facility)}
          </Field>

          <Field label="Hostname">
            {log.hostname || "\u2014"}
          </Field>

          <Field label="Application">
            {log.appname || "\u2014"}
          </Field>

          <Field label="ProcID">
            {log.procid || "\u2014"}
          </Field>

          <Field label="MsgID">
            {log.msgid || "\u2014"}
          </Field>

          <div className="mb-3">
            <div className="text-xs text-muted-foreground mb-1">Message</div>
            <pre className="text-sm text-foreground bg-background/50 rounded-md p-3 whitespace-pre-wrap break-all border border-border">
              {log.message}
            </pre>
          </div>

          {log.raw && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Raw Syslog</div>
              <pre className="text-xs text-muted-foreground bg-background/50 rounded-md p-3 whitespace-pre-wrap break-all border border-border">
                {log.raw}
              </pre>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
