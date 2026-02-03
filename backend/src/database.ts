import { Database } from 'bun:sqlite';
import path from 'path';
import fs from 'fs';
import { SyslogMessage } from './types.js';

let db: Database;

export function initDatabase(dbPath: string): Database {
  const dir = path.dirname(dbPath);

  // Create directory if it doesn't exist
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(dbPath);

  // Create table if it doesn't exist
  db.run(`
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
    CREATE INDEX IF NOT EXISTS idx_appname ON syslogs(appname);
  `);

  return db;
}

export function getDatabase(): Database {
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
  severities?: number[];
  appnames?: string[];
  hostname?: string;
  search?: string;
}

function buildWhereClause(query: LogQuery): { where: string; params: (string | number)[] } {
  let where = ' WHERE 1=1';
  const params: (string | number)[] = [];

  if (query.severities && query.severities.length > 0) {
    const placeholders = query.severities.map(() => '?').join(', ');
    where += ` AND severity IN (${placeholders})`;
    params.push(...query.severities);
  }

  if (query.appnames && query.appnames.length > 0) {
    const placeholders = query.appnames.map(() => '?').join(', ');
    where += ` AND appname IN (${placeholders})`;
    params.push(...query.appnames);
  }

  if (query.hostname) {
    where += ' AND hostname = ?';
    params.push(query.hostname);
  }

  if (query.search) {
    where += ' AND (message LIKE ? OR appname LIKE ? OR hostname LIKE ?)';
    const searchTerm = `%${query.search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  return { where, params };
}

export function getLogs(query: LogQuery = {}): SyslogMessage[] {
  const { where, params } = buildWhereClause(query);
  let sql = `SELECT * FROM syslogs${where} ORDER BY timestamp DESC`;

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

export function getLogCount(query: LogQuery = {}): number {
  const { where, params } = buildWhereClause(query);
  const sql = `SELECT COUNT(*) as count FROM syslogs${where}`;
  const stmt = db.prepare(sql);
  const result = stmt.get(...params) as { count: number };
  return result.count;
}

export function getUniqueAppnames(): string[] {
  const stmt = db.prepare('SELECT DISTINCT appname FROM syslogs WHERE appname IS NOT NULL AND appname != "" ORDER BY appname');
  const rows = stmt.all() as { appname: string }[];
  return rows.map(r => r.appname);
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
