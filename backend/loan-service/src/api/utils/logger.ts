import { AsyncLocalStorage } from 'async_hooks';

enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogContext {
  correlationId?: string;
  userId?: string;
  [key: string]: any;
}

// AsyncLocalStorage for storing context across async operations
const contextStorage = new AsyncLocalStorage<LogContext>();

class Logger {
  private formatMessage(level: LogLevel, message: string, data?: any, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const logEntry: any = {
      timestamp,
      level,
      message,
    };

    // Add correlation ID from context
    if (context?.correlationId) {
      logEntry.correlationId = context.correlationId;
    }

    // Add user ID from context
    if (context?.userId) {
      logEntry.userId = context.userId;
    }

    // Add additional data
    if (data) {
      logEntry.data = data;
    }

    return JSON.stringify(logEntry);
  }

  private getContext(): LogContext | undefined {
    return contextStorage.getStore();
  }

  debug(message: string, data?: any): void {
    if (process.env.LOG_LEVEL === 'DEBUG' || !process.env.LOG_LEVEL) {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, data, this.getContext()));
    }
  }

  info(message: string, data?: any): void {
    console.log(this.formatMessage(LogLevel.INFO, message, data, this.getContext()));
  }

  warn(message: string, data?: any): void {
    console.warn(this.formatMessage(LogLevel.WARN, message, data, this.getContext()));
  }

  error(message: string, error?: Error | any, data?: any): void {
    const errorData = {
      ...data,
      ...(error instanceof Error && {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
      }),
      ...(error && !(error instanceof Error) && { error }),
    };
    console.error(this.formatMessage(LogLevel.ERROR, message, errorData, this.getContext()));
  }
}

export const logger = new Logger();

// Helper to run code with context
export const runWithContext = <T>(context: LogContext, fn: () => T): T => {
  return contextStorage.run(context, fn);
};

// Helper to run async code with context
export const runWithContextAsync = async <T>(context: LogContext, fn: () => Promise<T>): Promise<T> => {
  return contextStorage.run(context, fn);
};

