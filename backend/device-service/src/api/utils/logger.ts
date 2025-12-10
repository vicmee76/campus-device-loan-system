enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

class Logger {
  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(data && { data }),
    };
    return JSON.stringify(logEntry);
  }

  debug(message: string, data?: any): void {
    if (process.env.LOG_LEVEL === 'DEBUG' || !process.env.LOG_LEVEL) {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, data));
    }
  }

  info(message: string, data?: any): void {
    console.log(this.formatMessage(LogLevel.INFO, message, data));
  }

  warn(message: string, data?: any): void {
    console.warn(this.formatMessage(LogLevel.WARN, message, data));
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
    console.error(this.formatMessage(LogLevel.ERROR, message, errorData));
  }
}

export const logger = new Logger();

