import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Lock, 
  Key, 
  Eye, 
  FileText, 
  Users, 
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Database,
  Server,
  Globe,
  Smartphone,
  Monitor,
  Zap,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Bell,
  Download,
  Upload,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  CreditCard,
  Wifi,
  Bluetooth,
  Camera,
  Mic
} from 'lucide-react';
import SecurityDashboard from '@/components/security/SecurityDashboard';
import PrivacyCenter from '@/components/security/PrivacyCenter';
import { securityService, getSecurityMetrics } from '@/services/security-service';
import { complianceManager, getComplianceDashboard } from '@/services/compliance-manager';

interface Day6DemoProps {
  className?: string;
}

const Day6Demo: React.FC<Day6DemoProps> = ({ className }) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationData, setSimulationData] = useState<any>(null);
  const [selectedDemo, setSelectedDemo] = useState('overview');
  const [securityMetrics, setSecurityMetrics] = useState<any>(null);
  const [complianceData, setComplianceData] = useState<any>(null);
  const [demoStats, setDemoStats] = useState({
    securityEvents: 0,
    threatsDetected: 0,
    privacyRequests: 0,
    complianceScore: 0,
    encryptedData: 0,
    auditLogs: 0
  });

  const isArabic = document.dir === 'rtl' || document.documentElement.lang === 'ar';
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    loadDemoData();
    
    if (isSimulating) {
      const interval = setInterval(() => {
        generateSimulationData();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isSimulating]);

  const loadDemoData = async () => {
    try {
      // Load security metrics
      const metrics = getSecurityMetrics();
      setSecurityMetrics(metrics);
      
      // Load compliance data
      const compliance = getComplianceDashboard();
      setComplianceData(compliance);
      
      // Update demo stats
      setDemoStats({
        securityEvents: metrics.totalEvents || 0,
        threatsDetected: metrics.activeThreats || 0,
        privacyRequests: compliance.pendingRequests || 0,
        complianceScore: compliance.overallScore || 0,
        encryptedData: Math.floor(Math.random() * 1000) + 500,
        auditLogs: Math.floor(Math.random() * 5000) + 2000
      });
      
    } catch (error) {
      console.error('Failed to load demo data:', error);
    }
  };

  const generateSimulationData = () => {
    const eventTypes = ['authentication', 'authorization', 'data_access', 'system', 'compliance'];
    const severities = ['low', 'medium', 'high', 'critical'];
    const actions = [
      'login_attempt', 'permission_check', 'data_export', 'system_backup', 
      'privacy_request', 'audit_log', 'encryption_key_rotation', 'threat_detected'
    ];

    const newEvent = {
      type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
      severity: severities[Math.floor(Math.random() * severities.length)],
      action: actions[Math.floor(Math.random() * actions.length)],
      timestamp: Date.now(),
      riskScore: Math.floor(Math.random() * 100),
      blocked: Math.random() > 0.8
    };

    setSimulationData(newEvent);
    
    // Update stats
    setDemoStats(prev => ({
      ...prev,
      securityEvents: prev.securityEvents + 1,
      threatsDetected: newEvent.severity === 'critical' ? prev.threatsDetected + 1 : prev.threatsDetected,
      privacyRequests: newEvent.type === 'compliance' ? prev.privacyRequests + 1 : prev.privacyRequests,
      encryptedData: prev.encryptedData + Math.floor(Math.random() * 10),
      auditLogs: prev.auditLogs + 1
    }));
  };

  const startSimulation = () => {
    setIsSimulating(true);
  };

  const stopSimulation = () => {
    setIsSimulating(false);
  };

  const resetDemo = () => {
    setIsSimulating(false);
    setSimulationData(null);
    setDemoStats({
      securityEvents: 0,
      threatsDetected: 0,
      privacyRequests: 0,
      complianceScore: 95,
      encryptedData: 500,
      auditLogs: 2000
    });
  };

  const simulateSecurityEvent = () => {
    generateSimulationData();
  };

  const simulatePrivacyRequest = async () => {
    try {
      await complianceManager.submitPrivacyRequest({
        type: 'access',
        subjectId: `demo_user_${Date.now()}`,
        subjectEmail: 'demo@example.com',
        description: 'Demo privacy request for testing',
        dataCategories: ['personal_info', 'contact_details'],
        processingActivities: []
      });
      
      setDemoStats(prev => ({
        ...prev,
        privacyRequests: prev.privacyRequests + 1
      }));
    } catch (error) {
      console.error('Failed to simulate privacy request:', error);
    }
  };

  const simulateEncryption = async () => {
    try {
      const testData = { message: 'Demo encryption test', timestamp: Date.now() };
      // In a real implementation, this would use the security service
      console.log('Encrypting data:', testData);
      
      setDemoStats(prev => ({
        ...prev,
        encryptedData: prev.encryptedData + 1
      }));
    } catch (error) {
      console.error('Failed to simulate encryption:', error);
    }
  };

  const DemoOverview = () => (
    <div className="space-y-6">
      {/* Day 6 Introduction */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="p-6">
          <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
            <div className={isArabic ? 'text-right' : 'text-left'}>
              <h3 className="text-2xl font-bold mb-2">
                {isArabic ? '🔒 اليوم 6: الأمان والامتثال' : '🔒 Day 6: Security & Compliance'}
              </h3>
              <p className="text-gray-600 mb-4">
                {isArabic ? 
                  'نظام أمان متقدم مع مصادقة متعددة العوامل، تشفير البيانات، ومراقبة الامتثال' :
                  'Advanced security system with multi-factor authentication, data encryption, and compliance monitoring'
                }
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-600">{demoStats.securityEvents}</div>
                  <div className="text-xs text-gray-600">{isArabic ? 'أحداث أمنية' : 'Security Events'}</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-red-600">{demoStats.threatsDetected}</div>
                  <div className="text-xs text-gray-600">{isArabic ? 'تهديدات' : 'Threats'}</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-purple-600">{demoStats.privacyRequests}</div>
                  <div className="text-xs text-gray-600">{isArabic ? 'طلبات خصوصية' : 'Privacy Requests'}</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600">{demoStats.complianceScore}%</div>
                  <div className="text-xs text-gray-600">{isArabic ? 'امتثال' : 'Compliance'}</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-orange-600">{demoStats.encryptedData}</div>
                  <div className="text-xs text-gray-600">{isArabic ? 'بيانات مشفرة' : 'Encrypted Data'}</div>
                </div>
              </div>
            </div>
            <div className="text-6xl">🛡️</div>
          </div>
        </CardContent>
      </Card>

      {/* Simulation Controls */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <Settings className="w-5 h-5" />
            {isArabic ? 'عناصر التحكم في المحاكاة' : 'Simulation Controls'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`flex flex-wrap items-center gap-4 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <Button
              variant={isSimulating ? 'destructive' : 'default'}
              onClick={isSimulating ? stopSimulation : startSimulation}
              className="touch-friendly"
            >
              {isSimulating ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  {isArabic ? 'إيقاف المحاكاة' : 'Stop Simulation'}
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  {isArabic ? 'بدء المحاكاة' : 'Start Simulation'}
                </>
              )}
            </Button>
            
            <Button variant="outline" onClick={resetDemo} className="touch-friendly">
              <RotateCcw className="w-4 h-4 mr-2" />
              {isArabic ? 'إعادة تعيين' : 'Reset Demo'}
            </Button>
            
            <Button variant="outline" onClick={simulateSecurityEvent} className="touch-friendly">
              <Shield className="w-4 h-4 mr-2" />
              {isArabic ? 'محاكاة حدث أمني' : 'Simulate Security Event'}
            </Button>
            
            <Button variant="outline" onClick={simulatePrivacyRequest} className="touch-friendly">
              <User className="w-4 h-4 mr-2" />
              {isArabic ? 'محاكاة طلب خصوصية' : 'Simulate Privacy Request'}
            </Button>
            
            <Button variant="outline" onClick={simulateEncryption} className="touch-friendly">
              <Lock className="w-4 h-4 mr-2" />
              {isArabic ? 'محاكاة تشفير' : 'Simulate Encryption'}
            </Button>
          </div>
          
          {isSimulating && (
            <Alert className="mt-4">
              <Activity className="w-4 h-4" />
              <AlertDescription>
                {isArabic ? 
                  'المحاكاة نشطة - يتم إنشاء أحداث أمنية كل ثانيتين' :
                  'Simulation active - generating security events every 2 seconds'
                }
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Real-time Security Event */}
      {simulationData && (
        <Card className={`border-l-4 ${
          simulationData.severity === 'critical' ? 'border-red-500 bg-red-50' :
          simulationData.severity === 'high' ? 'border-orange-500 bg-orange-50' :
          simulationData.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
          'border-blue-500 bg-blue-50'
        }`}>
          <CardContent className="p-4">
            <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                <AlertTriangle className={`w-4 h-4 ${
                  simulationData.severity === 'critical' ? 'text-red-500' :
                  simulationData.severity === 'high' ? 'text-orange-500' :
                  simulationData.severity === 'medium' ? 'text-yellow-500' :
                  'text-blue-500'
                }`} />
                <span className="font-medium">
                  {isArabic ? 'حدث أمني جديد' : 'New Security Event'}
                </span>
              </div>
              <Badge variant="outline" className="text-xs">
                {simulationData.severity}
              </Badge>
            </div>
            
            <div className="mt-2 space-y-1">
              <div className={`flex justify-between text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
                <span className="text-gray-600">{isArabic ? 'النوع:' : 'Type:'}</span>
                <span className="font-medium">{simulationData.type}</span>
              </div>
              <div className={`flex justify-between text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
                <span className="text-gray-600">{isArabic ? 'الإجراء:' : 'Action:'}</span>
                <span className="font-medium">{simulationData.action}</span>
              </div>
              <div className={`flex justify-between text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
                <span className="text-gray-600">{isArabic ? 'نقاط المخاطر:' : 'Risk Score:'}</span>
                <span className="font-medium">{simulationData.riskScore}/100</span>
              </div>
              <div className={`flex justify-between text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
                <span className="text-gray-600">{isArabic ? 'الحالة:' : 'Status:'}</span>
                <Badge variant={simulationData.blocked ? 'destructive' : 'default'} className="text-xs">
                  {simulationData.blocked ? (isArabic ? 'محظور' : 'Blocked') : (isArabic ? 'مسموح' : 'Allowed')}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <Shield className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">
              {isArabic ? 'المصادقة المتقدمة' : 'Advanced Authentication'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {isArabic ? 
                'مصادقة متعددة العوامل مع التحكم في الوصول القائم على الأدوار' :
                'Multi-factor authentication with role-based access control'
              }
            </p>
            <div className="space-y-2">
              <div className={`flex justify-between text-xs ${isArabic ? 'flex-row-reverse' : ''}`}>
                <span>{isArabic ? 'MFA مفعل' : 'MFA Enabled'}</span>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
              <div className={`flex justify-between text-xs ${isArabic ? 'flex-row-reverse' : ''}`}>
                <span>{isArabic ? 'RBAC نشط' : 'RBAC Active'}</span>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <Lock className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">
              {isArabic ? 'تشفير البيانات' : 'Data Encryption'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {isArabic ? 
                'تشفير شامل للبيانات مع دوران المفاتيح التلقائي' :
                'End-to-end data encryption with automatic key rotation'
              }
            </p>
            <div className="space-y-2">
              <div className={`flex justify-between text-xs ${isArabic ? 'flex-row-reverse' : ''}`}>
                <span>{isArabic ? 'AES-256-GCM' : 'AES-256-GCM'}</span>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
              <div className={`flex justify-between text-xs ${isArabic ? 'flex-row-reverse' : ''}`}>
                <span>{isArabic ? 'دوران المفاتيح' : 'Key Rotation'}</span>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <FileText className="w-12 h-12 text-purple-500 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">
              {isArabic ? 'امتثال GDPR' : 'GDPR Compliance'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {isArabic ? 
                'إدارة شاملة للخصوصية مع امتثال كامل لـ GDPR' :
                'Comprehensive privacy management with full GDPR compliance'
              }
            </p>
            <div className="space-y-2">
              <div className={`flex justify-between text-xs ${isArabic ? 'flex-row-reverse' : ''}`}>
                <span>{isArabic ? 'حقوق البيانات' : 'Data Rights'}</span>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
              <div className={`flex justify-between text-xs ${isArabic ? 'flex-row-reverse' : ''}`}>
                <span>{isArabic ? 'إدارة الموافقة' : 'Consent Management'}</span>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <Eye className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">
              {isArabic ? 'مراقبة التهديدات' : 'Threat Monitoring'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {isArabic ? 
                'كشف التهديدات في الوقت الفعلي مع الاستجابة التلقائية' :
                'Real-time threat detection with automated response'
              }
            </p>
            <div className="space-y-2">
              <div className={`flex justify-between text-xs ${isArabic ? 'flex-row-reverse' : ''}`}>
                <span>{isArabic ? 'كشف الشذوذ' : 'Anomaly Detection'}</span>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
              <div className={`flex justify-between text-xs ${isArabic ? 'flex-row-reverse' : ''}`}>
                <span>{isArabic ? 'استجابة تلقائية' : 'Auto Response'}</span>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <Activity className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">
              {isArabic ? 'سجلات التدقيق' : 'Audit Logging'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {isArabic ? 
                'تسجيل شامل للأنشطة مع الاحتفاظ طويل المدى' :
                'Comprehensive activity logging with long-term retention'
              }
            </p>
            <div className="space-y-2">
              <div className={`flex justify-between text-xs ${isArabic ? 'flex-row-reverse' : ''}`}>
                <span>{isArabic ? 'تسجيل شامل' : 'Full Logging'}</span>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
              <div className={`flex justify-between text-xs ${isArabic ? 'flex-row-reverse' : ''}`}>
                <span>{isArabic ? 'احتفاظ 7 سنوات' : '7-Year Retention'}</span>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <Globe className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">
              {isArabic ? 'امتثال دولي' : 'International Compliance'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {isArabic ? 
                'امتثال لمعايير SOC 2 و ISO 27001 العالمية' :
                'SOC 2 and ISO 27001 international standards compliance'
              }
            </p>
            <div className="space-y-2">
              <div className={`flex justify-between text-xs ${isArabic ? 'flex-row-reverse' : ''}`}>
                <span>{isArabic ? 'SOC 2 Type II' : 'SOC 2 Type II'}</span>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
              <div className={`flex justify-between text-xs ${isArabic ? 'flex-row-reverse' : ''}`}>
                <span>{isArabic ? 'ISO 27001' : 'ISO 27001'}</span>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
        <div>
          <h2 className="text-2xl font-bold">
            {isArabic ? 'عرض توضيحي - اليوم 6' : 'Day 6 Demo'}
          </h2>
          <p className="text-gray-600">
            {isArabic ? 
              'نظام الأمان والامتثال المتقدم للحلول الإيجارية' :
              'Advanced Security & Compliance System for Rental Solutions'
            }
          </p>
        </div>
        
        <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <Badge variant="outline" className="text-xs">
            {isArabic ? 'اليوم 6' : 'Day 6'}
          </Badge>
          <Badge variant="default" className="text-xs">
            {isArabic ? 'الأمان والامتثال' : 'Security & Compliance'}
          </Badge>
        </div>
      </div>

      {/* Demo Tabs */}
      <Tabs value={selectedDemo} onValueChange={setSelectedDemo} className="w-full">
        <TabsList className={`grid w-full grid-cols-4 ${isMobile ? 'text-xs' : ''}`}>
          <TabsTrigger value="overview">
            {isArabic ? 'نظرة عامة' : 'Overview'}
          </TabsTrigger>
          <TabsTrigger value="security">
            {isArabic ? 'لوحة الأمان' : 'Security Dashboard'}
          </TabsTrigger>
          <TabsTrigger value="privacy">
            {isArabic ? 'مركز الخصوصية' : 'Privacy Center'}
          </TabsTrigger>
          <TabsTrigger value="features">
            {isArabic ? 'الميزات' : 'Features'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <DemoOverview />
        </TabsContent>

        <TabsContent value="security">
          <SecurityDashboard />
        </TabsContent>

        <TabsContent value="privacy">
          <PrivacyCenter />
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          {/* Technical Features */}
          <Card>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                <Zap className="w-5 h-5" />
                {isArabic ? 'الميزات التقنية' : 'Technical Features'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">
                    {isArabic ? 'الأمان المتقدم' : 'Advanced Security'}
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>{isArabic ? 'مصادقة متعددة العوامل (MFA)' : 'Multi-Factor Authentication (MFA)'}</span>
                    </li>
                    <li className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>{isArabic ? 'التحكم في الوصول القائم على الأدوار (RBAC)' : 'Role-Based Access Control (RBAC)'}</span>
                    </li>
                    <li className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>{isArabic ? 'تشفير AES-256-GCM' : 'AES-256-GCM Encryption'}</span>
                    </li>
                    <li className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>{isArabic ? 'دوران المفاتيح التلقائي' : 'Automatic Key Rotation'}</span>
                    </li>
                    <li className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>{isArabic ? 'كشف التهديدات في الوقت الفعلي' : 'Real-time Threat Detection'}</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">
                    {isArabic ? 'إدارة الامتثال' : 'Compliance Management'}
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>{isArabic ? 'امتثال GDPR كامل' : 'Full GDPR Compliance'}</span>
                    </li>
                    <li className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>{isArabic ? 'شهادة SOC 2 Type II' : 'SOC 2 Type II Certification'}</span>
                    </li>
                    <li className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>{isArabic ? 'معيار ISO 27001' : 'ISO 27001 Standard'}</span>
                    </li>
                    <li className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>{isArabic ? 'إدارة طلبات الخصوصية' : 'Privacy Request Management'}</span>
                    </li>
                    <li className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>{isArabic ? 'سجلات تدقيق شاملة' : 'Comprehensive Audit Logs'}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                <TrendingUp className="w-5 h-5" />
                {isArabic ? 'مقاييس الأداء' : 'Performance Metrics'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">99.9%</div>
                  <div className="text-sm text-gray-600">
                    {isArabic ? 'وقت التشغيل' : 'Uptime'}
                  </div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">&lt;50ms</div>
                  <div className="text-sm text-gray-600">
                    {isArabic ? 'زمن الاستجابة' : 'Response Time'}
                  </div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">256-bit</div>
                  <div className="text-sm text-gray-600">
                    {isArabic ? 'قوة التشفير' : 'Encryption Strength'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Standards */}
          <Card>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                <Shield className="w-5 h-5" />
                {isArabic ? 'معايير الأمان' : 'Security Standards'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className={`flex items-center gap-2 mb-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="font-semibold">GDPR</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {isArabic ? 
                      'امتثال كامل للائحة حماية البيانات العامة الأوروبية' :
                      'Full compliance with European General Data Protection Regulation'
                    }
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className={`flex items-center gap-2 mb-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="font-semibold">SOC 2</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {isArabic ? 
                      'شهادة SOC 2 Type II لضوابط الأمان والتوفر' :
                      'SOC 2 Type II certification for security and availability controls'
                    }
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className={`flex items-center gap-2 mb-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="font-semibold">ISO 27001</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {isArabic ? 
                      'معيار إدارة أمان المعلومات الدولي' :
                      'International information security management standard'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Day6Demo; 