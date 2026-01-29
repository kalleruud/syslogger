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

  // Setup WebSocket connection
  const { isConnected } = useWebSocket(handleNewLog);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-full h-screen flex flex-col gap-4">
        <div className="flex items-center justify-between">
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
          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-hidden">
          <LogTable logs={logs} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}

export default App;
