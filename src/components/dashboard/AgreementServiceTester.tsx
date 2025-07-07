import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, Stethoscope } from 'lucide-react';
import { agreementService } from '@/services/AgreementService';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface TestResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

export const AgreementServiceTester = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [lastTest, setLastTest] = useState<Date | null>(null);

  const runTests = async () => {
    setIsRunning(true);
    const testResults: TestResult[] = [];

    try {
      // Test 1: Database Connection
      try {
        const { data, error } = await supabase
          .from('leases')
          .select('count', { count: 'exact', head: true });
        
        if (error) {
          testResults.push({
            test: 'اتصال قاعدة البيانات',
            status: 'fail',
            message: `فشل الاتصال: ${error.message}`
          });
        } else {
          testResults.push({
            test: 'اتصال قاعدة البيانات',
            status: 'pass',
            message: 'الاتصال بقاعدة البيانات يعمل بشكل صحيح'
          });
        }
      } catch (error) {
        testResults.push({
          test: 'اتصال قاعدة البيانات',
          status: 'fail',
          message: `خطأ في الاتصال: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`
        });
      }

      // Test 2: Agreement Service
      try {
        const result = await agreementService.fetchAgreements();
        if (result.success) {
          testResults.push({
            test: 'خدمة العقود',
            status: 'pass',
            message: `تم جلب ${result.data.length} عقد بنجاح`
          });
        } else {
          testResults.push({
            test: 'خدمة العقود',
            status: 'fail',
            message: `فشل في جلب العقود: ${result.error}`
          });
        }
      } catch (error) {
        testResults.push({
          test: 'خدمة العقود',
          status: 'fail',
          message: `خطأ في خدمة العقود: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`
        });
      }

      // Test 3: Search Functionality
      try {
        const searchResult = await agreementService.fetchAgreements({
          searchTerm: 'test',
          statuses: ['active']
        });
        
        if (searchResult.success) {
          testResults.push({
            test: 'وظيفة البحث',
            status: 'pass',
            message: `البحث يعمل - عثر على ${searchResult.data.length} نتيجة`
          });
        } else {
          testResults.push({
            test: 'وظيفة البحث',
            status: 'warning',
            message: `البحث لا يعمل بشكل مثالي: ${searchResult.error}`
          });
        }
      } catch (error) {
        testResults.push({
          test: 'وظيفة البحث',
          status: 'warning',
          message: `مشكلة في البحث: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`
        });
      }

      setResults(testResults);
      setLastTest(new Date());

      // Show summary
      const passedTests = testResults.filter(r => r.status === 'pass').length;
      const totalTests = testResults.length;
      
      if (passedTests === totalTests) {
        toast.success('✅ جميع اختبارات خدمة العقود نجحت!', {
          description: 'النظام يعمل بشكل مثالي',
          duration: 5000
        });
      } else if (passedTests > 0) {
        toast.warning('⚠️ بعض اختبارات خدمة العقود فشلت', {
          description: `نجح ${passedTests} من ${totalTests} اختبارات`,
          duration: 6000
        });
      } else {
        toast.error('❌ جميع اختبارات خدمة العقود فشلت!', {
          description: 'يحتاج النظام إلى فحص فوري',
          duration: 8000
        });
      }
    } catch (error) {
      toast.error('❌ فشل في تشغيل الاختبارات', {
        description: error instanceof Error ? error.message : 'خطأ غير معروف',
        duration: 6000
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusClass = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'fail':
        return 'border-red-200 bg-red-50';
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-blue-500" />
          فاحص خدمة العقود
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Button
            onClick={runTests}
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            <Stethoscope className={`h-4 w-4 ${isRunning ? 'animate-pulse' : ''}`} />
            {isRunning ? 'جاري الفحص...' : 'فحص خدمة العقود'}
          </Button>
          
          {lastTest && (
            <span className="text-sm text-muted-foreground">
              آخر فحص: {lastTest.toLocaleTimeString('ar-QA')}
            </span>
          )}
        </div>

        {results.length > 0 && (
          <div className="space-y-2">
            {results.map((result, index) => (
              <Alert key={index} className={getStatusClass(result.status)}>
                <div className="flex items-center gap-2">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <div className="font-medium">{result.test}</div>
                    <AlertDescription className="text-sm">
                      {result.message}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p>هذا الفاحص يتحقق من:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>اتصال قاعدة البيانات</li>
            <li>عمل خدمة جلب العقود</li>
            <li>وظيفة البحث والفلترة</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}; 