import { createSocket } from 'dgram';
import { insertLog, getDatabase } from './database.js';
import { SyslogMessage } from './types.js';
import { broadcastLog } from './websocket.js';

const FACILITY_NAMES: Record<number, string> = {
  0: 'kernel',
  1: 'user-level',
  2: 'mail',
  3: 'daemon',
  4: 'auth',
  5: 'syslog',
  6: 'lpr',
  7: 'news',
  8: 'uucp',
  9: 'cron',
  16: 'local0',
  17: 'local1',
  18: 'local2',
  19: 'local3',
  20: 'local4',
  21: 'local5',
  22: 'local6',
  23: 'local7',
};

const SEVERITY_NAMES: Record<number, string> = {
  0: 'Emergency',
  1: 'Alert',
  2: 'Critical',
  3: 'Error',
  4: 'Warning',
  5: 'Notice',
  6: 'Informational',
  7: 'Debug',
};

function parseSyslog(message: string): Omit<SyslogMessage, 'id' | 'created_at'> | null {
  const raw = message;

  // Try RFC 5424 format first
  const rfc5424Regex =
    /^<(\d+)>1 ([^ ]+) ([^ ]+) ([^ ]+) ([^ ]+) ([^ ]+) ([^ ]+) (.*)$/;
  const match5424 = message.match(rfc5424Regex);

  if (match5424) {
    const priority = parseInt(match5424[1], 10);
    const facility = Math.floor(priority / 8);
    const severity = priority % 8;
    const timestamp = match5424[2];
    const hostname = match5424[3];
    const appname = match5424[4];
    const procid = match5424[5];
    const msgid = match5424[6];
    let text = match5424[8];

    // Extract structured data (if not just a dash) and message
    const structuredMatch = text.match(/^(\[[^\]]*\]|-) (.*)$/);
    if (structuredMatch) {
      text = structuredMatch[2];
    } else if (text.startsWith('-')) {
      text = text.substring(1).trim();
    }

    return {
      timestamp,
      facility,
      severity,
      hostname,
      appname,
      procid,
      msgid,
      message: text,
      raw,
    };
  }

  // Try RFC 3164 format
  const rfc3164Regex =
    /^<(\d+)>([A-Za-z]+ +\d+ \d+:\d+:\d+) ([^ ]+) ([^[]*)\[?(\d+)?\]?: *(.*)$/;
  const match3164 = message.match(rfc3164Regex);

  if (match3164) {
    const priority = parseInt(match3164[1], 10);
    const facility = Math.floor(priority / 8);
    const severity = priority % 8;
    const timestamp = match3164[2];
    const hostname = match3164[3];
    const appname = match3164[4].trim();
    const procid = match3164[5] || '';
    const msgid = '';
    const text = match3164[6];

    return {
      timestamp,
      facility,
      severity,
      hostname,
      appname,
      procid,
      msgid,
      message: text,
      raw,
    };
  }

  // Fallback: treat as generic message
  return {
    timestamp: new Date().toISOString(),
    facility: 1,
    severity: 6,
    hostname: 'unknown',
    appname: 'unknown',
    procid: '',
    msgid: '',
    message: message,
    raw,
  };
}

export function startSyslogReceiver(port: number): void {
  const socket = createSocket('udp4');

  socket.on('message', (msg: Buffer, rinfo) => {
    const message = msg.toString('utf-8');
    console.log(`\n[SYSLOG] Received message from ${rinfo.address}:${rinfo.port}`);
    console.log(`[SYSLOG] Raw message: ${message}`);
    console.log(`[SYSLOG] Message size: ${msg.length} bytes`);

    const parsed = parseSyslog(message);
    if (!parsed) {
      console.error('[SYSLOG] ❌ Failed to parse syslog message');
      return;
    }

    console.log('[SYSLOG] ✓ Parsed successfully:');
    console.log(`  - Facility: ${parsed.facility}`);
    console.log(`  - Severity: ${parsed.severity}`);
    console.log(`  - Timestamp: ${parsed.timestamp}`);
    console.log(`  - Hostname: ${parsed.hostname}`);
    console.log(`  - Application: ${parsed.appname}`);
    console.log(`  - Process ID: ${parsed.procid}`);
    console.log(`  - Message ID: ${parsed.msgid}`);
    console.log(`  - Message: ${parsed.message}`);

    try {
      const log = insertLog(parsed);
      broadcastLog(log);
      console.log(`[SYSLOG] ✓ Stored log ID: ${log.id}`);
      console.log(`[SYSLOG] ✓ Broadcast to WebSocket clients`);
    } catch (error) {
      console.error('[SYSLOG] ❌ Error inserting log:', error);
    }
  });

  socket.on('error', (error) => {
    console.error('[SYSLOG] ❌ Socket error:', error);
  });

  socket.on('listening', () => {
    const addr = socket.address();
    console.log(`[SYSLOG] ✓ Syslog receiver listening on ${addr.address}:${addr.port} (UDP)`);
  });

  socket.bind(port, '0.0.0.0');
}
