import { getSupabaseClient } from './supabaseClient.ts';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ErrorLogEntry {
  id?: string;
  timestamp: string;
  service: string;
  function_name: string;
  error_code: string;
  error_message: string;
  severity: ErrorSeverity;
  stack_trace?: string;
  context?: Record<string, any>;
  user_id?: string;
  request_id?: string;
  environment: string;
}

export class ErrorLogger {
  private static instance: ErrorLogger;
  private supabase = getSupabaseClient();
  private environment = Deno.env.get('ENVIRONMENT') || 'development';

  private constructor() {}

  public static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  public async logError({
    service,
    function_name,
    error,
    severity = 'medium',
    context = {},
    user_id,
    request_id,
  }: {
    service: string;
    function_name: string;
    error: Error | string;
    severity?: ErrorSeverity;
    context?: Record<string, any>;
    user_id?: string;
    request_id?: string;
  }): Promise<void> {
    try {
      const errorMessage = typeof error === 'string' ? error : error.message;
      const stackTrace = error instanceof Error ? error.stack : undefined;
      const errorCode = this.determineErrorCode(error);

      const logEntry: ErrorLogEntry = {
        timestamp: new Date().toISOString(),
        service,
        function_name,
        error_code: errorCode,
        error_message: errorMessage,
        severity,
        stack_trace: stackTrace,
        context,
        user_id,
        request_id,
        environment: this.environment,
      };

      // Log to Supabase
      const { error: dbError } = await this.supabase
        .from('error_logs')
        .insert(logEntry);

      if (dbError) {
        console.error('Failed to log error to database:', dbError);
      }

      // Log to console with appropriate level
      this.consoleLog(severity, logEntry);

      // For critical errors, implement additional notification logic here
      if (severity === 'critical') {
        await this.handleCriticalError(logEntry);
      }
    } catch (loggingError) {
      console.error('Error while logging error:', loggingError);
    }
  }

  private determineErrorCode(error: Error | string): string {
    if (typeof error === 'string') {
      return 'UNKNOWN_ERROR';
    }

    // Map common error types to error codes
    const errorMap: Record<string, string> = {
      'ValidationError': 'VALIDATION_ERROR',
      'NotFoundError': 'NOT_FOUND',
      'AuthenticationError': 'AUTH_ERROR',
      'AuthorizationError': 'FORBIDDEN',
      'DatabaseError': 'DB_ERROR',
      'NetworkError': 'NETWORK_ERROR',
      'TimeoutError': 'TIMEOUT',
    };

    const errorName = error.name || 'Error';
    return errorMap[errorName] || 'UNKNOWN_ERROR';
  }

  private consoleLog(severity: ErrorSeverity, logEntry: ErrorLogEntry): void {
    const logMessage = {
      timestamp: logEntry.timestamp,
      service: logEntry.service,
      function: logEntry.function_name,
      error: logEntry.error_message,
      code: logEntry.error_code,
      context: logEntry.context,
    };

    switch (severity) {
      case 'critical':
        console.error('🔴 CRITICAL ERROR:', logMessage);
        break;
      case 'high':
        console.error('🔴 HIGH SEVERITY ERROR:', logMessage);
        break;
      case 'medium':
        console.warn('🟡 MEDIUM SEVERITY ERROR:', logMessage);
        break;
      case 'low':
        console.info('🔵 LOW SEVERITY ERROR:', logMessage);
        break;
    }
  }

  private async handleCriticalError(logEntry: ErrorLogEntry): Promise<void> {
    // Implement critical error handling logic here
    // This could include:
    // - Sending notifications to administrators
    // - Triggering alerts
    // - Creating incident reports
    // - Notifying monitoring services

    try {
      // Example: Create an incident report
      await this.supabase
        .from('incident_reports')
        .insert({
          error_log_id: logEntry.id,
          status: 'open',
          created_at: new Date().toISOString(),
          severity: 'critical',
          service: logEntry.service,
          description: `Critical error in ${logEntry.function_name}: ${logEntry.error_message}`,
        });

      // TODO: Implement additional notification logic
      // - Email notifications
      // - Slack/Teams notifications
      // - SMS alerts
      // - etc.
    } catch (error) {
      console.error('Failed to handle critical error:', error);
    }
  }

  public async getErrorStats(timeframe: 'day' | 'week' | 'month' = 'day'): Promise<any> {
    const startDate = new Date();
    switch (timeframe) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    const { data, error } = await this.supabase
      .from('error_logs')
      .select('*')
      .gte('timestamp', startDate.toISOString());

    if (error) {
      console.error('Failed to fetch error stats:', error);
      return null;
    }

    return this.aggregateErrorStats(data);
  }

  private aggregateErrorStats(data: ErrorLogEntry[]): any {
    const stats = {
      total: data.length,
      bySeverity: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      },
      byService: {},
      byErrorCode: {},
      recentErrors: data.slice(-5), // Last 5 errors
    };

    data.forEach(entry => {
      // Count by severity
      stats.bySeverity[entry.severity]++;

      // Count by service
      stats.byService[entry.service] = (stats.byService[entry.service] || 0) + 1;

      // Count by error code
      stats.byErrorCode[entry.error_code] = (stats.byErrorCode[entry.error_code] || 0) + 1;
    });

    return stats;
  }
} 