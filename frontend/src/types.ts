export interface SyslogMessage {
  id?: number;
  timestamp: string;
  facility: number;
  severity: number;
  hostname: string;
  appname: string;
  procid: string;
  msgid: string;
  message: string;
  raw: string;
  created_at?: string;
}

export interface WebSocketMessage {
  type: 'log';
  data: SyslogMessage;
}
