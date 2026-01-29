import { useState, useEffect, useCallback } from "react";
import { SyslogMessage } from "./types";
import { LogTable } from "./components/LogTable";
import { useWebSocket } from "./hooks/useWebSocket";

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
        console.error("Error fetching logs:", err);
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

      // Append new logs to the end
      setLogs((prevLogs) => [...prevLogs, ...newLogs]);

      return newLogs;
    } catch (err) {
      console.error("Error loading more logs:", err);
      return [];
    }
  }, []);

  // Setup WebSocket connection
  const { isConnected } = useWebSocket(handleNewLog);

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <div className="p-4 flex items-center justify-between border-b">
        <h1 className="text-3xl font-bold">Syslogger</h1>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="text-sm text-muted-foreground">
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <LogTable logs={logs} isLoading={isLoading} onLoadMore={handleLoadMore} />
      </div>
    </div>
  );
}

export default App;
