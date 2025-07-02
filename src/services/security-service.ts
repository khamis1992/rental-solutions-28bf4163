import { performanceAnalytics } from './performance-analytics';

export interface SecurityConfig {
  encryption: {
    algorithm: 'AES-256-GCM' | 'ChaCha20-Poly1305';
    keyRotationInterval: number; // in milliseconds
    saltRounds: number;
  };
  authentication: {
    mfaRequired: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
    passwordPolicy: PasswordPolicy;
  };
  authorization: {
    rbacEnabled: boolean;
    permissionCaching: boolean;
    roleHierarchy: boolean;
  };
  audit: {
    logLevel: 'minimal' | 'standard' | 'comprehensive';
    retentionPeriod: number; // in days
    realTimeMonitoring: boolean;
  };
  compliance: {
    gdprEnabled: boolean;
    soc2Enabled: boolean;
    iso27001Enabled: boolean;
    dataResidency: string; // country code
  };
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventReuse: number; // number of previous passwords to check
  maxAge: number; // in days
}

export interface User {
  id: string;
  email: string;
  roles: Role[];
  permissions: Permission[];
  mfaEnabled: boolean;
  lastLogin: number;
  loginAttempts: number;
  lockedUntil?: number;
  passwordLastChanged: number;
  sessionId?: string;
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    location?: string;
    deviceFingerprint?: string;
  };
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  hierarchy: number; // 0 = highest, 100 = lowest
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Permission {
  id: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'execute';
  conditions?: PermissionCondition[];
  scope: 'global' | 'organization' | 'department' | 'personal';
}

export interface PermissionCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'in' | 'not_in' | 'greater_than' | 'less_than';
  value: any;
}

export interface SecurityEvent {
  id: string;
  type: 'authentication' | 'authorization' | 'data_access' | 'system' | 'compliance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  resource?: string;
  action: string;
  timestamp: number;
  ipAddress?: string;
  userAgent?: string;
  details: any;
  riskScore: number; // 0-100
  blocked: boolean;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  timestamp: number;
  ipAddress?: string;
  userAgent?: string;
  changes?: {
    before: any;
    after: any;
  };
  metadata: any;
  complianceFlags: string[];
}

export interface ThreatDetection {
  id: string;
  type: 'brute_force' | 'suspicious_activity' | 'data_exfiltration' | 'privilege_escalation' | 'anomalous_access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  description: string;
  indicators: string[];
  timestamp: number;
  resolved: boolean;
  actions: string[];
}

export interface ComplianceReport {
  framework: 'GDPR' | 'SOC2' | 'ISO27001';
  status: 'compliant' | 'non_compliant' | 'partial';
  score: number; // 0-100
  requirements: ComplianceRequirement[];
  lastAssessment: number;
  nextAssessment: number;
  recommendations: string[];
}

export interface ComplianceRequirement {
  id: string;
  title: string;
  description: string;
  status: 'met' | 'not_met' | 'partial' | 'not_applicable';
  evidence: string[];
  lastVerified: number;
  responsible: string;
}

class SecurityService {
  private config: SecurityConfig;
  private users: Map<string, User> = new Map();
  private roles: Map<string, Role> = new Map();
  private sessions: Map<string, any> = new Map();
  private securityEvents: SecurityEvent[] = [];
  private auditLogs: AuditLog[] = [];
  private threatDetections: ThreatDetection[] = [];
  private encryptionKeys: Map<string, CryptoKey> = new Map();
  private permissionCache: Map<string, Permission[]> = new Map();

  constructor(config?: Partial<SecurityConfig>) {
    this.config = {
      encryption: {
        algorithm: 'AES-256-GCM',
        keyRotationInterval: 24 * 60 * 60 * 1000, // 24 hours
        saltRounds: 12
      },
      authentication: {
        mfaRequired: true,
        sessionTimeout: 8 * 60 * 60 * 1000, // 8 hours
        maxLoginAttempts: 5,
        lockoutDuration: 30 * 60 * 1000, // 30 minutes
        passwordPolicy: {
          minLength: 12,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true,
          preventReuse: 5,
          maxAge: 90 // days
        }
      },
      authorization: {
        rbacEnabled: true,
        permissionCaching: true,
        roleHierarchy: true
      },
      audit: {
        logLevel: 'comprehensive',
        retentionPeriod: // 2555 - removed unused variable// 7 years for compliance
        realTimeMonitoring: true
      },
      compliance: {
        gdprEnabled: true,
        soc2Enabled: true,
        iso27001Enabled: true,
        dataResidency: 'QA' // Qatar
      },
      ...config
    };

    this.initializeDefaultRoles();
    this.startSecurityMonitoring();
    this.initializeEncryption();
  }

  private initializeDefaultRoles(): void {
    // Super Admin Role
    this.roles.set('super_admin', {
      id: 'super_admin',
      name: 'Super Administrator',
      description: 'Full system access with all permissions',
      hierarchy: 0,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      permissions: [
        { id: 'all', resource: '*', action: 'execute', scope: 'global' }
      ]
    });

    // Admin Role
    this.roles.set('admin', {
      id: 'admin',
      name: 'Administrator',
      description: 'Administrative access to most system functions',
      hierarchy: 10,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      permissions: [
        { id: 'users_manage', resource: 'users', action: 'create', scope: 'organization' },
        { id: 'users_read', resource: 'users', action: 'read', scope: 'organization' },
        { id: 'users_update', resource: 'users', action: 'update', scope: 'organization' },
        { id: 'reports_all', resource: 'reports', action: 'execute', scope: 'organization' },
        { id: 'analytics_read', resource: 'analytics', action: 'read', scope: 'organization' }
      ]
    });

    // Manager Role
    this.roles.set('manager', {
      id: 'manager',
      name: 'Manager',
      description: 'Management access to department resources',
      hierarchy: 20,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      permissions: [
        { id: 'customers_manage', resource: 'customers', action: 'create', scope: 'department' },
        { id: 'customers_read', resource: 'customers', action: 'read', scope: 'department' },
        { id: 'customers_update', resource: 'customers', action: 'update', scope: 'department' },
        { id: 'agreements_manage', resource: 'agreements', action: 'create', scope: 'department' },
        { id: 'agreements_read', resource: 'agreements', action: 'read', scope: 'department' },
        { id: 'vehicles_read', resource: 'vehicles', action: 'read', scope: 'department' },
        { id: 'reports_department', resource: 'reports', action: 'read', scope: 'department' }
      ]
    });

    // Employee Role
    this.roles.set('employee', {
      id: 'employee',
      name: 'Employee',
      description: 'Standard employee access',
      hierarchy: 30,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      permissions: [
        { id: 'customers_read', resource: 'customers', action: 'read', scope: 'personal' },
        { id: 'agreements_read', resource: 'agreements', action: 'read', scope: 'personal' },
        { id: 'vehicles_read', resource: 'vehicles', action: 'read', scope: 'personal' },
        { id: 'profile_update', resource: 'profile', action: 'update', scope: 'personal' }
      ]
    });

    // Viewer Role
    this.roles.set('viewer', {
      id: 'viewer',
      name: 'Viewer',
      description: 'Read-only access to assigned resources',
      hierarchy: 40,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      permissions: [
        { id: 'dashboard_read', resource: 'dashboard', action: 'read', scope: 'personal' },
        { id: 'profile_read', resource: 'profile', action: 'read', scope: 'personal' }
      ]
    });
  }

  private async initializeEncryption(): Promise<void> {
    try {
      // Generate master encryption key
      const masterKey = await crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: 256
        },
        true,
        ['encrypt', 'decrypt']
      );
      
      this.encryptionKeys.set('master', masterKey);
      
      // Schedule key rotation
      setInterval(() => {
        this.rotateEncryptionKeys();
      }, this.config.encryption.keyRotationInterval);
      
    } catch (error) {
      console.error('Failed to initialize encryption:', error);
    }
  }

  private async rotateEncryptionKeys(): Promise<void> {
    try {
      // Generate new master key
      const newMasterKey = await crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: 256
        },
        true,
        ['encrypt', 'decrypt']
      );
      
      // Store old key for decryption of existing data
      const oldKey = this.encryptionKeys.get('master');
      if (oldKey) {
        this.encryptionKeys.set(`master_${Date.now()}`, oldKey);
      }
      
      // Set new master key
      this.encryptionKeys.set('master', newMasterKey);
      
      this.logSecurityEvent({
        type: 'system',
        severity: 'medium',
        action: 'encryption_key_rotation',
        details: { timestamp: Date.now() },
        riskScore: 0,
        blocked: false
      });
      
    } catch (error) {
      console.error('Failed to rotate encryption keys:', error);
    }
  }

  private startSecurityMonitoring(): void {
    // Monitor for security threats every 30 seconds
    setInterval(() => {
      this.detectThreats();
      this.cleanupExpiredSessions();
      this.analyzeSecurityEvents();
    }, 30000);

    // Cleanup old logs and events daily
    setInterval(() => {
      this.cleanupOldLogs();
    }, 24 * 60 * 60 * 1000);
  }

  private detectThreats(): void {
    const recentEvents = this.securityEvents.filter(
      event => Date.now() - event.timestamp < 5 * 60 * 1000 // Last 5 minutes
    );

    // Detect brute force attacks
    this.detectBruteForceAttacks(recentEvents);
    
    // Detect suspicious activity patterns
    this.detectSuspiciousActivity(recentEvents);
    
    // Detect privilege escalation attempts
    this.detectPrivilegeEscalation(recentEvents);
  }

  private detectBruteForceAttacks(events: SecurityEvent[]): void {
    const loginFailures = events.filter(
      event => event.type === 'authentication' && event.action === 'login_failed'
    );

    // Group by IP address
    const failuresByIP = new Map<string, SecurityEvent[]>();
    loginFailures.forEach(event => {
      const ip = event.ipAddress || 'unknown';
      if (!failuresByIP.has(ip)) {
        failuresByIP.set(ip, []);
      }
      failuresByIP.get(ip)!.push(event);
    });

    // Check for brute force patterns
    failuresByIP.forEach((failures, ip) => {
      if (failures.length >= 10) { // 10+ failures in 5 minutes
        this.createThreatDetection({
          type: 'brute_force',
          severity: 'high',
          description: `Brute force attack detected from IP ${ip}`,
          indicators: [
            `${failures.length} failed login attempts in 5 minutes`,
            `Source IP: ${ip}`,
            `Targeted users: ${[...new Set(failures.map(f => f.userId))].join(', ')}`
          ],
          actions: [`Block IP ${ip}`, 'Notify security team', 'Increase monitoring']
        });
      }
    });
  }

  private detectSuspiciousActivity(events: SecurityEvent[]): void {
    // Detect unusual access patterns
    const accessEvents = events.filter(
      event => event.type === 'data_access' && event.severity !== 'low'
    );

    // Group by user
    const accessByUser = new Map<string, SecurityEvent[]>();
    accessEvents.forEach(event => {
      if (event.userId) {
        if (!accessByUser.has(event.userId)) {
          accessByUser.set(event.userId, []);
        }
        accessByUser.get(event.userId)!.push(event);
      }
    });

    // Check for suspicious patterns
    accessByUser.forEach((accesses, userId) => {
      const uniqueResources = new Set(accesses.map(a => a.resource));
      const avgRiskScore = accesses.reduce((sum, a) => sum + a.riskScore, 0) / accesses.length;

      if (uniqueResources.size > 20 || avgRiskScore > 70) {
        this.createThreatDetection({
          type: 'suspicious_activity',
          severity: avgRiskScore > 80 ? 'critical' : 'high',
          userId,
          description: `Suspicious data access pattern detected for user ${userId}`,
          indicators: [
            `Accessed ${uniqueResources.size} different resources`,
            `Average risk score: ${avgRiskScore.toFixed(1)}`,
            `Total accesses: ${accesses.length}`
          ],
          actions: ['Review user permissions', 'Audit recent activities', 'Consider account suspension']
        });
      }
    });
  }

  private detectPrivilegeEscalation(events: SecurityEvent[]): void {
    const authEvents = events.filter(
      event => event.type === 'authorization' && event.action.includes('permission')
    );

    authEvents.forEach(event => {
      if (event.riskScore > 80) {
        this.createThreatDetection({
          type: 'privilege_escalation',
          severity: 'critical',
          userId: event.userId,
          description: `Potential privilege escalation attempt detected`,
          indicators: [
            `High risk authorization event (score: ${event.riskScore})`,
            `Action: ${event.action}`,
            `Resource: ${event.resource}`
          ],
          actions: ['Immediate account review', 'Suspend elevated permissions', 'Security investigation']
        });
      }
    });
  }

  private createThreatDetection(threat: Omit<ThreatDetection, 'id' | 'timestamp' | 'resolved'>): void {
    const detection: ThreatDetection = {
      id: this.generateId(),
      timestamp: Date.now(),
      resolved: false,
      ...threat
    };

    this.threatDetections.push(detection);

    // Log as security event
    this.logSecurityEvent({
      type: 'system',
      severity: threat.severity,
      userId: threat.userId,
      action: 'threat_detected',
      details: threat,
      riskScore: threat.severity === 'critical' ? 100 : 
                threat.severity === 'high' ? 80 : 
                threat.severity === 'medium' ? 60 : 40,
      blocked: false
    });

    // Auto-respond to critical threats
    if (threat.severity === 'critical') {
      this.respondToThreat(detection);
    }
  }

  private respondToThreat(threat: ThreatDetection): void {
    switch (threat.type) {
      case 'brute_force':
        // Auto-block IP if possible
        this.logSecurityEvent({
          type: 'system',
          severity: 'high',
          action: 'auto_response_ip_block',
          details: { threatId: threat.id },
          riskScore: 0,
          blocked: true
        });
        break;
      
      case 'privilege_escalation':
        // Suspend user permissions
        if (threat.userId) {
          this.suspendUser(threat.userId, 'Automatic suspension due to privilege escalation attempt');
        }
        break;
    }
  }

  private cleanupExpiredSessions(): void {
    const now = Date.now();
    const expiredSessions: string[] = [];

    this.sessions.forEach((session, sessionId) => {
      if (now - session.lastActivity > this.config.authentication.sessionTimeout) {
        expiredSessions.push(sessionId);
      }
    });

    expiredSessions.forEach(sessionId => {
      this.sessions.delete(sessionId);
      this.logSecurityEvent({
        type: 'authentication',
        severity: 'low',
        action: 'session_expired',
        details: { sessionId },
        riskScore: 0,
        blocked: false
      });
    });
  }

  private analyzeSecurityEvents(): void {
    const recentEvents = this.securityEvents.filter(
      event => Date.now() - event.timestamp < 60 * 60 * 1000 // Last hour
    );

    // Calculate security metrics
    const metrics = {
      totalEvents: recentEvents.length,
      criticalEvents: recentEvents.filter(e => e.severity === 'critical').length,
      highRiskEvents: recentEvents.filter(e => e.riskScore > 70).length,
      blockedEvents: recentEvents.filter(e => e.blocked).length,
      averageRiskScore: recentEvents.reduce((sum, e) => sum + e.riskScore, 0) / recentEvents.length || 0
    };

    // Report to performance analytics
    performanceAnalytics.recordMetric({
      name: 'Security Events',
      value: metrics.totalEvents,
      unit: 'count',
      category: 'security',
      tags: { period: 'hourly' }
    });

    performanceAnalytics.recordMetric({
      name: 'Security Risk Score',
      value: metrics.averageRiskScore,
      unit: 'score',
      category: 'security',
      tags: { period: 'hourly' }
    });
  }

  private cleanupOldLogs(): void {
    const cutoffTime = Date.now() - (this.config.audit.retentionPeriod * 24 * 60 * 60 * 1000);
    
    // Clean up security events
    this.securityEvents = this.securityEvents.filter(event => event.timestamp > cutoffTime);
    
    // Clean up audit logs
    this.auditLogs = this.auditLogs.filter(log => log.timestamp > cutoffTime);
    
    // Clean up resolved threat detections older than 30 days
    const threatCutoff = Date.now() - (30 * 24 * 60 * 60 * 1000);
    this.threatDetections = this.threatDetections.filter(
      threat => !threat.resolved || threat.timestamp > threatCutoff
    );
  }

  // Public API methods
  async authenticate(email: string, password: string, mfaCode?: string, metadata?: any): Promise<{
    success: boolean;
    user?: User;
    sessionId?: string;
    requiresMFA?: boolean;
    error?: string;
  }> {
    const user = Array.from(this.users.values()).find(u => u.email === email);
    
    if (!user) {
      this.logSecurityEvent({
        type: 'authentication',
        severity: 'medium',
        action: 'login_failed',
        details: { email, reason: 'user_not_found' },
        riskScore: 60,
        blocked: false,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent
      });
      return { success: false, error: 'Invalid credentials' };
    }

    // Check if user is locked
    if (user.lockedUntil && Date.now() < user.lockedUntil) {
      this.logSecurityEvent({
        type: 'authentication',
        severity: 'high',
        userId: user.id,
        action: 'login_blocked',
        details: { reason: 'account_locked' },
        riskScore: 80,
        blocked: true,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent
      });
      return { success: false, error: 'Account is locked' };
    }

    // Verify password (in real implementation, use proper password hashing)
    const passwordValid = await this.verifyPassword(password, user.id);
    
    if (!passwordValid) {
      user.loginAttempts++;
      
      if (user.loginAttempts >= this.config.authentication.maxLoginAttempts) {
        user.lockedUntil = Date.now() + this.config.authentication.lockoutDuration;
        this.logSecurityEvent({
          type: 'authentication',
          severity: 'high',
          userId: user.id,
          action: 'account_locked',
          details: { attempts: user.loginAttempts },
          riskScore: 90,
          blocked: true,
          ipAddress: metadata?.ipAddress,
          userAgent: metadata?.userAgent
        });
      } else {
        this.logSecurityEvent({
          type: 'authentication',
          severity: 'medium',
          userId: user.id,
          action: 'login_failed',
          details: { attempts: user.loginAttempts },
          riskScore: 50 + (user.loginAttempts * 10),
          blocked: false,
          ipAddress: metadata?.ipAddress,
          userAgent: metadata?.userAgent
        });
      }
      
      return { success: false, error: 'Invalid credentials' };
    }

    // Check MFA if required
    if (this.config.authentication.mfaRequired && user.mfaEnabled) {
      if (!mfaCode) {
        return { success: false, requiresMFA: true };
      }
      
      const mfaValid = await this.verifyMFA(user.id, mfaCode);
      if (!mfaValid) {
        this.logSecurityEvent({
          type: 'authentication',
          severity: 'high',
          userId: user.id,
          action: 'mfa_failed',
          details: { code: mfaCode },
          riskScore: 70,
          blocked: false,
          ipAddress: metadata?.ipAddress,
          userAgent: metadata?.userAgent
        });
        return { success: false, error: 'Invalid MFA code' };
      }
    }

    // Reset login attempts on successful login
    user.loginAttempts = 0;
    user.lockedUntil = undefined;
    user.lastLogin = Date.now();
    user.metadata = { ...user.metadata, ...metadata };

    // Create session
    const sessionId = this.generateId();
    const session = {
      userId: user.id,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent
    };
    
    this.sessions.set(sessionId, session);
    user.sessionId = sessionId;

    this.logSecurityEvent({
      type: 'authentication',
      severity: 'low',
      userId: user.id,
      action: 'login_success',
      details: { sessionId },
      riskScore: 10,
      blocked: false,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent
    });

    return { success: true, user, sessionId };
  }

  async authorize(userId: string, resource: string, action: string, context?: any): Promise<{
    authorized: boolean;
    reason?: string;
    conditions?: any;
  }> {
    const user = this.users.get(userId);
    if (!user) {
      return { authorized: false, reason: 'User not found' };
    }

    // Check if user has cached permissions
    let permissions = this.permissionCache.get(userId);
    if (!permissions) {
      permissions = this.getUserPermissions(user);
      if (this.config.authorization.permissionCaching) {
        this.permissionCache.set(userId, permissions);
      }
    }

    // Check permissions
    const hasPermission = this.checkPermission(permissions, resource, action, context);
    
    const riskScore = this.calculateAuthorizationRisk(user, resource, action, context);
    
    this.logSecurityEvent({
      type: 'authorization',
      severity: riskScore > 70 ? 'high' : riskScore > 40 ? 'medium' : 'low',
      userId,
      resource,
      action: `permission_${hasPermission ? 'granted' : 'denied'}`,
      details: { resource, action, context, riskScore },
      riskScore,
      blocked: !hasPermission
    });

    if (hasPermission) {
      this.logAudit({
        userId,
        action: `${action}_${resource}`,
        resource,
        resourceId: context?.resourceId,
        metadata: context,
        complianceFlags: this.getComplianceFlags(resource, action)
      });
    }

    return { 
      authorized: hasPermission, 
      reason: hasPermission ? undefined : 'Insufficient permissions',
      conditions: hasPermission ? this.getPermissionConditions(permissions, resource, action) : undefined
    };
  }

  private getUserPermissions(user: User): Permission[] {
    const allPermissions: Permission[] = [...user.permissions];
    
    // Add role-based permissions
    user.roles.forEach(role => {
      if (role.isActive) {
        allPermissions.push(...role.permissions);
      }
    });

    return allPermissions;
  }

  private checkPermission(permissions: Permission[], resource: string, action: string, context?: any): boolean {
    return permissions.some(permission => {
      // Check wildcard permissions
      if (permission.resource === '*' && permission.action === 'execute') {
        return true;
      }
      
      // Check exact match
      if (permission.resource === resource && permission.action === action) {
        // Check conditions if any
        if (permission.conditions) {
          return this.evaluateConditions(permission.conditions, context);
        }
        return true;
      }
      
      return false;
    });
  }

  private evaluateConditions(conditions: PermissionCondition[], context: any): boolean {
    return conditions.every(condition => {
      const contextValue = context?.[condition.field];
      
      switch (condition.operator) {
        case 'equals':
          return contextValue === condition.value;
        case 'not_equals':
          return contextValue !== condition.value;
        case 'contains':
          return Array.isArray(contextValue) && contextValue.includes(condition.value);
        case 'in':
          return Array.isArray(condition.value) && condition.value.includes(contextValue);
        case 'not_in':
          return !Array.isArray(condition.value) || !condition.value.includes(contextValue);
        case 'greater_than':
          return contextValue > condition.value;
        case 'less_than':
          return contextValue < condition.value;
        default:
          return false;
      }
    });
  }

  private getPermissionConditions(permissions: Permission[], resource: string, action: string): any {
    const permission = permissions.find(p => p.resource === resource && p.action === action);
    return permission?.conditions || null;
  }

  private calculateAuthorizationRisk(user: User, resource: string, action: string, context?: any): number {
    let riskScore = 0;
    
    // Base risk by action type
    switch (action) {
      case 'delete': riskScore += 40; break;
      case 'update': riskScore += 20; break;
      case 'create': riskScore += 15; break;
      case 'read': riskScore += 5; break;
      case 'execute': riskScore += 30; break;
    }
    
    // Risk by resource sensitivity
    const sensitiveResources = ['users', 'roles', 'permissions', 'audit', 'security'];
    if (sensitiveResources.includes(resource)) {
      riskScore += 30;
    }
    
    // Risk by user role hierarchy
    const userMaxHierarchy = Math.min(...user.roles.map(r => r.hierarchy));
    if (userMaxHierarchy > 20) { // Lower privilege users
      riskScore += 20;
    }
    
    // Risk by time of access
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) { // Outside business hours
      riskScore += 15;
    }
    
    // Risk by recent activity
    const recentEvents = this.securityEvents.filter(
      e => e.userId === user.id && Date.now() - e.timestamp < 60 * 60 * 1000
    );
    if (recentEvents.length > 50) { // High activity
      riskScore += 25;
    }
    
    return Math.min(100, riskScore);
  }

  async encryptData(data: any, keyId: string = 'master'): Promise<{
    encrypted: string;
    iv: string;
    keyId: string;
  }> {
    try {
      const key = this.encryptionKeys.get(keyId);
      if (!key) {
        throw new Error(`Encryption key ${keyId} not found`);
      }

      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encodedData = new TextEncoder().encode(JSON.stringify(data));
      
      const encrypted = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        encodedData
      );

      return {
        encrypted: this.arrayBufferToBase64(encrypted),
        iv: this.arrayBufferToBase64(iv),
        keyId
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  async decryptData(encryptedData: string, iv: string, keyId: string = 'master'): Promise<any> {
    try {
      const key = this.encryptionKeys.get(keyId);
      if (!key) {
        throw new Error(`Decryption key ${keyId} not found`);
      }

      const encrypted = this.base64ToArrayBuffer(encryptedData);
      const ivBuffer = this.base64ToArrayBuffer(iv);
      
      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: ivBuffer
        },
        key,
        encrypted
      );

      const decodedData = new TextDecoder().decode(decrypted);
      return JSON.parse(decodedData);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private async verifyPassword(password: string, userId: string): Promise<boolean> {
    // In real implementation, use proper password hashing (bcrypt, scrypt, etc.)
    // This is a simplified version for demo purposes
    return password.length >= this.config.authentication.passwordPolicy.minLength;
  }

  private async verifyMFA(userId: string, code: string): Promise<boolean> {
    // In real implementation, verify TOTP/SMS code
    // This is a simplified version for demo purposes
    return code.length === 6 && /^\d+$/.test(code);
  }

  private suspendUser(userId: string, reason: string): void {
    const user = this.users.get(userId);
    if (user) {
      user.lockedUntil = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
      
      // Invalidate all sessions
      const userSessions = Array.from(this.sessions.entries())
        .filter(([_, session]) => session.userId === userId);
      
      userSessions.forEach(([sessionId]) => {
        this.sessions.delete(sessionId);
      });

      this.logAudit({
        userId,
        action: 'user_suspended',
        resource: 'user',
        resourceId: userId,
        metadata: { reason, suspendedUntil: user.lockedUntil },
        complianceFlags: ['security_incident']
      });
    }
  }

  private logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      id: this.generateId(),
      timestamp: Date.now(),
      ...event
    };

    this.securityEvents.push(securityEvent);

    // Keep only recent events in memory
    if (this.securityEvents.length > 10000) {
      this.securityEvents = this.securityEvents.slice(-5000);
    }
  }

  private logAudit(audit: Omit<AuditLog, 'id' | 'timestamp' | 'ipAddress' | 'userAgent'>): void {
    const auditLog: AuditLog = {
      id: this.generateId(),
      timestamp: Date.now(),
      ipAddress: 'unknown', // Would be populated from request context
      userAgent: 'unknown', // Would be populated from request context
      ...audit
    };

    this.auditLogs.push(auditLog);

    // Keep only recent logs in memory
    if (this.auditLogs.length > 50000) {
      this.auditLogs = this.auditLogs.slice(-25000);
    }
  }

  private getComplianceFlags(resource: string, action: string): string[] {
    const flags: string[] = [];
    
    if (this.config.compliance.gdprEnabled) {
      const gdprResources = ['users', 'customers', 'personal_data'];
      if (gdprResources.includes(resource)) {
        flags.push('gdpr_relevant');
        if (action === 'delete') {
          flags.push('gdpr_right_to_erasure');
        }
        if (action === 'read') {
          flags.push('gdpr_data_access');
        }
      }
    }
    
    if (this.config.compliance.soc2Enabled) {
      const soc2Resources = ['security', 'audit', 'system'];
      if (soc2Resources.includes(resource)) {
        flags.push('soc2_relevant');
      }
    }
    
    return flags;
  }

  private generateId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods for getting security data
  getSecurityEvents(timeRange?: number, severity?: string): SecurityEvent[] {
    let events = [...this.securityEvents];
    
    if (timeRange) {
      const cutoff = Date.now() - timeRange;
      events = events.filter(event => event.timestamp > cutoff);
    }
    
    if (severity) {
      events = events.filter(event => event.severity === severity);
    }
    
    return events.sort((a, b) => b.timestamp - a.timestamp);
  }

  getAuditLogs(timeRange?: number, userId?: string): AuditLog[] {
    let logs = [...this.auditLogs];
    
    if (timeRange) {
      const cutoff = Date.now() - timeRange;
      logs = logs.filter(log => log.timestamp > cutoff);
    }
    
    if (userId) {
      logs = logs.filter(log => log.userId === userId);
    }
    
    return logs.sort((a, b) => b.timestamp - a.timestamp);
  }

  getThreatDetections(resolved?: boolean): ThreatDetection[] {
    let threats = [...this.threatDetections];
    
    if (resolved !== undefined) {
      threats = threats.filter(threat => threat.resolved === resolved);
    }
    
    return threats.sort((a, b) => b.timestamp - a.timestamp);
  }

  getSecurityMetrics(): {
    totalEvents: number;
    criticalEvents: number;
    activeThreats: number;
    averageRiskScore: number;
    complianceScore: number;
  } {
    const recentEvents = this.getSecurityEvents(24 * 60 * 60 * 1000); // Last 24 hours
    const activeThreats = this.getThreatDetections(false);
    
    return {
      totalEvents: recentEvents.length,
      criticalEvents: recentEvents.filter(e => e.severity === 'critical').length,
      activeThreats: activeThreats.length,
      averageRiskScore: recentEvents.reduce((sum, e) => sum + e.riskScore, 0) / recentEvents.length || 0,
      complianceScore: this.calculateComplianceScore()
    };
  }

  private calculateComplianceScore(): number {
    // Simplified compliance scoring
    let score = 100;
    
    const criticalEvents = this.getSecurityEvents(7 * 24 * 60 * 60 * 1000, 'critical');
    score -= criticalEvents.length * 10;
    
    const activeThreats = this.getThreatDetections(false);
    score -= activeThreats.length * 15;
    
    return Math.max(0, score);
  }

  // Cleanup
  destroy(): void {
    this.users.clear();
    this.roles.clear();
    this.sessions.clear();
    this.securityEvents = [];
    this.auditLogs = [];
    this.threatDetections = [];
    this.encryptionKeys.clear();
    this.permissionCache.clear();
  }
}

// Create singleton instance
export const securityService = new SecurityService();

// Convenience functions
export const authenticate = (email: string, password: string, mfaCode?: string, metadata?: any) =>
  securityService.authenticate(email, password, mfaCode, metadata);

export const authorize = (userId: string, resource: string, action: string, context?: any) =>
  securityService.authorize(userId, resource, action, context);

export const encryptData = (data: any, keyId?: string) =>
  securityService.encryptData(data, keyId);

export const decryptData = (encryptedData: string, iv: string, keyId?: string) =>
  securityService.decryptData(encryptedData, iv, keyId);

export const getSecurityMetrics = () => securityService.getSecurityMetrics(); 