import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { SyslogMessage } from './types.js';

let db: Database.Database;

export function initDatabase(dbPath: string): Database.Database {
  const dir = path.dirname(dbPath);

  // Create directory if it doesn't exist
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  // Create table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS syslogs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      facility INTEGER,
      severity INTEGER,
      hostname TEXT,
      appname TEXT,
      procid TEXT,
      msgid TEXT,
      message TEXT NOT NULL,
      raw TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_timestamp ON syslogs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_severity ON syslogs(severity);
    CREATE INDEX IF NOT EXISTS idx_hostname ON syslogs(hostname);
  `);

  return db;
}

export function getDatabase(): Database.Database {
  if (!db) throw new Error('Database not initialized');
  return db;
}

export function insertLog(log: Omit<SyslogMessage, 'id' | 'created_at'>): SyslogMessage {
  const stmt = db.prepare(`
    INSERT INTO syslogs (timestamp, facility, severity, hostname, appname, procid, msgid, message, raw)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    log.timestamp,
    log.facility,
    log.severity,
    log.hostname,
    log.appname,
    log.procid,
    log.msgid,
    log.message,
    log.raw
  );

  return {
    ...log,
    id: result.lastInsertRowid as number,
  };
}

export interface LogQuery {
  limit?: number;
  offset?: number;
  severityMin?: number;
  severityMax?: number;
  hostname?: string;
  search?: string;
}

export function getLogs(query: LogQuery = {}): SyslogMessage[] {
  let sql = 'SELECT * FROM syslogs WHERE 1=1';
  const params: (string | number)[] = [];

  if (query.severityMin !== undefined) {
    sql += ' AND severity >= ?';
    params.push(query.severityMin);
  }

  if (query.severityMax !== undefined) {
    sql += ' AND severity <= ?';
    params.push(query.severityMax);
  }

  if (query.hostname) {
    sql += ' AND hostname = ?';
    params.push(query.hostname);
  }

  if (query.search) {
    sql += ' AND (message LIKE ? OR appname LIKE ? OR hostname LIKE ?)';
    const searchTerm = `%${query.search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  sql += ' ORDER BY timestamp DESC';

  if (query.limit) {
    sql += ' LIMIT ?';
    params.push(query.limit);
  }

  if (query.offset) {
    sql += ' OFFSET ?';
    params.push(query.offset);
  }

  const stmt = db.prepare(sql);
  return stmt.all(...params) as SyslogMessage[];
}

export function deleteOldLogs(retentionDays: number): number {
  const stmt = db.prepare(`
    DELETE FROM syslogs
    WHERE severity > 4
    AND datetime(created_at) < datetime('now', '-' || ? || ' days')
  `);

  const result = stmt.run(retentionDays);
  return result.changes;
}

export function closeDatabase(): void {
  if (db) db.close();
}
