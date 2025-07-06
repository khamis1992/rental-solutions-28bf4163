/**
 * Enhanced logging system with comprehensive monitoring capabilities
 */
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { logError } from './error-logging';
import { logOperation } from './monitoring-utils';

// Enhanced log levels
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

// Enhanced log categories
export type LogCategory = 
  | 'system' 
  | 'database' 
  | 'api' 
  | 'user' 
  | 'payment' 
  | 'agreement' 
  | 'vehicle' 
  | 'security' 
  | 'performance'
  | 'business';

// Log entry interface
export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: any;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  ip?: string;
  requestId?: string;
  duration?: number;
  errorStack?: string;
}

// Performance tracking interface
export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  timestamp: string;
  metadata?: any;
}

// Business event interface
export interface BusinessEvent {
  id: string;
  event: string;
  category: LogCategory;
  timestamp: string;
  data: any;
  userId?: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
}

class EnhancedLogger {
  private sessionId: string;
  private userId?: string;
  private logBuffer: LogEntry[] = [];
  private performanceBuffer: PerformanceMetric[] = [];
  private businessEventBuffer: BusinessEvent[] = [];
  private flushInterval: number = 30000; // 30 seconds
  private maxBufferSize: number = 100;

  constructor() {
    this.sessionId = uuidv4();
    this.initializeAutoFlush();
    this.initializeUserTracking();
  }

  private initializeAutoFlush() {
    setInterval(() => {
      this.flush();
    }, this.flushInterval);

    // Flush on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush();
      });
    }
  }

  private async initializeUserTracking() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      this.userId = user?.id;
    } catch (error) {
      // User not authenticated, continue without user ID
    }
  }

  private createBaseLogEntry(
    level: LogLevel,
    category: LogCategory,
    message: string,
    data?: any
  ): LogEntry {
    return {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      userId: this.userId,
      sessionId: this.sessionId,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      ip: undefined, // Will be populated by server if needed
    };
  }

  // Core logging methods
  trace(category: LogCategory, message: string, data?: any) {
    return this.log('trace', category, message, data);
  }

  debug(category: LogCategory, message: string, data?: any) {
    return this.log('debug', category, message, data);
  }

  info(category: LogCategory, message: string, data?: any) {
    return this.log('info', category, message, data);
  }

  warn(category: LogCategory, message: string, data?: any) {
    return this.log('warn', category, message, data);
  }

  error(category: LogCategory, message: string, data?: any, error?: Error) {
    const logEntry = this.createBaseLogEntry('error', category, message, data);
    if (error) {
      logEntry.errorStack = error.stack;
    }
    this.addToBuffer(logEntry);
    
    // Also use the existing error logging system
    logError(category, message, { ...data, error: error?.message }, 'client');
    
    return logEntry.id;
  }

  fatal(category: LogCategory, message: string, data?: any, error?: Error) {
    const logEntry = this.createBaseLogEntry('fatal', category, message, data);
    if (error) {
      logEntry.errorStack = error.stack;
    }
    this.addToBuffer(logEntry);
    
    // Immediately flush fatal errors
    this.flush();
    
    return logEntry.id;
  }

  private log(level: LogLevel, category: LogCategory, message: string, data?: any) {
    const logEntry = this.createBaseLogEntry(level, category, message, data);
    this.addToBuffer(logEntry);
    
    // Console output for development
    if (process.env.NODE_ENV === 'development') {
      const consoleMethod = level === 'warn' ? 'warn' : level === 'error' || level === 'fatal' ? 'error' : 'log';
      console[consoleMethod](`[${level.toUpperCase()}] [${category}] ${message}`, data || '');
    }
    
    return logEntry.id;
  }

  // Performance tracking
  trackPerformance(name: string, value: number, metadata?: any): string {
    const metric: PerformanceMetric = {
      id: uuidv4(),
      name,
      value,
      timestamp: new Date().toISOString(),
      metadata
    };
    
    this.performanceBuffer.push(metric);
    
    if (this.performanceBuffer.length >= this.maxBufferSize) {
      this.flushPerformanceMetrics();
    }
    
    return metric.id;
  }

  // Business event tracking
  trackBusinessEvent(
    event: string, 
    category: LogCategory, 
    data: any, 
    impact: BusinessEvent['impact'] = 'low'
  ): string {
    const businessEvent: BusinessEvent = {
      id: uuidv4(),
      event,
      category,
      timestamp: new Date().toISOString(),
      data,
      userId: this.userId,
      impact
    };
    
    this.businessEventBuffer.push(businessEvent);
    
    // Also use existing operation logging for business events
    logOperation(event, impact === 'critical' ? 'error' : 'success', data);
    
    if (this.businessEventBuffer.length >= this.maxBufferSize) {
      this.flushBusinessEvents();
    }
    
    return businessEvent.id;
  }

  // Database operation logging
  async logDatabaseOperation(
    operation: string,
    table: string,
    success: boolean,
    duration?: number,
    error?: Error
  ) {
    const level: LogLevel = success ? 'info' : 'error';
    const message = `Database ${operation} on ${table} ${success ? 'succeeded' : 'failed'}`;
    
    const logEntry = this.createBaseLogEntry(level, 'database', message, {
      operation,
      table,
      success,
      duration
    });
    
    if (duration) {
      logEntry.duration = duration;
    }
    
    if (error) {
      logEntry.errorStack = error.stack;
    }
    
    this.addToBuffer(logEntry);
    
    // Track performance if duration is available
    if (duration) {
      this.trackPerformance(`db_${operation}_${table}`, duration, { success });
    }
    
    return logEntry.id;
  }

  // API request logging
  async logApiRequest(
    method: string,
    endpoint: string,
    statusCode: number,
    duration: number,
    requestId?: string
  ) {
    const level: LogLevel = statusCode >= 400 ? 'error' : 'info';
    const message = `${method} ${endpoint} - ${statusCode}`;
    
    const logEntry = this.createBaseLogEntry(level, 'api', message, {
      method,
      endpoint,
      statusCode,
      duration
    });
    
    if (requestId) {
      logEntry.requestId = requestId;
    }
    
    logEntry.duration = duration;
    this.addToBuffer(logEntry);
    
    // Track API performance
    this.trackPerformance(`api_${method}_${endpoint}`, duration, { statusCode });
    
    return logEntry.id;
  }

  // Security event logging
  logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', details: any) {
    const level: LogLevel = severity === 'critical' ? 'fatal' : severity === 'high' ? 'error' : 'warn';
    
    const logEntry = this.createBaseLogEntry(level, 'security', `Security event: ${event}`, {
      event,
      severity,
      details
    });
    
    this.addToBuffer(logEntry);
    
    // Track as business event
    this.trackBusinessEvent(`security_${event}`, 'security', details, severity);
    
    // Immediately flush critical security events
    if (severity === 'critical') {
      this.flush();
    }
    
    return logEntry.id;
  }

  private addToBuffer(logEntry: LogEntry) {
    this.logBuffer.push(logEntry);
    
    if (this.logBuffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }

  // Flush methods
  private async flush() {
    if (this.logBuffer.length === 0) return;
    
    try {
      // In a real implementation, you might want to send these to your logging service
      // For now, we'll store critical logs in the database
      const criticalLogs = this.logBuffer.filter(log => 
        log.level === 'error' || log.level === 'fatal'
      );
      
      for (const log of criticalLogs) {
        await logError(
          log.category, 
          log.message, 
          { ...log.data, logId: log.id, sessionId: log.sessionId }, 
          'enhanced-logger'
        );
      }
      
      this.logBuffer = [];
    } catch (error) {
      console.error('Failed to flush logs:', error);
    }
    
    // Also flush performance metrics and business events
    this.flushPerformanceMetrics();
    this.flushBusinessEvents();
  }

  private async flushPerformanceMetrics() {
    if (this.performanceBuffer.length === 0) return;
    
    try {
      // Store performance metrics (you might want to send to analytics service)
      console.log('Performance metrics:', this.performanceBuffer);
      this.performanceBuffer = [];
    } catch (error) {
      console.error('Failed to flush performance metrics:', error);
    }
  }

  private async flushBusinessEvents() {
    if (this.businessEventBuffer.length === 0) return;
    
    try {
      // Store business events (you might want to send to analytics service)
      console.log('Business events:', this.businessEventBuffer);
      this.businessEventBuffer = [];
    } catch (error) {
      console.error('Failed to flush business events:', error);
    }
  }

  // Utility methods
  getSessionId() {
    return this.sessionId;
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  getLogBuffer() {
    return [...this.logBuffer];
  }

  getPerformanceBuffer() {
    return [...this.performanceBuffer];
  }

  getBusinessEventBuffer() {
    return [...this.businessEventBuffer];
  }
}

// Create singleton instance
export const logger = new EnhancedLogger();

// Convenience functions
export const logTrace = (category: LogCategory, message: string, data?: any) => 
  logger.trace(category, message, data);

export const logDebug = (category: LogCategory, message: string, data?: any) => 
  logger.debug(category, message, data);

export const logInfo = (category: LogCategory, message: string, data?: any) => 
  logger.info(category, message, data);

export const logWarn = (category: LogCategory, message: string, data?: any) => 
  logger.warn(category, message, data);

export const logError = (category: LogCategory, message: string, data?: any, error?: Error) => 
  logger.error(category, message, data, error);

export const logFatal = (category: LogCategory, message: string, data?: any, error?: Error) => 
  logger.fatal(category, message, data, error);

export const trackPerformance = (name: string, value: number, metadata?: any) => 
  logger.trackPerformance(name, value, metadata);

export const trackBusinessEvent = (event: string, category: LogCategory, data: any, impact?: BusinessEvent['impact']) => 
  logger.trackBusinessEvent(event, category, data, impact);

export const logDatabaseOperation = (operation: string, table: string, success: boolean, duration?: number, error?: Error) => 
  logger.logDatabaseOperation(operation, table, success, duration, error);

export const logApiRequest = (method: string, endpoint: string, statusCode: number, duration: number, requestId?: string) => 
  logger.logApiRequest(method, endpoint, statusCode, duration, requestId);

export const logSecurityEvent = (event: string, severity: 'low' | 'medium' | 'high' | 'critical', details: any) => 
  logger.logSecurityEvent(event, severity, details);

// Performance measurement utilities
export function measureAsync<T>(
  fn: () => Promise<T>,
  name: string,
  category: LogCategory = 'performance'
): Promise<T> {
  const startTime = performance.now();
  
  return fn().then(
    (result) => {
      const duration = performance.now() - startTime;
      trackPerformance(name, duration, { success: true });
      logInfo(category, `${name} completed`, { duration, success: true });
      return result;
    },
    (error) => {
      const duration = performance.now() - startTime;
      trackPerformance(name, duration, { success: false });
      logError(category, `${name} failed`, { duration, success: false }, error);
      throw error;
    }
  );
}

export function measureSync<T>(
  fn: () => T,
  name: string,
  category: LogCategory = 'performance'
): T {
  const startTime = performance.now();
  
  try {
    const result = fn();
    const duration = performance.now() - startTime;
    trackPerformance(name, duration, { success: true });
    logInfo(category, `${name} completed`, { duration, success: true });
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    trackPerformance(name, duration, { success: false });
    logError(category, `${name} failed`, { duration, success: false }, error as Error);
    throw error;
  }
}