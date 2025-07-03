import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useComprehensiveLogging } from '@/hooks/use-comprehensive-logging';
import { LogLevel, EventType, EntityType } from '@/services/comprehensive-logging-service';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Database,
  User,
  Zap,
  PlayCircle,
  Bug,
  Info,
  Clock
} from 'lucide-react';

const SystemLogsTestPage: React.FC = () => {
  const { toast } = useToast();
  const {
    log,
    logInfo,
    logWarn,
    logError,
    logCritical,
    logUserAction,
    logDatabaseOperation,
    logApiCall,
    logPaymentOperation,
    logMaintenanceOperation,
    logAuthentication,
    logSecurity,
    startPerformanceTimer,
    endPerformanceTimer,
    withPerformanceLogging,
    withErrorLogging
  } = useComprehensiveLogging('SystemLogsTestPage');

  const [testMessage, setTestMessage] = useState('');
  const [testDetails, setTestDetails] = useState('');
  const [performanceTimerId, setPerformanceTimerId] = useState<string | null>(null);

  // اختبار السجلات الأساسية
  const testBasicLogging = async () => {
    try {
      await logInfo('اختبار تسجيل السجلات الأساسية', {
        test_type: 'basic_logging',
        timestamp: new Date().toISOString()
      });

      await logWarn('رسالة تحذير للاختبار', {
        warning_type: 'test_warning',
        severity: 'medium'
      });

      await logError('رسالة خطأ للاختبار', {
        error_type: 'test_error',
        error_code: 'TEST_001'
      });

      await logCritical('رسالة حرجة للاختبار', {
        critical_type: 'test_critical',
        requires_attention: true
      });

      toast({
        title: '✅ تم اختبار السجلات الأساسية',
        description: 'تم تسجيل جميع مستويات السجلات بنجاح',
      });
    } catch (error) {
      console.error('خطأ في اختبار السجلات الأساسية:', error);
      toast({
        title: '❌ فشل اختبار السجلات الأساسية',
        description: 'حدث خطأ أثناء الاختبار',
        variant: 'destructive'
      });
    }
  };

  // اختبار السجلات المتخصصة
  const testSpecializedLogging = async () => {
    try {
      await logUserAction('تسجيل دخول المستخدم', 'user', '12345', {
        action_type: 'login',
        ip_address: '192.168.1.100',
        user_agent: 'Test Browser'
      });

      await logDatabaseOperation('SELECT * FROM customers', 'customers', {
        query_type: 'SELECT',
        execution_time: 45,
        rows_affected: 100
      });

      await logApiCall('GET /api/customers', 'customers', {
        method: 'GET',
        status_code: 200,
        response_time: 150
      });

      await logPaymentOperation('معالجة دفعة', 'payment', 'PAY_001', {
        amount: 1000,
        currency: 'QAR',
        payment_method: 'credit_card'
      });

      await logMaintenanceOperation('فحص دوري للمركبة', 'vehicle', 'VEH_001', {
        maintenance_type: 'inspection',
        technician: 'أحمد محمد',
        cost: 500
      });

      await logAuthentication('تسجيل دخول بنجاح', 'user', '12345', {
        method: 'email_password',
        device: 'web',
        location: 'Doha, Qatar'
      });

      await logSecurity('محاولة وصول غير مصرح بها', 'system', undefined, {
        ip_address: '192.168.1.200',
        blocked: true,
        threat_level: 'medium'
      });

      toast({
        title: '✅ تم اختبار السجلات المتخصصة',
        description: 'تم تسجيل جميع أنواع السجلات المتخصصة بنجاح',
      });
    } catch (error) {
      console.error('خطأ في اختبار السجلات المتخصصة:', error);
      toast({
        title: '❌ فشل اختبار السجلات المتخصصة',
        description: 'حدث خطأ أثناء الاختبار',
        variant: 'destructive'
      });
    }
  };

  // اختبار قياس الأداء
  const testPerformanceLogging = async () => {
    try {
      // بدء مؤقت الأداء
      const timerId = startPerformanceTimer('test_operation');
      setPerformanceTimerId(timerId);

      // محاكاة عملية تستغرق وقتاً
      await new Promise(resolve => setTimeout(resolve, 2000));

      // إنهاء مؤقت الأداء
      await endPerformanceTimer(timerId, 'عملية اختبار الأداء', {
        operation_type: 'test_performance',
        simulated_delay: 2000
      });

      setPerformanceTimerId(null);

      toast({
        title: '✅ تم اختبار قياس الأداء',
        description: 'تم قياس وتسجيل أداء العملية بنجاح',
      });
    } catch (error) {
      console.error('خطأ في اختبار قياس الأداء:', error);
      toast({
        title: '❌ فشل اختبار قياس الأداء',
        description: 'حدث خطأ أثناء الاختبار',
        variant: 'destructive'
      });
    }
  };

  // اختبار wrapper للأداء
  const testPerformanceWrapper = async () => {
    try {
      const result = await withPerformanceLogging(
        'test_wrapper_operation',
        async () => {
          // محاكاة عملية
          await new Promise(resolve => setTimeout(resolve, 1500));
          return { success: true, data: 'test data' };
        },
        { operation_type: 'wrapper_test' }
      );

      console.log('نتيجة العملية:', result);

      toast({
        title: '✅ تم اختبار Performance Wrapper',
        description: 'تم تنفيذ العملية مع قياس الأداء التلقائي',
      });
    } catch (error) {
      console.error('خطأ في اختبار Performance Wrapper:', error);
      toast({
        title: '❌ فشل اختبار Performance Wrapper',
        description: 'حدث خطأ أثناء الاختبار',
        variant: 'destructive'
      });
    }
  };

  // اختبار wrapper للأخطاء
  const testErrorWrapper = async () => {
    try {
      await withErrorLogging(
        async () => {
          // محاكاة خطأ
          throw new Error('خطأ محاكى للاختبار');
        },
        'test_error_wrapper',
        { test_type: 'error_wrapper' }
      );
    } catch (error) {
      // متوقع أن يحدث خطأ
      toast({
        title: '✅ تم اختبار Error Wrapper',
        description: 'تم تسجيل الخطأ تلقائياً مع التفاصيل',
      });
    }
  };

  // اختبار سجل مخصص
  const testCustomLog = async () => {
    if (!testMessage) {
      toast({
        title: '⚠️ رسالة مطلوبة',
        description: 'يرجى إدخال رسالة للاختبار',
        variant: 'destructive'
      });
      return;
    }

    try {
      let details = {};
      if (testDetails) {
        try {
          details = JSON.parse(testDetails);
        } catch {
          details = { raw_details: testDetails };
        }
      }

      await logInfo(testMessage, {
        ...details,
        test_type: 'custom_log',
        timestamp: new Date().toISOString()
      });

      toast({
        title: '✅ تم تسجيل الرسالة المخصصة',
        description: 'تم تسجيل رسالتك بنجاح',
      });

      setTestMessage('');
      setTestDetails('');
    } catch (error) {
      console.error('خطأ في تسجيل الرسالة المخصصة:', error);
      toast({
        title: '❌ فشل تسجيل الرسالة',
        description: 'حدث خطأ أثناء التسجيل',
        variant: 'destructive'
      });
    }
  };

  // اختبار الأحمال الثقيلة
  const testBulkLogging = async () => {
    try {
      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(
          logInfo(`سجل تجريبي رقم ${i + 1}`, {
            test_type: 'bulk_logging',
            sequence: i + 1,
            timestamp: new Date().toISOString()
          })
        );
      }

      await Promise.all(promises);

      toast({
        title: '✅ تم اختبار الأحمال الثقيلة',
        description: 'تم تسجيل 50 سجل بنجاح',
      });
    } catch (error) {
      console.error('خطأ في اختبار الأحمال الثقيلة:', error);
      toast({
        title: '❌ فشل اختبار الأحمال الثقيلة',
        description: 'حدث خطأ أثناء الاختبار',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">اختبار نظام التسجيل الشامل</h1>
          <p className="text-gray-600 mt-1">صفحة تجريبية لاختبار جميع وظائف نظام التسجيل</p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          جاهز للاختبار
        </Badge>
      </div>

      {/* الاختبارات الأساسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* اختبار السجلات الأساسية */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-500" />
              السجلات الأساسية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              اختبار تسجيل السجلات بجميع المستويات: info, warn, error, critical
            </p>
            <Button onClick={testBasicLogging} className="w-full">
              <PlayCircle className="h-4 w-4 mr-2" />
              اختبار السجلات الأساسية
            </Button>
          </CardContent>
        </Card>

        {/* اختبار السجلات المتخصصة */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-green-500" />
              السجلات المتخصصة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              اختبار تسجيل الأحداث المتخصصة: المستخدمين، قاعدة البيانات، API، المدفوعات، الصيانة
            </p>
            <Button onClick={testSpecializedLogging} className="w-full">
              <User className="h-4 w-4 mr-2" />
              اختبار السجلات المتخصصة
            </Button>
          </CardContent>
        </Card>

        {/* اختبار قياس الأداء */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              قياس الأداء
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              اختبار قياس أداء العمليات وتسجيل الأوقات
            </p>
            <div className="space-y-2">
              <Button 
                onClick={testPerformanceLogging} 
                className="w-full"
                disabled={performanceTimerId !== null}
              >
                <Zap className="h-4 w-4 mr-2" />
                {performanceTimerId ? 'جاري القياس...' : 'اختبار قياس الأداء'}
              </Button>
              <Button onClick={testPerformanceWrapper} className="w-full" variant="outline">
                <Activity className="h-4 w-4 mr-2" />
                اختبار Performance Wrapper
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* اختبار معالجة الأخطاء */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-red-500" />
              معالجة الأخطاء
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              اختبار تسجيل الأخطاء التلقائي والمعالجة الذكية
            </p>
            <Button onClick={testErrorWrapper} className="w-full" variant="outline">
              <AlertTriangle className="h-4 w-4 mr-2" />
              اختبار Error Wrapper
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* اختبار مخصص */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-purple-500" />
            اختبار مخصص
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">الرسالة</label>
              <Input
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="أدخل رسالة للاختبار..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">التفاصيل (JSON اختياري)</label>
              <Textarea
                value={testDetails}
                onChange={(e) => setTestDetails(e.target.value)}
                placeholder='{"key": "value", "test": true}'
                rows={3}
              />
            </div>
            <Button onClick={testCustomLog} className="w-full">
              <PlayCircle className="h-4 w-4 mr-2" />
              تسجيل الرسالة المخصصة
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* اختبار الأحمال الثقيلة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-500" />
            اختبار الأحمال الثقيلة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            اختبار تسجيل 50 سجل في نفس الوقت لاختبار الأداء
          </p>
          <Button onClick={testBulkLogging} className="w-full" variant="outline">
            <Database className="h-4 w-4 mr-2" />
            اختبار الأحمال الثقيلة (50 سجل)
          </Button>
        </CardContent>
      </Card>

      {/* معلومات إضافية */}
      <Card>
        <CardHeader>
          <CardTitle>معلومات هامة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>• جميع السجلات يتم حفظها في قاعدة البيانات مع التفاصيل الكاملة</p>
            <p>• يمكن مراجعة السجلات في صفحة "إدارة السجلات الشاملة"</p>
            <p>• النظام يدعم المعالجة المجمعة والتنظيف التلقائي</p>
            <p>• يتم تسجيل الأداء والأخطاء تلقائياً</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemLogsTestPage; 