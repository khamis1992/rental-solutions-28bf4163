import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Play, 
  Wrench, 
  RefreshCw,
  Database,
  Zap,
  Shield,
  FileText,
  Clock
} from 'lucide-react';
import { 
  runAgreementServiceDiagnostic, 
  autoFixAgreementServiceIssues,
  quickHealthCheck,
  type SystemDiagnostic,
  type DiagnosticResult
} from '@/utils/agreement-service-diagnostic';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/PageContainer';

const AgreementServiceDiagnostic = () => {
  const [diagnostic, setDiagnostic] = useState<SystemDiagnostic | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [quickStatus, setQuickStatus] = useState<boolean | null>(null);

  const handleRunDiagnostic = async () => {
    setIsRunning(true);
    try {
      const result = await runAgreementServiceDiagnostic();
      setDiagnostic(result);
    } catch (error) {
      toast.error('فشل في تشغيل التشخيص');
      console.error('Diagnostic failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleAutoFix = async () => {
    if (!diagnostic) return;
    
    setIsFixing(true);
    try {
      await autoFixAgreementServiceIssues(diagnostic);
      // إعادة تشغيل التشخيص بعد الإصلاح
      const newResult = await runAgreementServiceDiagnostic();
      setDiagnostic(newResult);
    } catch (error) {
      toast.error('فشل في الإصلاح التلقائي');
    } finally {
      setIsFixing(false);
    }
  };

  const handleQuickCheck = async () => {
    setIsRunning(true);
    try {
      const isHealthy = await quickHealthCheck();
      setQuickStatus(isHealthy);
      if (isHealthy) {
        toast.success('✅ الفحص السريع: النظام يعمل بشكل صحيح');
      } else {
        toast.warning('⚠️ الفحص السريع: توجد مشاكل تحتاج فحص مفصل');
      }
    } catch (error) {
      setQuickStatus(false);
      toast.error('❌ فشل الفحص السريع');
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">سليم</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">تحذير</Badge>;
      case 'error':
        return <Badge variant="destructive">خطأ</Badge>;
    }
  };

  const getOverallStatusCard = () => {
    if (!diagnostic) return null;

    const { overall } = diagnostic;
    let icon, color, message;

    switch (overall) {
      case 'healthy':
        icon = <CheckCircle className="h-8 w-8 text-green-500" />;
        color = 'border-green-200 bg-green-50';
        message = 'نظام العقود يعمل بشكل مثالي';
        break;
      case 'warning':
        icon = <AlertTriangle className="h-8 w-8 text-yellow-500" />;
        color = 'border-yellow-200 bg-yellow-50';
        message = 'النظام يعمل مع وجود تحذيرات';
        break;
      case 'critical':
        icon = <XCircle className="h-8 w-8 text-red-500" />;
        color = 'border-red-200 bg-red-50';
        message = 'توجد مشاكل حرجة تحتاج إصلاح';
        break;
    }

    return (
      <Card className={`${color} border-2`}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            {icon}
            <div>
              <h3 className="text-lg font-semibold">{message}</h3>
              <p className="text-sm text-muted-foreground">
                تم الفحص في: {new Date(diagnostic.timestamp).toLocaleString('ar-QA')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <PageContainer
      title="تشخيص نظام العقود"
      description="فحص شامل لخدمة معالج العقود والتأكد من عمل API بشكل صحيح"
      dir="rtl"
    >
      <div className="space-y-6" dir="rtl">
        {/* شريط الإجراءات */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-500" />
              إجراءات التشخيص
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={handleQuickCheck}
                disabled={isRunning}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
                فحص سريع
              </Button>

              <Button
                onClick={handleRunDiagnostic}
                disabled={isRunning}
                className="flex items-center gap-2"
              >
                <Play className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
                {isRunning ? 'جاري الفحص...' : 'فحص شامل'}
              </Button>

              {diagnostic && diagnostic.results.some(r => r.fix && r.status !== 'success') && (
                <Button
                  onClick={handleAutoFix}
                  disabled={isFixing}
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  <Wrench className={`h-4 w-4 ${isFixing ? 'animate-spin' : ''}`} />
                  {isFixing ? 'جاري الإصلاح...' : 'إصلاح تلقائي'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* نتيجة الفحص السريع */}
        {quickStatus !== null && (
          <Alert className={quickStatus ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <div className="flex items-center gap-2">
              {quickStatus ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={quickStatus ? 'text-green-800' : 'text-red-800'}>
                {quickStatus 
                  ? 'الفحص السريع: النظام يعمل بشكل صحيح - قاعدة البيانات متصلة وخدمة العقود تستجيب'
                  : 'الفحص السريع: توجد مشاكل في الاتصال أو خدمة العقود - يُنصح بتشغيل الفحص الشامل'
                }
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* الحالة العامة */}
        {getOverallStatusCard()}

        {/* نتائج التشخيص التفصيلية */}
        {diagnostic && (
          <div className="grid gap-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              نتائج التشخيص التفصيلية
            </h2>
            
            {diagnostic.results.map((result, index) => (
              <Card key={index} className="transition-all hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {result.section === 'Database Connection' && <Database className="h-5 w-5" />}
                      {result.section === 'Agreements Table Structure' && <FileText className="h-5 w-5" />}
                      {result.section === 'Agreement Service API' && <Zap className="h-5 w-5" />}
                      {result.section === 'CRUD Operations' && <RefreshCw className="h-5 w-5" />}
                      {result.section === 'Payment Integration' && <Clock className="h-5 w-5" />}
                      {result.section === 'Permissions & RLS' && <Shield className="h-5 w-5" />}
                      {result.section}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.status)}
                      {getStatusBadge(result.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-3">{result.message}</p>
                  
                  {result.details && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                        عرض التفاصيل التقنية
                      </summary>
                      <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}

                  {result.fix && result.status !== 'success' && (
                    <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                      <p className="text-sm text-blue-800">
                        💡 يمكن إصلاح هذه المشكلة تلقائياً باستخدام زر "إصلاح تلقائي"
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* معلومات إضافية */}
        <Card>
          <CardHeader>
            <CardTitle>معلومات حول التشخيص</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">ما يتم فحصه:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• اتصال قاعدة البيانات</li>
                  <li>• بنية جداول العقود</li>
                  <li>• وظائف API الأساسية</li>
                  <li>• عمليات CRUD</li>
                  <li>• تكامل المدفوعات</li>
                  <li>• الأذونات والأمان</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">حالات النتائج:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    سليم: يعمل بشكل مثالي
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    تحذير: يعمل مع مشاكل بسيطة
                  </li>
                  <li className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    خطأ: لا يعمل - يحتاج إصلاح
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default AgreementServiceDiagnostic; 