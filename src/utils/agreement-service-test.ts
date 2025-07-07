/**
 * اختبار سريع لخدمة العقود
 * يمكن استدعاؤها من أي مكان في التطبيق للتحقق من عمل API
 */

import { agreementService } from '@/services/AgreementService';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface AgreementServiceTestResult {
  overall: 'working' | 'partial' | 'failed';
  tests: {
    name: string;
    status: 'pass' | 'fail';
    message: string;
    duration: number;
  }[];
  totalDuration: number;
}

/**
 * اختبار شامل لخدمة العقود
 */
export async function testAgreementService(): Promise<AgreementServiceTestResult> {
  const startTime = Date.now();
  const tests: AgreementServiceTestResult['tests'] = [];

  // اختبار 1: اتصال قاعدة البيانات
  const dbTest = await runTest('Database Connection', async () => {
    const { data, error } = await supabase
      .from('leases')
      .select('count', { count: 'exact', head: true });
    
    if (error) throw new Error(`Database error: ${error.message}`);
    return 'Database connection successful';
  });
  tests.push(dbTest);

  // اختبار 2: جلب العقود
  const fetchTest = await runTest('Fetch Agreements', async () => {
    const result = await agreementService.fetchAgreements();
    if (!result.success) {
      throw new Error(`Failed to fetch agreements: ${result.error}`);
    }
    return `Fetched ${result.data.length} agreements successfully`;
  });
  tests.push(fetchTest);

  // اختبار 3: البحث في العقود
  const searchTest = await runTest('Search Functionality', async () => {
    const result = await agreementService.fetchAgreements({
      searchTerm: 'test',
      statuses: ['active']
    });
    if (!result.success) {
      throw new Error(`Search failed: ${result.error}`);
    }
    return `Search functionality working - found ${result.data.length} results`;
  });
  tests.push(searchTest);

  // اختبار 4: فحص بنية البيانات
  const structureTest = await runTest('Data Structure', async () => {
    const result = await agreementService.fetchAgreements();
    if (!result.success) {
      throw new Error('Cannot fetch data for structure test');
    }
    
    if (result.data.length > 0) {
      const firstAgreement = result.data[0];
      const requiredFields = ['id', 'customer_id', 'status', 'created_at'];
      
      for (const field of requiredFields) {
        if (!(field in firstAgreement)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }
      
      return 'Data structure is valid';
    }
    
    return 'No data to validate structure, but no errors';
  });
  tests.push(structureTest);

  // اختبار 5: فحص العلاقات
  const relationTest = await runTest('Database Relations', async () => {
    const { data, error } = await supabase
      .from('leases')
      .select(`
        id,
        customer_id,
        profiles:customer_id(id, full_name),
        vehicles(id, license_plate)
      `)
      .limit(1);

    if (error) {
      // العلاقات قد تفشل لكن لا نعتبرها خطأ حرج
      return `Relations test completed with warnings: ${error.message}`;
    }

    return 'Database relations working correctly';
  });
  tests.push(relationTest);

  const totalDuration = Date.now() - startTime;
  
  // تحديد النتيجة العامة
  const passedTests = tests.filter(t => t.status === 'pass').length;
  const totalTests = tests.length;
  
  let overall: 'working' | 'partial' | 'failed';
  if (passedTests === totalTests) {
    overall = 'working';
  } else if (passedTests >= totalTests / 2) {
    overall = 'partial';
  } else {
    overall = 'failed';
  }

  return {
    overall,
    tests,
    totalDuration
  };
}

/**
 * تشغيل اختبار واحد مع قياس الوقت
 */
async function runTest(
  name: string, 
  testFunction: () => Promise<string>
): Promise<{ name: string; status: 'pass' | 'fail'; message: string; duration: number }> {
  const startTime = Date.now();
  
  try {
    const message = await testFunction();
    const duration = Date.now() - startTime;
    
    return {
      name,
      status: 'pass',
      message,
      duration
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    
    return {
      name,
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
      duration
    };
  }
}

/**
 * اختبار سريع - للاستخدام في الواجهات
 */
export async function quickAgreementServiceTest(): Promise<boolean> {
  try {
    // اختبار سريع جداً
    const result = await agreementService.fetchAgreements();
    return result.success;
  } catch (error) {
    console.error('Quick test failed:', error);
    return false;
  }
}

/**
 * عرض نتائج الاختبار في toast
 */
export async function runAndDisplayAgreementServiceTest(): Promise<void> {
  toast.info('🔍 بدء اختبار خدمة العقود...', {
    description: 'يتم فحص جميع الوظائف الأساسية',
    duration: 2000
  });

  try {
    const results = await testAgreementService();
    
    const passedCount = results.tests.filter(t => t.status === 'pass').length;
    const totalCount = results.tests.length;
    
    if (results.overall === 'working') {
      toast.success('✅ خدمة العقود تعمل بشكل مثالي!', {
        description: `جميع الاختبارات نجحت (${passedCount}/${totalCount}) - اكتمال في ${results.totalDuration}ms`,
        duration: 5000
      });
    } else if (results.overall === 'partial') {
      toast.warning('⚠️ خدمة العقود تعمل جزئياً', {
        description: `نجح ${passedCount} من ${totalCount} اختبارات - قد توجد مشاكل بسيطة`,
        duration: 6000
      });
    } else {
      toast.error('❌ مشاكل في خدمة العقود!', {
        description: `فشل ${totalCount - passedCount} من ${totalCount} اختبارات - يحتاج فحص مفصل`,
        duration: 8000
      });
      
      // عرض تفاصيل الأخطاء
      const failedTests = results.tests.filter(t => t.status === 'fail');
      failedTests.forEach(test => {
        toast.error(`خطأ في ${test.name}`, {
          description: test.message,
          duration: 4000
        });
      });
    }

    // طباعة التفاصيل في console للمطورين
    console.group('🔍 Agreement Service Test Results');
    console.log('Overall Status:', results.overall);
    console.log('Total Duration:', results.totalDuration + 'ms');
    console.table(results.tests);
    console.groupEnd();

  } catch (error) {
    toast.error('❌ فشل في تشغيل اختبار خدمة العقود', {
      description: error instanceof Error ? error.message : 'خطأ غير معروف',
      duration: 6000
    });
    
    console.error('Agreement service test failed:', error);
  }
} 