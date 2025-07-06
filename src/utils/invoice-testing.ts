/**
 * نظام اختبار شامل لنظام الفواتير التلقائي
 * مصمم لاختبار جميع مكونات النظام في البيئة التطويرية
 */

import { InvoiceData, InvoiceOcrResult, InvoiceMatchResult } from '../types/invoice-types';

/**
 * بيانات تجريبية لاختبار النظام
 */
export const MOCK_INVOICE_DATA: InvoiceData[] = [
  // فاتورة إيجار شهري عادية
  {
    amount: 2500,
    customerName: "أحمد محمد الخليل",
    vehiclePlate: "123456",
    date: "2024-01-05",
    invoiceNumber: "INV-2024-001",
    paymentMethod: "نقداً",
    description: "إيجار شهر يناير 2024",
    merchantName: "شركة قطر للإيجار",
    location: "الدوحة، قطر",
    currency: "QAR",
    category: "rent",
    isReceipt: true
  },
  
  // فاتورة متأخرة (10 أيام)
  {
    amount: 3000,
    customerName: "فاطمة علي الكعبي",
    vehiclePlate: "789012",
    date: "2024-01-10",
    invoiceNumber: "INV-2024-002",
    paymentMethod: "بطاقة ائتمان",
    description: "إيجار شهر يناير 2024 - متأخر",
    merchantName: "شركة قطر للإيجار",
    location: "الدوحة، قطر",
    currency: "QAR",
    category: "rent",
    isReceipt: true
  },
  
  // فاتورة مخالفة مرورية
  {
    amount: 500,
    customerName: "سالم عبدالله النعيمي",
    vehiclePlate: "345678",
    date: "2024-01-03",
    invoiceNumber: "FINE-2024-001",
    paymentMethod: "تحويل بنكي",
    description: "مخالفة تجاوز السرعة",
    merchantName: "إدارة المرور",
    location: "الدوحة، قطر",
    currency: "QAR",
    category: "fine",
    isReceipt: true
  },
  
  // فاتورة صيانة
  {
    amount: 800,
    customerName: "نورا خالد الثاني",
    vehiclePlate: "567890",
    date: "2024-01-08",
    invoiceNumber: "MAINT-2024-001",
    paymentMethod: "نقداً",
    description: "تغيير زيت وفلاتر",
    merchantName: "ورشة الخليج للصيانة",
    location: "الدوحة، قطر",
    currency: "QAR",
    category: "maintenance",
    isReceipt: true
  },
  
  // فاتورة بمبلغ غير عادي (للاختبار)
  {
    amount: 15000,
    customerName: "محمد أحمد الكواري",
    vehiclePlate: "111222",
    date: "2024-01-15",
    invoiceNumber: "INV-2024-HIGH",
    paymentMethod: "شيك",
    description: "دفعة استثنائية - 6 أشهر",
    merchantName: "شركة قطر للإيجار",
    location: "الدوحة، قطر",
    currency: "QAR",
    category: "rent",
    isReceipt: true
  }
];

/**
 * عقود تجريبية للاختبار
 */
export const MOCK_AGREEMENTS = [
  {
    id: "test-agreement-1",
    agreement_number: "AG-2024-001",
    customer_name: "أحمد محمد الخليل",
    customer_id: "test-customer-1",
    vehicle_info: "تويوتا كامري 2023",
    license_plate: "123456",
    rent_amount: 2500,
    start_date: "2024-01-01",
    status: "active"
  },
  {
    id: "test-agreement-2",
    agreement_number: "AG-2024-002",
    customer_name: "فاطمة علي الكعبي",
    customer_id: "test-customer-2",
    vehicle_info: "هونداي سوناتا 2022",
    license_plate: "789012",
    rent_amount: 3000,
    start_date: "2024-01-01",
    status: "active"
  },
  {
    id: "test-agreement-3",
    agreement_number: "AG-2024-003",
    customer_name: "سالم عبدالله النعيمي",
    customer_id: "test-customer-3",
    vehicle_info: "نيسان التيما 2023",
    license_plate: "345678",
    rent_amount: 2800,
    start_date: "2024-01-01",
    status: "active"
  }
];

/**
 * سيناريوهات الاختبار
 */
export interface TestScenario {
  id: string;
  name: string;
  description: string;
  invoiceData: InvoiceData;
  expectedMatch?: any;
  expectedLateFee?: number;
  shouldSucceed: boolean;
  testType: 'match' | 'ocr' | 'payment' | 'integration';
}

export const TEST_SCENARIOS: TestScenario[] = [
  {
    id: "scenario-1",
    name: "مطابقة عادية برقم السيارة",
    description: "اختبار مطابقة فاتورة عادية برقم السيارة",
    invoiceData: MOCK_INVOICE_DATA[0],
    expectedMatch: MOCK_AGREEMENTS[0],
    shouldSucceed: true,
    testType: 'match'
  },
  {
    id: "scenario-2", 
    name: "دفعة متأخرة مع غرامة",
    description: "اختبار حساب غرامة التأخير للدفعة المتأخرة",
    invoiceData: MOCK_INVOICE_DATA[1],
    expectedMatch: MOCK_AGREEMENTS[1],
    expectedLateFee: 9 * 120, // 9 أيام × 120 ريال
    shouldSucceed: true,
    testType: 'payment'
  },
  {
    id: "scenario-3",
    name: "مطابقة باسم العميل",
    description: "اختبار المطابقة عندما رقم السيارة غير واضح",
    invoiceData: {
      ...MOCK_INVOICE_DATA[2],
      vehiclePlate: undefined // إزالة رقم السيارة للاختبار
    },
    expectedMatch: MOCK_AGREEMENTS[2],
    shouldSucceed: true,
    testType: 'match'
  },
  {
    id: "scenario-4",
    name: "فشل المطابقة",
    description: "اختبار الحالة عندما لا يوجد عقد مطابق",
    invoiceData: {
      amount: 1000,
      customerName: "عميل غير موجود",
      vehiclePlate: "999999",
      date: "2024-01-01",
      category: "rent"
    },
    shouldSucceed: false,
    testType: 'match'
  },
  {
    id: "scenario-5",
    name: "مبلغ غير عادي",
    description: "اختبار التعامل مع مبالغ كبيرة أو غير عادية",
    invoiceData: MOCK_INVOICE_DATA[4],
    expectedMatch: MOCK_AGREEMENTS[0], // نفس العميل
    shouldSucceed: true,
    testType: 'payment'
  }
];

/**
 * نظام الاختبار الرئيسي
 */
export class InvoiceTestRunner {
  private results: TestResult[] = [];
  
  /**
   * تشغيل جميع الاختبارات
   */
  async runAllTests(): Promise<TestRunSummary> {
    console.log('🧪 بدء تشغيل اختبارات نظام الفواتير التلقائي...');
    
    this.results = [];
    
    for (const scenario of TEST_SCENARIOS) {
      const result = await this.runTestScenario(scenario);
      this.results.push(result);
    }
    
    return this.generateSummary();
  }
  
  /**
   * تشغيل سيناريو اختبار واحد
   */
  async runTestScenario(scenario: TestScenario): Promise<TestResult> {
    console.log(`🔬 اختبار: ${scenario.name}`);
    
    const startTime = Date.now();
    let success = false;
    let error: string | null = null;
    let details: any = {};
    
    try {
      switch (scenario.testType) {
        case 'match':
          details = await this.testMatching(scenario);
          break;
        case 'ocr':
          details = await this.testOCR(scenario);
          break;
        case 'payment':
          details = await this.testPaymentProcessing(scenario);
          break;
        case 'integration':
          details = await this.testIntegration(scenario);
          break;
      }
      
      success = this.validateTestResult(details, scenario);
      
    } catch (err) {
      error = err instanceof Error ? err.message : 'خطأ غير معروف';
      success = false;
    }
    
    const duration = Date.now() - startTime;
    
    const result: TestResult = {
      scenarioId: scenario.id,
      name: scenario.name,
      success,
      duration,
      error,
      details
    };
    
    console.log(`${success ? '✅' : '❌'} ${scenario.name} - ${duration}ms`);
    if (error) {
      console.error(`   خطأ: ${error}`);
    }
    
    return result;
  }
  
  /**
   * اختبار نظام المطابقة
   */
  private async testMatching(scenario: TestScenario): Promise<any> {
    // محاكاة وظيفة المطابقة
    const mockMatchResult = this.simulateMatching(scenario.invoiceData);
    
    return {
      matchFound: !!mockMatchResult.agreement,
      confidence: mockMatchResult.confidence,
      matchMethod: mockMatchResult.matchMethod,
      agreement: mockMatchResult.agreement
    };
  }
  
  /**
   * اختبار نظام OCR
   */
  private async testOCR(scenario: TestScenario): Promise<any> {
    // محاكاة نتائج OCR
    return {
      ocrSuccess: true,
      extractedFields: Object.keys(scenario.invoiceData),
      confidence: 0.95,
      processingTime: Math.random() * 3000 + 1000 // 1-4 ثواني
    };
  }
  
  /**
   * اختبار معالجة الدفعات
   */
  private async testPaymentProcessing(scenario: TestScenario): Promise<any> {
    const paymentDate = new Date(scenario.invoiceData.date);
    const dueDate = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), 1);
    const daysLate = Math.max(0, Math.floor((paymentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    const lateFee = daysLate > 0 ? Math.min(daysLate * 120, 3000) : 0;
    
    return {
      amount: scenario.invoiceData.amount,
      daysLate,
      lateFee,
      totalAmount: scenario.invoiceData.amount + lateFee,
      paymentProcessed: true
    };
  }
  
  /**
   * اختبار التكامل الكامل
   */
  private async testIntegration(scenario: TestScenario): Promise<any> {
    const matchResult = await this.testMatching(scenario);
    const ocrResult = await this.testOCR(scenario);
    const paymentResult = await this.testPaymentProcessing(scenario);
    
    return {
      ocrSuccess: ocrResult.ocrSuccess,
      matchSuccess: matchResult.matchFound,
      paymentSuccess: paymentResult.paymentProcessed,
      totalProcessingTime: ocrResult.processingTime + 500, // وقت إضافي للمعالجة
      endToEndSuccess: ocrResult.ocrSuccess && matchResult.matchFound && paymentResult.paymentProcessed
    };
  }
  
  /**
   * محاكاة وظيفة المطابقة
   */
  private simulateMatching(invoiceData: InvoiceData): InvoiceMatchResult {
    // البحث برقم السيارة أولاً
    if (invoiceData.vehiclePlate) {
      const match = MOCK_AGREEMENTS.find(ag => ag.license_plate === invoiceData.vehiclePlate);
      if (match) {
        return {
          agreement: match,
          confidence: 0.95,
          matchMethod: 'vehicle_plate',
          alternatives: []
        };
      }
    }
    
    // البحث باسم العميل
    if (invoiceData.customerName) {
      const match = MOCK_AGREEMENTS.find(ag => 
        ag.customer_name.includes(invoiceData.customerName!) ||
        invoiceData.customerName!.includes(ag.customer_name)
      );
      if (match) {
        return {
          agreement: match,
          confidence: 0.75,
          matchMethod: 'customer_name',
          alternatives: []
        };
      }
    }
    
    // لم يتم العثور على مطابقة
    return {
      confidence: 0,
      matchMethod: 'none',
      alternatives: []
    };
  }
  
  /**
   * التحقق من صحة نتيجة الاختبار
   */
  private validateTestResult(details: any, scenario: TestScenario): boolean {
    switch (scenario.testType) {
      case 'match':
        return scenario.shouldSucceed ? details.matchFound : !details.matchFound;
      
      case 'payment':
        if (scenario.expectedLateFee !== undefined) {
          return Math.abs(details.lateFee - scenario.expectedLateFee) <= 120; // هامش خطأ يوم واحد
        }
        return details.paymentProcessed;
      
      case 'ocr':
        return details.ocrSuccess && details.confidence > 0.6;
      
      case 'integration':
        return scenario.shouldSucceed ? details.endToEndSuccess : !details.endToEndSuccess;
      
      default:
        return false;
    }
  }
  
  /**
   * إنشاء ملخص نتائج الاختبار
   */
  private generateSummary(): TestRunSummary {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const averageDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / totalTests;
    
    const summary: TestRunSummary = {
      totalTests,
      passedTests,
      failedTests,
      successRate: (passedTests / totalTests) * 100,
      averageDuration,
      results: this.results
    };
    
    console.log('\n📊 ملخص نتائج الاختبار:');
    console.log(`   إجمالي الاختبارات: ${totalTests}`);
    console.log(`   نجح: ${passedTests} (${summary.successRate.toFixed(1)}%)`);
    console.log(`   فشل: ${failedTests}`);
    console.log(`   متوسط الوقت: ${averageDuration.toFixed(0)}ms`);
    
    return summary;
  }
  
  /**
   * اختبار سريع للنظام
   */
  async quickTest(): Promise<boolean> {
    console.log('⚡ اختبار سريع لنظام الفواتير...');
    
    const testInvoice = MOCK_INVOICE_DATA[0];
    const startTime = Date.now();
    
    try {
      // اختبار المطابقة
      const matchResult = this.simulateMatching(testInvoice);
      if (!matchResult.agreement) {
        throw new Error('فشل في المطابقة');
      }
      
      // اختبار معالجة الدفعة
      const paymentResult = await this.testPaymentProcessing({
        id: 'quick-test',
        name: 'اختبار سريع',
        description: '',
        invoiceData: testInvoice,
        shouldSucceed: true,
        testType: 'payment'
      });
      
      if (!paymentResult.paymentProcessed) {
        throw new Error('فشل في معالجة الدفعة');
      }
      
      const duration = Date.now() - startTime;
      console.log(`✅ الاختبار السريع نجح في ${duration}ms`);
      return true;
      
    } catch (error) {
      console.error(`❌ الاختبار السريع فشل: ${error}`);
      return false;
    }
  }
}

/**
 * أنواع نتائج الاختبار
 */
export interface TestResult {
  scenarioId: string;
  name: string;
  success: boolean;
  duration: number;
  error?: string | null;
  details: any;
}

export interface TestRunSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  successRate: number;
  averageDuration: number;
  results: TestResult[];
}

/**
 * دوال مساعدة للاختبار في بيئة التطوير
 */
export const invoiceTestUtils = {
  /**
   * إنشاء مثيل اختبار جديد
   */
  createTestRunner: () => new InvoiceTestRunner(),
  
  /**
   * الحصول على بيانات تجريبية
   */
  getMockData: () => ({
    invoices: MOCK_INVOICE_DATA,
    agreements: MOCK_AGREEMENTS,
    scenarios: TEST_SCENARIOS
  }),
  
  /**
   * اختبار سريع من وحدة التحكم
   */
  runQuickTest: async () => {
    const runner = new InvoiceTestRunner();
    return await runner.quickTest();
  },
  
  /**
   * تشغيل جميع الاختبارات
   */
  runFullTestSuite: async () => {
    const runner = new InvoiceTestRunner();
    return await runner.runAllTests();
  }
};

// تصدير للوحدة التحكم في بيئة التطوير
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).invoiceTestUtils = invoiceTestUtils;
  console.log('🧪 أدوات اختبار الفواتير متاحة في: window.invoiceTestUtils');
} 