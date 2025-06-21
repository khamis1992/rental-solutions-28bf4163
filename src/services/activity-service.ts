import { supabase } from '@/integrations/supabase/client';

export interface SystemActivity {
  id: string;
  type: 'customer' | 'agreement' | 'vehicle' | 'payment' | 'maintenance' | 'legal' | 'financial' | 'admin' | 'system';
  action: string;
  description: string;
  entity_type: string;
  entity_id?: string;
  user_name?: string;
  user_role?: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error' | 'success';
}

export class ActivityService {
  static async getSystemActivities(limit: number = 50): Promise<SystemActivity[]> {
    try {
      const activities: SystemActivity[] = [];

      // Fetch audit logs
      const { data: auditLogs, error: auditError } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!auditError && auditLogs) {
        auditLogs.forEach(log => {
          activities.push({
            id: log.id,
            type: this.mapEntityTypeToActivityType(log.entity_type),
            action: log.action,
            description: log.description || `${log.action} على ${log.entity_type}`,
            entity_type: log.entity_type,
            entity_id: log.entity_id,
            user_name: log.performed_by || 'النظام',
            user_role: 'مستخدم',
            timestamp: log.created_at,
            severity: this.mapActionToSeverity(log.action)
          });
        });
      }

      // Fetch payment audit logs
      const { data: paymentLogs, error: paymentError } = await supabase
        .from('payment_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(15);

      if (!paymentError && paymentLogs) {
        paymentLogs.forEach(log => {
          activities.push({
            id: log.id,
            type: 'payment',
            action: log.action,
            description: `عملية دفع: ${log.action}`,
            entity_type: 'payment',
            entity_id: log.payment_id,
            user_name: log.performed_by || 'النظام',
            user_role: 'محاسب',
            timestamp: log.created_at,
            severity: log.action.includes('fail') ? 'error' : 'success'
          });
        });
      }

      // Fetch analytics events
      const { data: analyticsEvents, error: analyticsError } = await supabase
        .from('analytics_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!analyticsError && analyticsEvents) {
        analyticsEvents.forEach(event => {
          activities.push({
            id: event.id,
            type: 'system',
            action: event.event_type,
            description: `حدث نظام: ${event.event_type}`,
            entity_type: 'analytics',
            entity_id: event.id,
            user_name: 'النظام',
            user_role: 'تحليلات',
            timestamp: event.created_at,
            severity: 'info'
          });
        });
      }

      // Fetch error logs
      const { data: errorLogs, error: errorLogsError } = await supabase
        .from('error_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(5);

      if (!errorLogsError && errorLogs) {
        errorLogs.forEach(error => {
          activities.push({
            id: error.id,
            type: 'system',
            action: 'error_occurred',
            description: `خطأ في النظام: ${error.error_message}`,
            entity_type: 'error',
            entity_id: error.id,
            user_name: 'النظام',
            user_role: 'مراقب',
            timestamp: error.timestamp,
            severity: this.mapErrorSeverityToActivitySeverity(error.severity)
          });
        });
      }

      // Sort all activities by timestamp (newest first) and limit
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      return activities.slice(0, limit);

    } catch (error) {
      console.error('Error fetching system activities:', error);
      throw error;
    }
  }

  static async getActivityStats() {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      // Get today's activities count
      const { count: auditCount } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfDay.toISOString());

      const { count: paymentCount } = await supabase
        .from('payment_audit_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfDay.toISOString());

      const { count: errorCount } = await supabase
        .from('error_logs')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', startOfDay.toISOString())
        .in('severity', ['high', 'critical']);

      // Get unique users active today
      const { data: activeUsers } = await supabase
        .from('audit_logs')
        .select('performed_by')
        .gte('created_at', startOfDay.toISOString())
        .not('performed_by', 'is', null);

      const uniqueUsers = new Set(activeUsers?.map(u => u.performed_by) || []);

      return {
        totalToday: (auditCount || 0) + (paymentCount || 0),
        errorsAndWarnings: errorCount || 0,
        activeUsers: uniqueUsers.size
      };

    } catch (error) {
      console.error('Error fetching activity stats:', error);
      return {
        totalToday: 0,
        errorsAndWarnings: 0,
        activeUsers: 0
      };
    }
  }

  private static mapEntityTypeToActivityType(entityType: string): SystemActivity['type'] {
    const typeMapping: Record<string, SystemActivity['type']> = {
      'customer': 'customer',
      'agreement': 'agreement',
      'vehicle': 'vehicle',
      'payment': 'payment',
      'maintenance': 'maintenance',
      'legal': 'legal',
      'financial': 'financial',
      'user': 'admin',
      'system': 'system'
    };
    
    return typeMapping[entityType] || 'system';
  }

  private static mapActionToSeverity(action: string): SystemActivity['severity'] {
    if (action.includes('delete') || action.includes('terminate') || action.includes('cancel')) {
      return 'warning';
    }
    if (action.includes('create') || action.includes('add') || action.includes('complete')) {
      return 'success';
    }
    if (action.includes('error') || action.includes('fail')) {
      return 'error';
    }
    return 'info';
  }

  private static mapErrorSeverityToActivitySeverity(errorSeverity: string): SystemActivity['severity'] {
    const severityMapping: Record<string, SystemActivity['severity']> = {
      'low': 'info',
      'medium': 'warning',
      'high': 'error',
      'critical': 'error'
    };
    
    return severityMapping[errorSeverity] || 'info';
  }
} 