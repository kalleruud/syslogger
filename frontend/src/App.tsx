import { useState, useEffect, useCallback } from "react";
import { SyslogMessage } from "./types";
import { LogTable } from "./components/LogTable";
import { useWebSocket } from "./hooks/useWebSocket";
import { Terminal, AlertCircle } from "lucide-react";

function App() {
  const [logs, setLogs] = useState<SyslogMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial logs from API
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/logs?limit=100");
        if (!response.ok) throw new Error("Failed to fetch logs");
        const data = await response.json();
        setLogs(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch logs");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, []);

  // Handle new log from WebSocket
  const handleNewLog = useCallback((log: SyslogMessage) => {
    setLogs((prevLogs) => [log, ...prevLogs]);
  }, []);

  // Load more logs for pagination
  const handleLoadMore = useCallback(async (offset: number, limit: number) => {
    try {
      const response = await fetch(`/api/logs?limit=${limit}&offset=${offset}`);
      if (!response.ok) throw new Error("Failed to fetch more logs");
      const newLogs = await response.json();
      setLogs((prevLogs) => [...prevLogs, ...newLogs]);
      return newLogs;
    } catch {
      return [];
    }
  }, []);

  // Setup WebSocket connection
  const { isConnected } = useWebSocket(handleNewLog);

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <Terminal className="h-5 w-5 text-foreground" />
          <h1 className="text-lg font-semibold text-foreground">Syslogger</h1>
        </div>
        <div
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium border ${
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
        <div className="flex items-center gap-2 px-4 py-3 border-b border-destructive/30 bg-destructive/10 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <main className="flex-1 overflow-hidden">
        <LogTable logs={logs} isLoading={isLoading} onLoadMore={handleLoadMore} />
      </main>
    </div>
  );
}

export default App;
