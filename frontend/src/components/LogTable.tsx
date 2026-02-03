import { useCallback, useRef, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  VisibilityState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { SyslogMessage } from "../types";
import { columns } from "./columns";
import { Loader2 } from "lucide-react";

interface LogTableProps {
  logs: SyslogMessage[];
  isLoading?: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  autoScroll?: boolean;
  columnVisibility: VisibilityState;
  onSelectLog: (log: SyslogMessage) => void;
  onLoadMore?: () => void;
}

export function LogTable({
  logs,
  isLoading = false,
  loadingMore = false,
  hasMore = true,
  autoScroll = true,
  columnVisibility,
  onSelectLog,
  onLoadMore,
}: LogTableProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef<number>(0);
  const isInitialRef = useRef(true);
  const isAtBottomRef = useRef(true);
  const isPrependingRef = useRef(false);

  const table = useReactTable({
    data: logs,
    columns,
    state: {
      columnVisibility,
    },
    getCoreRowModel: getCoreRowModel(),
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 32,
    overscan: 30,
  });

  // Scroll to bottom on initial load
  useEffect(() => {
    if (isInitialRef.current && logs.length > 0 && !isLoading) {
      isInitialRef.current = false;
      // Use scrollToIndex for reliable virtual scroll positioning
      requestAnimationFrame(() => {
        rowVirtualizer.scrollToIndex(rows.length - 1, { align: "end" });
      });
    }
  }, [logs.length, isLoading, rows.length, rowVirtualizer]);

  // Auto-scroll when new logs arrive (appended at end)
  useEffect(() => {
    if (isInitialRef.current || isPrependingRef.current) return;
    if (!autoScroll || !isAtBottomRef.current) return;
    if (rows.length === 0) return;

    requestAnimationFrame(() => {
      rowVirtualizer.scrollToIndex(rows.length - 1, { align: "end" });
    });
  }, [rows.length, autoScroll, rowVirtualizer]);

  // Maintain scroll position after prepending older logs
  useEffect(() => {
    if (!isPrependingRef.current) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    const prevHeight = prevScrollHeightRef.current;
    if (prevHeight > 0) {
      requestAnimationFrame(() => {
        const diff = container.scrollHeight - prevHeight;
        if (diff > 0) {
          container.scrollTop += diff;
        }
        isPrependingRef.current = false;
      });
    } else {
      isPrependingRef.current = false;
    }
  });

  // Reverse infinite scroll: load more when scrolled near top, track bottom state
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Track whether user is at the bottom (before new items arrive)
    const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    isAtBottomRef.current = distanceToBottom < 100;

    if (!onLoadMore || loadingMore || !hasMore) return;

    if (container.scrollTop < 200) {
      prevScrollHeightRef.current = container.scrollHeight;
      isPrependingRef.current = true;
      onLoadMore();
    }
  }, [onLoadMore, loadingMore, hasMore]);

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-auto"
      >
        {loadingMore && (
          <div className="flex justify-center items-center gap-2 py-2">
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Loading older logs...</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">
            No logs found
          </div>
        ) : (
          <div style={{ height: totalSize, width: '100%', position: 'relative' }}>
            {virtualRows.map((virtualRow) => {
              const row = rows[virtualRow.index];
              const log = row.original;
              return (
                <div
                  key={row.id}
                  ref={rowVirtualizer.measureElement}
                  data-index={virtualRow.index}
                  onClick={() => onSelectLog(log)}
                  className="absolute w-full flex items-start px-4 py-1 cursor-pointer hover:bg-muted/30 border-b border-border/30 text-xs transition-colors"
                  style={{
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {row.getVisibleCells().map((cell) => {
                    const isMessage = cell.column.id === "message";
                    return (
                      <div
                        key={cell.id}
                        className={isMessage ? "flex-1 min-w-0 overflow-hidden pr-3" : "shrink-0 overflow-hidden pr-3"}
                        style={isMessage ? undefined : { width: cell.column.getSize() }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {!hasMore && logs.length > 0 && (
          <div className="text-center py-2">
            <span className="text-xs text-muted-foreground">-- end of logs --</span>
          </div>
        )}
      </div>
    </div>
  );
}
