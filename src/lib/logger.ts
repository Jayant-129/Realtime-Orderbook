export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogContext {
  exchange?: string;
  symbol?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  timestamp?: number;
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error;
  timestamp: number;
}

class Logger {
  private isDevelopment: boolean;
  private minLevel: LogLevel;
  private performanceEnabled: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === "development";
    this.minLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.ERROR;
    this.performanceEnabled = this.isDevelopment;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    return {
      level,
      message,
      context: context ? { ...context, timestamp: Date.now() } : undefined,
      error,
      timestamp: Date.now(),
    };
  }

  private formatMessage(entry: LogEntry): string {
    const levelName = LogLevel[entry.level];
    const timestamp = new Date(entry.timestamp).toISOString();

    let formatted = `[${timestamp}] ${levelName}: ${entry.message}`;

    if (entry.context) {
      const contextStr = Object.entries(entry.context)
        .filter(([key]) => key !== "timestamp")
        .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
        .join(" ");

      if (contextStr) {
        formatted += ` | ${contextStr}`;
      }
    }

    return formatted;
  }

  private outputLog(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    const formatted = this.formatMessage(entry);

    if (this.isDevelopment) {
      switch (entry.level) {
        case LogLevel.DEBUG:
          console.debug(formatted, entry.error || "");
          break;
        case LogLevel.INFO:
          console.info(formatted, entry.error || "");
          break;
        case LogLevel.WARN:
          console.warn(formatted, entry.error || "");
          break;
        case LogLevel.ERROR:
          console.error(formatted, entry.error || "");
          break;
      }
    } else {
      if (entry.level === LogLevel.ERROR) {
        console.error(formatted, entry.error || "");
      }
    }
  }

  debug(message: string, context?: LogContext): void {
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
    this.outputLog(entry);
  }

  info(message: string, context?: LogContext): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, context);
    this.outputLog(entry);
  }

  warn(message: string, context?: LogContext, error?: Error): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, context, error);
    this.outputLog(entry);
  }

  error(message: string, context?: LogContext, error?: Error): void {
    const entry = this.createLogEntry(LogLevel.ERROR, message, context, error);
    this.outputLog(entry);
  }

  time(label: string): void {
    if (this.performanceEnabled) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (this.performanceEnabled) {
      console.timeEnd(label);
    }
  }

  wsConnect(exchange: string, symbol?: string): void {
    this.info("WebSocket connecting", {
      exchange,
      symbol,
      action: "connect",
    });
  }

  wsDisconnect(exchange: string, symbol?: string, reason?: string): void {
    this.info("WebSocket disconnected", {
      exchange,
      symbol,
      action: "disconnect",
      reason,
    });
  }

  wsError(exchange: string, error: Error, symbol?: string): void {
    this.error(
      "WebSocket error",
      {
        exchange,
        symbol,
        action: "error",
      },
      error
    );
  }

  wsMessage(
    exchange: string,
    action: string,
    symbol?: string,
    details?: Record<string, unknown>
  ): void {
    this.debug("WebSocket message", {
      exchange,
      symbol,
      action,
      ...details,
    });
  }

  exchangeSubscription(
    exchange: string,
    symbol: string,
    success: boolean
  ): void {
    if (success) {
      this.info("Exchange subscription confirmed", {
        exchange,
        symbol,
        action: "subscribe",
      });
    } else {
      this.warn("Exchange subscription failed", {
        exchange,
        symbol,
        action: "subscribe",
      });
    }
  }

  exchangeData(
    exchange: string,
    symbol: string,
    dataType: string,
    details?: Record<string, unknown>
  ): void {
    this.debug("Exchange data received", {
      exchange,
      symbol,
      action: "data_received",
      dataType,
      ...details,
    });
  }

  exchangeError(
    exchange: string,
    symbol: string,
    error: Error,
    action?: string
  ): void {
    this.error(
      "Exchange error",
      {
        exchange,
        symbol,
        action: action || "unknown_error",
      },
      error
    );
  }
}

export const logger = new Logger();

export { Logger };

export async function measureAsync<T>(
  label: string,
  operation: () => Promise<T>
): Promise<T> {
  logger.time(label);
  try {
    const result = await operation();
    logger.timeEnd(label);
    return result;
  } catch (error) {
    logger.timeEnd(label);
    throw error;
  }
}

export function measureSync<T>(label: string, operation: () => T): T {
  logger.time(label);
  try {
    const result = operation();
    logger.timeEnd(label);
    return result;
  } catch (error) {
    logger.timeEnd(label);
    throw error;
  }
}
