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
