import { config } from "../config/config.ts";

export interface LogEntry {
  request_id?: string;
  timestamp: string;
  level: "debug" | "info" | "warn" | "error";
  message: string;
  mapping_name?: string;
  duration_ms?: number;
  status?: string;
  error?: string;
  payload_summary?: string;
  port?: number;
  [key: string]: unknown;
}

export class Logger {
  private logLevel: string;

  constructor(logLevel?: string) {
    this.logLevel = logLevel || config.logLevel;
  }

  private shouldLog(level: string): boolean {
    const levels = ["debug", "info", "warn", "error"];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private formatEntry(entry: LogEntry): string {
    return JSON.stringify(entry);
  }

  debug(message: string, meta?: Partial<LogEntry>): void {
    if (this.shouldLog("debug")) {
      console.log(this.formatEntry({
        timestamp: new Date().toISOString(),
        level: "debug",
        message,
        ...meta,
      }));
    }
  }

  info(message: string, meta?: Partial<LogEntry>): void {
    if (this.shouldLog("info")) {
      console.log(this.formatEntry({
        timestamp: new Date().toISOString(),
        level: "info",
        message,
        ...meta,
      }));
    }
  }

  warn(message: string, meta?: Partial<LogEntry>): void {
    if (this.shouldLog("warn")) {
      console.warn(this.formatEntry({
        timestamp: new Date().toISOString(),
        level: "warn",
        message,
        ...meta,
      }));
    }
  }

  error(message: string, meta?: Partial<LogEntry>): void {
    if (this.shouldLog("error")) {
      console.error(this.formatEntry({
        timestamp: new Date().toISOString(),
        level: "error",
        message,
        ...meta,
      }));
    }
  }

  logRequest(requestId: string, mappingName: string, _payload: unknown, status: string, durationMs?: number, error?: string): void {
    this.info("HTTP request processed", {
      request_id: requestId,
      mapping_name: mappingName,
      status,
      duration_ms: durationMs,
      error,
    });
  }
}

export const logger = new Logger();