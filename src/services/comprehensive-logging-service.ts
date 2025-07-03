/**
 * نظام التسجيل الشامل - خدمة مركزية لتسجيل جميع الأحداث والأخطاء
 * Comprehensive Logging Service - Central service for all events and errors
 */

import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// أنواع مستويات التسجيل
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

// أنواع الأحداث
export type EventType = 
  | 'user_action'           // إجراء المستخدم
  | 'system_operation'      // عملية النظام
  | 'database_operation'    // عملية قاعدة البيانات
  | 'api_call'              // استدعاء API
  | 'authentication'        // المصادقة
  | 'payment'               // المدفوعات
  | 'maintenance'           // الصيانة
  | 'legal'                 // القانونية
  | 'notification'          // الإشعارات
  | 'reporting'             // التقارير
  | 'security'              // الأمان
  | 'performance'           // الأداء
  | 'error'                 // الأخطاء
  | 'audit';                // المراجعة

// أنواع الكيانات
export type EntityType = 
  | 'customer'
  | 'vehicle'
  | 'agreement'
  | 'payment'
  | 'maintenance'
  | 'user'
  | 'system'
  | 'report'
  | 'notification'
  | 'legal_case';

// واجهة إدخال السجل
export interface LogEntry {
  id?: string;
  timestamp?: string;
  level: LogLevel;
  event_type: EventType;
  entity_type?: EntityType;
  entity_id?: string;
  user_id?: string;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
  component?: string;
  operation?: string;
  message: string;
  details?: Record<string, any>;
  metadata?: Record<string, any>;
  error_code?: string;
  error_stack?: string;
  request_id?: string;
  duration_ms?: number;
  status?: 'success' | 'warning' | 'error';
  source?: string;
  environment?: string;
  tags?: string[];
}

// واجهة إحصائيات التسجيل
export interface LogStatistics {
  total_logs: number;
  logs_by_level: Record<LogLevel, number>;
  logs_by_event_type: Record<EventType, number>;
  logs_by_entity_type: Record<EntityType, number>;
  recent_errors: LogEntry[];
  top_errors: Array<{
    message: string;
    count: number;
    last_occurrence: string;
  }>;
  performance_metrics: {
    avg_response_time: number;
    slowest_operations: Array<{
      operation: string;
      avg_duration: number;
      count: number;
    }>;
  };
}

// واجهة تكوين التسجيل
export interface LoggingConfig {
  enabled: boolean;
  console_logging: boolean;
  database_logging: boolean;
  min_level: LogLevel;
  max_entries: number;
  retention_days: number;
  buffer_size: number;
  batch_write: boolean;
  enable_performance_tracking: boolean;
  enable_error_aggregation: boolean;
  enable_real_time_alerts: boolean;
  alert_thresholds: {
    error_rate: number;
    critical_errors: number;
    performance_degradation: number;
  };
}

class ComprehensiveLoggingService {
  private static instance: ComprehensiveLoggingService;
  private config: LoggingConfig;
  private logBuffer: LogEntry[] = [];
  private isBufferFlushing = false;
  private performanceTracking = new Map<string, number[]>();
  private errorAggregation = new Map<string, { count: number; last_occurrence: string }>();
  private realTimeMetrics = {
    total_logs: 0,
    error_rate: 0,
    avg_response_time: 0,
    active_sessions: new Set<string>()
  };

  private constructor(config?: Partial<LoggingConfig>) {
    this.config = {
      enabled: true,
      console_logging: true,
      database_logging: true,
      min_level: 'info',
      max_entries: 10000,
      retention_days: 30,
      buffer_size: 100,
      batch_write: true,
      enable_performance_tracking: true,
      enable_error_aggregation: true,
      enable_real_time_alerts: true,
      alert_thresholds: {
        error_rate: 0.1, // 10%
        critical_errors: 5,
        performance_degradation: 1000 // ms
      },
      ...config
    };

    this.initializeService();
  }

  static getInstance(config?: Partial<LoggingConfig>): ComprehensiveLoggingService {
    if (!ComprehensiveLoggingService.instance) {
      ComprehensiveLoggingService.instance = new ComprehensiveLoggingService(config);
    }
    return ComprehensiveLoggingService.instance;
  }

  private initializeService(): void {
    // إعداد التنظيف الدوري للسجلات
    setInterval(() => {
      this.cleanupOldLogs();
    }, 24 * 60 * 60 * 1000); // مرة واحدة يومياً

    // إعداد تدفق البيانات من المخزن المؤقت
    setInterval(() => {
      this.flushBuffer();
    }, 30 * 1000); // كل 30 ثانية

    // إعداد حساب المقاييس الفورية
    setInterval(() => {
      this.calculateRealTimeMetrics();
    }, 60 * 1000); // كل دقيقة
  }

  /**
   * تسجيل حدث
   */
  public async log(entry: LogEntry): Promise<void> {
    if (!this.config.enabled) return;

    // التحقق من مستوى التسجيل
    if (!this.shouldLog(entry.level)) return;

    // إضافة البيانات الأساسية
    const fullEntry: LogEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      environment: import.meta.env.MODE || 'development',
      session_id: this.generateSessionId(),
      request_id: this.generateRequestId(),
      ...entry
    };

    // تسجيل في وحدة التحكم
    if (this.config.console_logging) {
      this.logToConsole(fullEntry);
    }

    // إضافة إلى المخزن المؤقت
    if (this.config.database_logging) {
      this.addToBuffer(fullEntry);
    }

    // تتبع الأداء
    if (this.config.enable_performance_tracking && fullEntry.duration_ms) {
      this.trackPerformance(fullEntry.operation || 'unknown', fullEntry.duration_ms);
    }

    // تجميع الأخطاء
    if (this.config.enable_error_aggregation && fullEntry.level === 'error') {
      this.aggregateError(fullEntry.message);
    }

    // تحديث المقاييس الفورية
    this.updateRealTimeMetrics(fullEntry);

    // التحقق من التنبيهات
    if (this.config.enable_real_time_alerts) {
      this.checkAlerts(fullEntry);
    }
  }

  /**
   * تسجيل معلومات
   */
  public async info(message: string, details?: Record<string, any>, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      level: 'info',
      event_type: 'system_operation',
      message,
      details,
      metadata
    });
  }

  /**
   * تسجيل تحذير
   */
  public async warn(message: string, details?: Record<string, any>, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      level: 'warn',
      event_type: 'system_operation',
      message,
      details,
      metadata
    });
  }

  /**
   * تسجيل خطأ
   */
  public async error(message: string, error?: Error, details?: Record<string, any>, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      level: 'error',
      event_type: 'error',
      message,
      details: {
        ...details,
        error: error?.message,
        stack: error?.stack
      },
      metadata,
      error_stack: error?.stack
    });
  }

  /**
   * تسجيل خطأ حرج
   */
  public async critical(message: string, error?: Error, details?: Record<string, any>, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      level: 'critical',
      event_type: 'error',
      message,
      details: {
        ...details,
        error: error?.message,
        stack: error?.stack
      },
      metadata,
      error_stack: error?.stack
    });
  }

  /**
   * تسجيل إجراء المستخدم
   */
  public async logUserAction(
    action: string,
    user_id: string,
    entity_type?: EntityType,
    entity_id?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      level: 'info',
      event_type: 'user_action',
      entity_type,
      entity_id,
      user_id,
      message: `User action: ${action}`,
      operation: action,
      details
    });
  }

  /**
   * تسجيل عملية قاعدة البيانات
   */
  public async logDatabaseOperation(
    operation: string,
    table: string,
    duration_ms: number,
    success: boolean,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      level: success ? 'info' : 'error',
      event_type: 'database_operation',
      message: `Database ${operation} on ${table}`,
      operation: `${operation}_${table}`,
      duration_ms,
      status: success ? 'success' : 'error',
      details
    });
  }

  /**
   * تسجيل استدعاء API
   */
  public async logApiCall(
    method: string,
    endpoint: string,
    status_code: number,
    duration_ms: number,
    user_id?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      level: status_code >= 400 ? 'error' : 'info',
      event_type: 'api_call',
      user_id,
      message: `API ${method} ${endpoint}`,
      operation: `${method}_${endpoint}`,
      duration_ms,
      details: {
        ...details,
        method,
        endpoint,
        status_code
      }
    });
  }

  /**
   * الحصول على السجلات مع فلاتر
   */
  public async getLogs(filters: {
    level?: LogLevel;
    event_type?: EventType;
    entity_type?: EntityType;
    entity_id?: string;
    user_id?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<LogEntry[]> {
    try {
      let query = supabase
        .from('system_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      // تطبيق الفلاتر
      if (filters.level) {
        query = query.eq('level', filters.level);
      }
      if (filters.event_type) {
        query = query.eq('event_type', filters.event_type);
      }
      if (filters.entity_type) {
        query = query.eq('entity_type', filters.entity_type);
      }
      if (filters.entity_id) {
        query = query.eq('entity_id', filters.entity_id);
      }
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      if (filters.start_date) {
        query = query.gte('timestamp', filters.start_date);
      }
      if (filters.end_date) {
        query = query.lte('timestamp', filters.end_date);
      }

      // تحديد العدد والإزاحة
      const limit = filters.limit || 100;
      const offset = filters.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getLogs:', error);
      return [];
    }
  }

  /**
   * الحصول على إحصائيات التسجيل
   */
  public async getStatistics(): Promise<LogStatistics> {
    try {
      // احصائيات أساسية
      const { data: totalLogs, error: totalError } = await supabase
        .from('system_logs')
        .select('level, event_type, entity_type, duration_ms')
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (totalError) {
        console.error('Error fetching statistics:', totalError);
        return this.getDefaultStatistics();
      }

      // تجميع الاحصائيات
      const logs_by_level = this.groupByField(totalLogs || [], 'level');
      const logs_by_event_type = this.groupByField(totalLogs || [], 'event_type');
      const logs_by_entity_type = this.groupByField(totalLogs || [], 'entity_type');

      // الأخطاء الأخيرة
      const { data: recentErrors } = await supabase
        .from('system_logs')
        .select('*')
        .eq('level', 'error')
        .order('timestamp', { ascending: false })
        .limit(10);

      // أبطأ العمليات
      const slowestOperations = this.calculateSlowestOperations(totalLogs || []);

      return {
        total_logs: totalLogs?.length || 0,
        logs_by_level,
        logs_by_event_type,
        logs_by_entity_type,
        recent_errors: recentErrors || [],
        top_errors: Array.from(this.errorAggregation.entries()).map(([message, data]) => ({
          message,
          count: data.count,
          last_occurrence: data.last_occurrence
        })),
        performance_metrics: {
          avg_response_time: this.calculateAverageResponseTime(totalLogs || []),
          slowest_operations: slowestOperations
        }
      };
    } catch (error) {
      console.error('Error getting statistics:', error);
      return this.getDefaultStatistics();
    }
  }

  /**
   * تصدير السجلات
   */
  public async exportLogs(format: 'json' | 'csv' = 'json', filters?: any): Promise<string> {
    const logs = await this.getLogs(filters);
    
    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    } else {
      // تحويل إلى CSV
      const headers = ['timestamp', 'level', 'event_type', 'message', 'user_id', 'entity_type', 'entity_id'];
      const csvRows = [headers.join(',')];
      
      logs.forEach(log => {
        const row = headers.map(header => {
          const value = log[header as keyof LogEntry];
          return typeof value === 'string' ? `"${value}"` : value;
        });
        csvRows.push(row.join(','));
      });
      
      return csvRows.join('\n');
    }
  }

  /**
   * إعداد التنبيهات
   */
  public async setupAlert(config: {
    name: string;
    condition: {
      level?: LogLevel;
      event_type?: EventType;
      message_pattern?: string;
      threshold?: number;
      timeframe_minutes?: number;
    };
    actions: {
      email?: string[];
      webhook?: string;
      console?: boolean;
    };
  }): Promise<void> {
    // تنفيذ منطق التنبيهات
    console.log('Setting up alert:', config);
  }

  // الدوال المساعدة الخاصة
  private shouldLog(level: LogLevel): boolean {
    const levels = ['debug', 'info', 'warn', 'error', 'critical'];
    const minLevelIndex = levels.indexOf(this.config.min_level);
    const currentLevelIndex = levels.indexOf(level);
    return currentLevelIndex >= minLevelIndex;
  }

  private logToConsole(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp!).toLocaleString('ar-QA');
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.event_type}]`;
    
    switch (entry.level) {
      case 'critical':
        console.error(`🔴 ${prefix}`, entry.message, entry.details);
        break;
      case 'error':
        console.error(`🚨 ${prefix}`, entry.message, entry.details);
        break;
      case 'warn':
        console.warn(`⚠️ ${prefix}`, entry.message, entry.details);
        break;
      case 'info':
        console.info(`ℹ️ ${prefix}`, entry.message, entry.details);
        break;
      case 'debug':
        console.debug(`🐛 ${prefix}`, entry.message, entry.details);
        break;
    }
  }

  private addToBuffer(entry: LogEntry): void {
    this.logBuffer.push(entry);
    
    if (this.logBuffer.length >= this.config.buffer_size && !this.isBufferFlushing) {
      this.flushBuffer();
    }
  }

  private async flushBuffer(): Promise<void> {
    if (this.logBuffer.length === 0 || this.isBufferFlushing) return;

    this.isBufferFlushing = true;
    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];

    try {
      const { error } = await supabase
        .from('system_logs')
        .insert(logsToFlush);

      if (error) {
        console.error('Error flushing logs to database:', error);
        // إعادة إدراج السجلات في المخزن المؤقت
        this.logBuffer.unshift(...logsToFlush);
      }
    } catch (error) {
      console.error('Error in flushBuffer:', error);
      this.logBuffer.unshift(...logsToFlush);
    } finally {
      this.isBufferFlushing = false;
    }
  }

  private trackPerformance(operation: string, duration: number): void {
    if (!this.performanceTracking.has(operation)) {
      this.performanceTracking.set(operation, []);
    }
    
    const durations = this.performanceTracking.get(operation)!;
    durations.push(duration);
    
    // الاحتفاظ بآخر 100 قياس فقط
    if (durations.length > 100) {
      durations.shift();
    }
  }

  private aggregateError(message: string): void {
    if (!this.errorAggregation.has(message)) {
      this.errorAggregation.set(message, { count: 0, last_occurrence: '' });
    }
    
    const errorData = this.errorAggregation.get(message)!;
    errorData.count++;
    errorData.last_occurrence = new Date().toISOString();
  }

  private updateRealTimeMetrics(entry: LogEntry): void {
    this.realTimeMetrics.total_logs++;
    
    if (entry.level === 'error' || entry.level === 'critical') {
      this.realTimeMetrics.error_rate = 
        (this.realTimeMetrics.error_rate * (this.realTimeMetrics.total_logs - 1) + 1) / 
        this.realTimeMetrics.total_logs;
    }
    
    if (entry.duration_ms) {
      this.realTimeMetrics.avg_response_time = 
        (this.realTimeMetrics.avg_response_time * (this.realTimeMetrics.total_logs - 1) + entry.duration_ms) / 
        this.realTimeMetrics.total_logs;
    }
    
    if (entry.session_id) {
      this.realTimeMetrics.active_sessions.add(entry.session_id);
    }
  }

  private checkAlerts(entry: LogEntry): void {
    // التحقق من معدل الأخطاء
    if (this.realTimeMetrics.error_rate > this.config.alert_thresholds.error_rate) {
      this.triggerAlert('high_error_rate', `Error rate exceeded threshold: ${this.realTimeMetrics.error_rate}`);
    }
    
    // التحقق من تدهور الأداء
    if (entry.duration_ms && entry.duration_ms > this.config.alert_thresholds.performance_degradation) {
      this.triggerAlert('performance_degradation', `Slow operation detected: ${entry.operation} took ${entry.duration_ms}ms`);
    }
    
    // التحقق من الأخطاء الحرجة
    if (entry.level === 'critical') {
      this.triggerAlert('critical_error', `Critical error: ${entry.message}`);
    }
  }

  private triggerAlert(type: string, message: string): void {
    console.error(`🚨 ALERT [${type}]: ${message}`);
    // يمكن إضافة منطق إضافي هنا لإرسال تنبيهات عبر البريد الإلكتروني أو الرسائل القصيرة
  }

  private calculateRealTimeMetrics(): void {
    // حساب المقاييس الفورية
    // تنظيف الجلسات غير النشطة
    // هذا مجرد مثال - سيتم تحسينه بناءً على الاحتياجات الفعلية
  }

  private async cleanupOldLogs(): Promise<void> {
    const cutoffDate = new Date(Date.now() - this.config.retention_days * 24 * 60 * 60 * 1000);
    
    try {
      const { error } = await supabase
        .from('system_logs')
        .delete()
        .lt('timestamp', cutoffDate.toISOString());

      if (error) {
        console.error('Error cleaning up old logs:', error);
      }
    } catch (error) {
      console.error('Error in cleanupOldLogs:', error);
    }
  }

  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private generateRequestId(): string {
    return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private groupByField(logs: any[], field: string): Record<string, number> {
    return logs.reduce((acc, log) => {
      const value = log[field] || 'unknown';
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  private calculateSlowestOperations(logs: any[]): Array<{ operation: string; avg_duration: number; count: number }> {
    const operations = logs.filter(log => log.duration_ms).reduce((acc, log) => {
      const op = log.operation || 'unknown';
      if (!acc[op]) {
        acc[op] = { total: 0, count: 0 };
      }
      acc[op].total += log.duration_ms;
      acc[op].count++;
      return acc;
    }, {});

    return Object.entries(operations)
      .map(([operation, data]: [string, any]) => ({
        operation,
        avg_duration: Math.round(data.total / data.count),
        count: data.count
      }))
      .sort((a, b) => b.avg_duration - a.avg_duration)
      .slice(0, 10);
  }

  private calculateAverageResponseTime(logs: any[]): number {
    const logsWithDuration = logs.filter(log => log.duration_ms);
    if (logsWithDuration.length === 0) return 0;
    
    const total = logsWithDuration.reduce((sum, log) => sum + log.duration_ms, 0);
    return Math.round(total / logsWithDuration.length);
  }

  private getDefaultStatistics(): LogStatistics {
    return {
      total_logs: 0,
      logs_by_level: {
        debug: 0,
        info: 0,
        warn: 0,
        error: 0,
        critical: 0
      } as Record<LogLevel, number>,
      logs_by_event_type: {
        user_action: 0,
        system_operation: 0,
        database_operation: 0,
        api_call: 0,
        authentication: 0,
        payment: 0,
        maintenance: 0,
        legal: 0,
        notification: 0,
        reporting: 0,
        security: 0,
        performance: 0,
        error: 0,
        audit: 0
      } as Record<EventType, number>,
      logs_by_entity_type: {
        customer: 0,
        vehicle: 0,
        agreement: 0,
        payment: 0,
        maintenance: 0,
        user: 0,
        system: 0,
        report: 0,
        notification: 0,
        legal_case: 0
      } as Record<EntityType, number>,
      recent_errors: [],
      top_errors: [],
      performance_metrics: {
        avg_response_time: 0,
        slowest_operations: []
      }
    };
  }
}

// تصدير المثيل الوحيد
export const comprehensiveLogger = ComprehensiveLoggingService.getInstance();

// دوال مساعدة سريعة
export const logInfo = (message: string, details?: Record<string, any>) => 
  comprehensiveLogger.info(message, details);

export const logWarn = (message: string, details?: Record<string, any>) => 
  comprehensiveLogger.warn(message, details);

export const logError = (message: string, error?: Error, details?: Record<string, any>) => 
  comprehensiveLogger.error(message, error, details);

export const logCritical = (message: string, error?: Error, details?: Record<string, any>) => 
  comprehensiveLogger.critical(message, error, details);

export const logUserAction = (action: string, user_id: string, entity_type?: EntityType, entity_id?: string, details?: Record<string, any>) => 
  comprehensiveLogger.logUserAction(action, user_id, entity_type, entity_id, details);

export const logDatabaseOperation = (operation: string, table: string, duration_ms: number, success: boolean, details?: Record<string, any>) => 
  comprehensiveLogger.logDatabaseOperation(operation, table, duration_ms, success, details);

export const logApiCall = (method: string, endpoint: string, status_code: number, duration_ms: number, user_id?: string, details?: Record<string, any>) => 
  comprehensiveLogger.logApiCall(method, endpoint, status_code, duration_ms, user_id, details);

export default comprehensiveLogger; 