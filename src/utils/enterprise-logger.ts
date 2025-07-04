interface LogLevel {
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  priority: number;
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  stack?: string;
}

class EnterpriseLogger {
  private logLevels: Record<string, LogLevel> = {
    debug: { level: 'debug', priority: 0 },
    info: { level: 'info', priority: 1 },
    warn: { level: 'warn', priority: 2 },
    error: { level: 'error', priority: 3 },
    critical: { level: 'critical', priority: 4 }
  };

  private minLogLevel: number = 1;
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 1000;

  constructor() {
    this.minLogLevel = import.meta.env.DEV ? 0 : 1;
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, any>): void {
    this.log('error', message, context);
  }

  critical(message: string, context?: Record<string, any>): void {
    this.log('critical', message, context);
  }

  private log(level: string, message: string, context?: Record<string, any>): void {
    const logLevel = this.logLevels[level];
    if (!logLevel || logLevel.priority < this.minLogLevel) {
      return;
    }

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
      requestId: this.getRequestId()
    };

    if (level === 'error' || level === 'critical') {
      logEntry.stack = new Error().stack;
    }

    this.addToBuffer(logEntry);
    this.outputLog(logEntry);

    if (level === 'critical') {
      this.sendAlert(logEntry);
    }
  }

  private addToBuffer(entry: LogEntry): void {
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer = this.logBuffer.slice(-this.maxBufferSize);
    }
  }

  private outputLog(entry: LogEntry): void {
    const formattedMessage = `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`;
    
    switch (entry.level) {
      case 'debug':
        if (import.meta.env.DEV) {
          console.debug(formattedMessage, entry.context);
        }
        break;
      case 'info':
        console.info(formattedMessage, entry.context);
        break;
      case 'warn':
        console.warn(formattedMessage, entry.context);
        break;
      case 'error':
      case 'critical':
        console.error(formattedMessage, entry.context);
        break;
    }

    if (import.meta.env.PROD) {
      this.sendToLogService(entry);
    }
  }

  private async sendToLogService(entry: LogEntry): Promise<void> {
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry)
      });
    } catch (error) {
    }
  }

  private async sendAlert(entry: LogEntry): Promise<void> {
    try {
      await fetch('/api/alerts/critical', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: entry.message,
          context: entry.context,
          timestamp: entry.timestamp,
          userId: entry.userId,
          stack: entry.stack
        })
      });
    } catch (error) {
    }
  }

  private getCurrentUserId(): string | undefined {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.id;
    } catch {
      return undefined;
    }
  }

  private getSessionId(): string | undefined {
    try {
      return sessionStorage.getItem('sessionId') || undefined;
    } catch {
      return undefined;
    }
  }

  private getRequestId(): string | undefined {
    return Math.random().toString(36).substr(2, 9);
  }

  getLogs(level?: string, limit?: number): LogEntry[] {
    let filtered = this.logBuffer;
    
    if (level) {
      filtered = filtered.filter(entry => entry.level === level);
    }
    
    if (limit) {
      filtered = filtered.slice(-limit);
    }
    
    return filtered;
  }

  clearLogs(): void {
    this.logBuffer = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logBuffer, null, 2);
  }
}

export const enterpriseLogger = new EnterpriseLogger();

export const replaceConsoleLog = () => {
  if (import.meta.env.PROD) {
    console.log = (message: any, ...args: any[]) => {
      enterpriseLogger.info(String(message), { args });
    };
    
    console.warn = (message: any, ...args: any[]) => {
      enterpriseLogger.warn(String(message), { args });
    };
    
    console.error = (message: any, ...args: any[]) => {
      enterpriseLogger.error(String(message), { args });
    };
  }
};
