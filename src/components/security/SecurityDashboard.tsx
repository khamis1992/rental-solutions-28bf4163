// @ts-nocheck
/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  Lock, 
  Key,
  Users,
  Activity,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  Filter,
  Search,
  Bell,
  Settings,
  Zap,
  Globe,
  Smartphone,
  Monitor,
  Database,
  Server,
  Wifi
} from 'lucide-react';
import { securityService, SecurityEvent, AuditLog, ThreatDetection } from '@/services/security-service';

interface SecurityDashboardProps {
  className?: string;
}

const SecurityDashboard: React.FC<SecurityDashboardProps> = ({ className }) => {
  const [securityMetrics, setSecurityMetrics] = useState<any>(null);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [threatDetections, setThreatDetections] = useState<ThreatDetection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');
  const [severityFilter, setSeverityFilter] = useState('all');

  const isArabic = document.dir === 'rtl' || document.documentElement.lang === 'ar';
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    loadSecurityData();
    
    if (autoRefresh) {
      const interval = setInterval(loadSecurityData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, timeRange, severityFilter]);

  const loadSecurityData = async () => {
    try {
      setIsLoading(true);
      
      const timeRangeMs = getTimeRangeMs(timeRange);
      
      // Load security metrics
      const metrics = securityService.getSecurityMetrics();
      setSecurityMetrics(metrics);
      
      // Load security events
      const events = securityService.getSecurityEvents(
        timeRangeMs, 
        severityFilter === 'all' ? undefined : severityFilter
      );
      setSecurityEvents(events);
      
      // Load audit logs
      const logs = securityService.getAuditLogs(timeRangeMs);
      setAuditLogs(logs);
      
      // Load threat detections
      const threats = securityService.getThreatDetections();
      setThreatDetections(threats);
      
    } catch (error) {
      console.error('Failed to load security data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeRangeMs = (range: string): number => {
    switch (range) {
      case '1h': return 60 * 60 * 1000;
      case '24h': return 24 * 60 * 60 * 1000;
      case '7d': return 7 * 24 * 60 * 60 * 1000;
      case '30d': return 30 * 24 * 60 * 60 * 1000;
      default: return 24 * 60 * 60 * 1000;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'high': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'medium': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'low': return <AlertTriangle className="w-4 h-4 text-blue-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'authentication': return <Key className="w-4 h-4" />;
      case 'authorization': return <Shield className="w-4 h-4" />;
      case 'data_access': return <Database className="w-4 h-4" />;
      case 'system': return <Server className="w-4 h-4" />;
      case 'compliance': return <FileText className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getThreatTypeIcon = (type: string) => {
    switch (type) {
      case 'brute_force': return <Zap className="w-4 h-4 text-red-500" />;
      case 'suspicious_activity': return <Eye className="w-4 h-4 text-orange-500" />;
      case 'data_exfiltration': return <Database className="w-4 h-4 text-red-500" />;
      case 'privilege_escalation': return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'anomalous_access': return <Wifi className="w-4 h-4 text-yellow-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (60 * 1000));
    const hours = Math.floor(diff / (60 * 60 * 1000));
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));

    if (days > 0) return isArabic ? `منذ ${days} أيام` : `${days}d ago`;
    if (hours > 0) return isArabic ? `منذ ${hours} ساعات` : `${hours}h ago`;
    if (minutes > 0) return isArabic ? `منذ ${minutes} دقائق` : `${minutes}m ago`;
    return isArabic ? 'الآن' : 'now';
  };

  const SecurityMetricsCard = () => (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardContent className="p-6">
        <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
          <div className={isArabic ? 'text-right' : 'text-left'}>
            <h3 className="text-lg font-semibold mb-4">
              {isArabic ? 'مقاييس الأمان' : 'Security Metrics'}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {securityMetrics?.totalEvents || 0}
                </div>
                <div className="text-sm text-gray-600">
                  {isArabic ? 'الأحداث الأمنية' : 'Security Events'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {securityMetrics?.criticalEvents || 0}
                </div>
                <div className="text-sm text-gray-600">
                  {isArabic ? 'أحداث حرجة' : 'Critical Events'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {securityMetrics?.activeThreats || 0}
                </div>
                <div className="text-sm text-gray-600">
                  {isArabic ? 'التهديدات النشطة' : 'Active Threats'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {securityMetrics?.complianceScore?.toFixed(0) || 100}%
                </div>
                <div className="text-sm text-gray-600">
                  {isArabic ? 'نقاط الامتثال' : 'Compliance Score'}
                </div>
              </div>
            </div>
          </div>
          <div className="text-6xl">🛡️</div>
        </div>
        
        {securityMetrics && (
          <div className="mt-4">
            <div className={`flex items-center justify-between text-sm mb-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
              <span>{isArabic ? 'متوسط نقاط المخاطر' : 'Average Risk Score'}</span>
              <span className="font-medium">{securityMetrics.averageRiskScore.toFixed(1)}/100</span>
            </div>
            <Progress value={securityMetrics.averageRiskScore} className="h-2" />
          </div>
        )}
      </CardContent>
    </Card>
  );

  const SecurityEventCard: React.FC<{ event: SecurityEvent }> = ({ event }) => (
    <Card className={`border-l-4 ${getSeverityColor(event.severity)}`}>
      <CardContent className="p-4">
        <div className={`flex items-center justify-between mb-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            {getEventTypeIcon(event.type)}
            <span className="font-medium text-sm">{event.action}</span>
          </div>
          <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            {getSeverityIcon(event.severity)}
            <Badge variant="outline" className="text-xs">
              {event.riskScore}/100
            </Badge>
          </div>
        </div>
        
        <div className="space-y-1 mb-3">
          {event.resource && (
            <div className={`flex items-center justify-between text-xs ${isArabic ? 'flex-row-reverse' : ''}`}>
              <span className="text-gray-600">{isArabic ? 'المورد:' : 'Resource:'}</span>
              <span className="font-medium">{event.resource}</span>
            </div>
          )}
          
          {event.userId && (
            <div className={`flex items-center justify-between text-xs ${isArabic ? 'flex-row-reverse' : ''}`}>
              <span className="text-gray-600">{isArabic ? 'المستخدم:' : 'User:'}</span>
              <span className="font-medium">{event.userId}</span>
            </div>
          )}
          
          {event.ipAddress && (
            <div className={`flex items-center justify-between text-xs ${isArabic ? 'flex-row-reverse' : ''}`}>
              <span className="text-gray-600">{isArabic ? 'عنوان IP:' : 'IP Address:'}</span>
              <span className="font-medium">{event.ipAddress}</span>
            </div>
          )}
        </div>
        
        <div className={`flex items-center justify-between text-xs text-gray-500 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <span>{formatTimeAgo(event.timestamp)}</span>
          <Badge variant={event.blocked ? 'destructive' : 'secondary'} className="text-xs">
            {event.blocked ? (isArabic ? 'محظور' : 'Blocked') : (isArabic ? 'مسموح' : 'Allowed')}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );

  const ThreatDetectionCard: React.FC<{ threat: ThreatDetection }> = ({ threat }) => (
    <Card className={`border-l-4 ${getSeverityColor(threat.severity)}`}>
      <CardContent className="p-4">
        <div className={`flex items-center justify-between mb-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            {getThreatTypeIcon(threat.type)}
            <span className="font-medium text-sm">{threat.type.replace('_', ' ')}</span>
          </div>
          <Badge variant={threat.resolved ? 'default' : 'destructive'}>
            {threat.resolved ? (isArabic ? 'محلول' : 'Resolved') : (isArabic ? 'نشط' : 'Active')}
          </Badge>
        </div>
        
        <p className="text-sm text-gray-600 mb-3">{threat.description}</p>
        
        {threat.indicators.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-700 mb-1">
              {isArabic ? 'المؤشرات:' : 'Indicators:'}
            </p>
            <div className="space-y-1">
              {threat.indicators.slice(0, 3).map((indicator, index) => (
                <div key={index} className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-1 h-1 bg-gray-400 rounded-full" />
                  <span>{indicator}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {threat.actions.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-700 mb-1">
              {isArabic ? 'الإجراءات المقترحة:' : 'Recommended Actions:'}
            </p>
            <div className="space-y-1">
              {threat.actions.slice(0, 2).map((action, index) => (
                <div key={index} className="flex items-center gap-2 text-xs text-blue-600">
                  <CheckCircle className="w-3 h-3" />
                  <span>{action}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className={`flex items-center justify-between text-xs text-gray-500 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <span>{formatTimeAgo(threat.timestamp)}</span>
          <span className="capitalize">{threat.severity}</span>
        </div>
      </CardContent>
    </Card>
  );

  const AuditLogCard: React.FC<{ log: AuditLog }> = ({ log }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className={`flex items-center justify-between mb-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <FileText className="w-4 h-4 text-blue-500" />
            <span className="font-medium text-sm">{log.action}</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {log.resource}
          </Badge>
        </div>
        
        <div className="space-y-1 mb-3">
          {log.userId && (
            <div className={`flex items-center justify-between text-xs ${isArabic ? 'flex-row-reverse' : ''}`}>
              <span className="text-gray-600">{isArabic ? 'المستخدم:' : 'User:'}</span>
              <span className="font-medium">{log.userId}</span>
            </div>
          )}
          
          {log.resourceId && (
            <div className={`flex items-center justify-between text-xs ${isArabic ? 'flex-row-reverse' : ''}`}>
              <span className="text-gray-600">{isArabic ? 'معرف المورد:' : 'Resource ID:'}</span>
              <span className="font-medium">{log.resourceId}</span>
            </div>
          )}
          
          {log.ipAddress && (
            <div className={`flex items-center justify-between text-xs ${isArabic ? 'flex-row-reverse' : ''}`}>
              <span className="text-gray-600">{isArabic ? 'عنوان IP:' : 'IP Address:'}</span>
              <span className="font-medium">{log.ipAddress}</span>
            </div>
          )}
        </div>
        
        {log.complianceFlags.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {log.complianceFlags.map((flag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {flag}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        <div className={`flex items-center justify-between text-xs text-gray-500 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <span>{formatTimeAgo(log.timestamp)}</span>
          <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading && !securityMetrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 animate-pulse" />
          <span>{isArabic ? 'جاري تحميل بيانات الأمان...' : 'Loading security data...'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
        <div>
          <h2 className="text-2xl font-bold">
            {isArabic ? 'لوحة الأمان والامتثال' : 'Security & Compliance Dashboard'}
          </h2>
          <p className="text-gray-600">
            {isArabic ? 'مراقبة الأمان في الوقت الفعلي وإدارة الامتثال' : 'Real-time security monitoring and compliance management'}
          </p>
        </div>
        
        <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1h">{isArabic ? 'آخر ساعة' : 'Last Hour'}</option>
            <option value="24h">{isArabic ? 'آخر 24 ساعة' : 'Last 24 Hours'}</option>
            <option value="7d">{isArabic ? 'آخر 7 أيام' : 'Last 7 Days'}</option>
            <option value="30d">{isArabic ? 'آخر 30 يوم' : 'Last 30 Days'}</option>
          </select>
          
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="touch-friendly"
          >
            <Bell className="w-4 h-4" />
            {isArabic ? 'تحديث تلقائي' : 'Auto Refresh'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={loadSecurityData}
            disabled={isLoading}
            className="touch-friendly"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isArabic ? 'تحديث' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Security Metrics Overview */}
      <SecurityMetricsCard />

      {/* Main Content Tabs */}
      <Tabs defaultValue="events" className="w-full">
        <TabsList className={`grid w-full grid-cols-4 ${isMobile ? 'text-xs' : ''}`}>
          <TabsTrigger value="events">
            {isArabic ? 'الأحداث' : 'Events'}
          </TabsTrigger>
          <TabsTrigger value="threats">
            {isArabic ? 'التهديدات' : 'Threats'}
          </TabsTrigger>
          <TabsTrigger value="audit">
            {isArabic ? 'سجل التدقيق' : 'Audit Log'}
          </TabsTrigger>
          <TabsTrigger value="compliance">
            {isArabic ? 'الامتثال' : 'Compliance'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          {/* Filters */}
          <div className={`flex items-center gap-4 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{isArabic ? 'جميع المستويات' : 'All Severities'}</option>
              <option value="critical">{isArabic ? 'حرج' : 'Critical'}</option>
              <option value="high">{isArabic ? 'عالي' : 'High'}</option>
              <option value="medium">{isArabic ? 'متوسط' : 'Medium'}</option>
              <option value="low">{isArabic ? 'منخفض' : 'Low'}</option>
            </select>
            
            <Button variant="outline" size="sm" className="touch-friendly">
              <Download className="w-4 h-4" />
              {isArabic ? 'تصدير' : 'Export'}
            </Button>
          </div>

          {/* Security Events */}
          {securityEvents.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {isArabic ? 'لا توجد أحداث أمنية في الفترة المحددة' : 'No security events in the selected time range'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {securityEvents.slice(0, 10).map(event => (
                <SecurityEventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="threats" className="space-y-4">
          {threatDetections.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-600">
                  {isArabic ? 'لا توجد تهديدات نشطة' : 'No active threats detected'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {threatDetections.slice(0, 8).map(threat => (
                <ThreatDetectionCard key={threat.id} threat={threat} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          {auditLogs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {isArabic ? 'لا توجد سجلات تدقيق في الفترة المحددة' : 'No audit logs in the selected time range'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {auditLogs.slice(0, 12).map(log => (
                <AuditLogCard key={log.id} log={log} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          {/* Compliance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">98%</div>
                <div className="text-sm text-gray-600 mb-2">
                  {isArabic ? 'امتثال GDPR' : 'GDPR Compliance'}
                </div>
                <Progress value={98} className="h-2" />
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">95%</div>
                <div className="text-sm text-gray-600 mb-2">
                  {isArabic ? 'امتثال SOC 2' : 'SOC 2 Compliance'}
                </div>
                <Progress value={95} className="h-2" />
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">92%</div>
                <div className="text-sm text-gray-600 mb-2">
                  {isArabic ? 'امتثال ISO 27001' : 'ISO 27001 Compliance'}
                </div>
                <Progress value={92} className="h-2" />
              </CardContent>
            </Card>
          </div>

          {/* Compliance Requirements */}
          <Card>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                <FileText className="w-5 h-5" />
                {isArabic ? 'متطلبات الامتثال' : 'Compliance Requirements'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { id: 'gdpr_data_protection', title: 'Data Protection & Privacy', status: 'met', framework: 'GDPR' },
                  { id: 'soc2_access_control', title: 'Access Control Management', status: 'met', framework: 'SOC 2' },
                  { id: 'iso_incident_response', title: 'Incident Response Procedures', status: 'partial', framework: 'ISO 27001' },
                  { id: 'gdpr_consent_management', title: 'Consent Management', status: 'met', framework: 'GDPR' },
                  { id: 'soc2_monitoring', title: 'Continuous Monitoring', status: 'met', framework: 'SOC 2' }
                ].map((requirement, index) => (
                  <div key={index} className={`flex items-center justify-between p-4 border rounded-lg ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                      {requirement.status === 'met' ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : requirement.status === 'partial' ? (
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <div className={isArabic ? 'text-right' : 'text-left'}>
                        <p className="font-medium">{requirement.title}</p>
                        <p className="text-sm text-gray-600">{requirement.framework}</p>
                      </div>
                    </div>
                    
                    <Badge variant={
                      requirement.status === 'met' ? 'default' : 
                      requirement.status === 'partial' ? 'secondary' : 'destructive'
                    }>
                      {requirement.status === 'met' ? (isArabic ? 'مستوفى' : 'Met') :
                       requirement.status === 'partial' ? (isArabic ? 'جزئي' : 'Partial') :
                       (isArabic ? 'غير مستوفى' : 'Not Met')}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityDashboard; 