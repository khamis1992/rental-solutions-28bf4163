import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface SecurityEvent {
  id: string;
  event_type: 'login' | 'logout' | 'data_access' | 'data_modification' | 'suspicious_activity';
  user_id: string;
  ip_address: string;
  user_agent: string;
  details: Record<string, any>;
  timestamp: Date;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
}

export interface SecurityPolicy {
  max_login_attempts: number;
  session_timeout: number;
  require_2fa: boolean;
  password_policy: {
    min_length: number;
    require_uppercase: boolean;
    require_lowercase: boolean;
    require_numbers: boolean;
    require_symbols: boolean;
  };
  ip_whitelist: string[];
  data_retention_days: number;
}

export class SecurityManager {
  private static instance: SecurityManager;
  private securityPolicy: SecurityPolicy = {
    max_login_attempts: 5,
    session_timeout: 8 * 60 * 60 * 1000, // 8 hours
    require_2fa: false,
    password_policy: {
      min_length: 8,
      require_uppercase: true,
      require_lowercase: true,
      require_numbers: true,
      require_symbols: false
    },
    ip_whitelist: [],
    data_retention_days: 365
  };

  private constructor() {}

  public static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  // Log security events
  async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('security_events')
        .insert({
          event_type: event.event_type,
          user_id: event.user_id,
          ip_address: event.ip_address,
          user_agent: event.user_agent,
          details: event.details,
          risk_level: event.risk_level,
          timestamp: new Date().toISOString()
        });

      if (error) throw error;

      // Alert for high/critical risk events
      if (event.risk_level === 'high' || event.risk_level === 'critical') {
        await this.sendSecurityAlert(event);
      }
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  // Validate session and check for suspicious activity
  async validateSession(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return false;
      }

      // Check session timeout
      const sessionAge = Date.now() - new Date(session.expires_at || Date.now()).getTime();
      if (sessionAge > this.securityPolicy.session_timeout) {
        await this.logSecurityEvent({
          event_type: 'logout',
          user_id: session.user.id,
          ip_address: await this.getClientIP(),
          user_agent: navigator.userAgent,
          details: { reason: 'session_timeout' },
          risk_level: 'low'
        });
        
        await supabase.auth.signOut();
        return false;
      }

      // Check for suspicious activity patterns
      await this.checkSuspiciousActivity(session.user.id);

      return true;
    } catch (error) {
      console.error('Session validation failed:', error);
      return false;
    }
  }

  // Check for suspicious activity patterns
  private async checkSuspiciousActivity(userId: string): Promise<void> {
    try {
      const { data: recentEvents } = await supabase
        .from('security_events')
        .select('*')
        .eq('user_id', userId)
        .gte('timestamp', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
        .order('timestamp', { ascending: false });

      if (recentEvents && recentEvents.length > 50) {
        await this.logSecurityEvent({
          event_type: 'suspicious_activity',
          user_id: userId,
          ip_address: await this.getClientIP(),
          user_agent: navigator.userAgent,
          details: { reason: 'excessive_activity', count: recentEvents.length },
          risk_level: 'high'
        });
      }
    } catch (error) {
      console.error('Suspicious activity check failed:', error);
    }
  }

  // Validate password against policy
  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const policy = this.securityPolicy.password_policy;

    if (password.length < policy.min_length) {
      errors.push(`Password must be at least ${policy.min_length} characters long`);
    }

    if (policy.require_uppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (policy.require_lowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (policy.require_numbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (policy.require_symbols && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Encrypt sensitive data
  async encryptData(data: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      
      const key = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );

      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        dataBuffer
      );

      return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
    } catch (error) {
      console.error('Data encryption failed:', error);
      throw error;
    }
  }

  // Sanitize input data
  sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/['"]/g, '') // Remove quotes
      .replace(/[;&|`]/g, '') // Remove command injection chars
      .trim();
  }

  // Get client IP address
  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('/api/get-ip');
      const data = await response.json();
      return data.ip || 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  // Send security alerts
  private async sendSecurityAlert(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      // Send to admin dashboard
      await supabase
        .from('admin_alerts')
        .insert({
          type: 'security',
          level: event.risk_level,
          message: `Security event: ${event.event_type}`,
          details: event.details,
          user_id: event.user_id,
          created_at: new Date().toISOString()
        });

      // Show toast for critical events
      if (event.risk_level === 'critical') {
        toast.error('Critical security event detected. Please contact administrator.');
      }
    } catch (error) {
      console.error('Failed to send security alert:', error);
    }
  }

  // Rate limiting
  private rateLimiter = new Map<string, number[]>();

  async checkRateLimit(identifier: string, maxRequests: number = 100, timeWindow: number = 60000): Promise<boolean> {
    const now = Date.now();
    const requests = this.rateLimiter.get(identifier) || [];
    
    // Remove old requests outside the time window
    const recentRequests = requests.filter(time => now - time < timeWindow);
    
    if (recentRequests.length >= maxRequests) {
      await this.logSecurityEvent({
        event_type: 'suspicious_activity',
        user_id: identifier,
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent,
        details: { reason: 'rate_limit_exceeded', requests: recentRequests.length },
        risk_level: 'medium'
      });
      return false;
    }

    // Add current request
    recentRequests.push(now);
    this.rateLimiter.set(identifier, recentRequests);
    
    return true;
  }

  // Data access logging
  async logDataAccess(tableName: string, action: 'read' | 'write' | 'delete', recordId?: string): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        await this.logSecurityEvent({
          event_type: 'data_access',
          user_id: session.user.id,
          ip_address: await this.getClientIP(),
          user_agent: navigator.userAgent,
          details: { table: tableName, action, record_id: recordId },
          risk_level: 'low'
        });
      }
    } catch (error) {
      console.error('Failed to log data access:', error);
    }
  }

  // Clean up old security events
  async cleanupOldEvents(): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - this.securityPolicy.data_retention_days * 24 * 60 * 60 * 1000);
      
      const { error } = await supabase
        .from('security_events')
        .delete()
        .lt('timestamp', cutoffDate.toISOString());

      if (error) throw error;
    } catch (error) {
      console.error('Failed to cleanup old security events:', error);
    }
  }
}

export const securityManager = SecurityManager.getInstance();