// نظام اختبار شامل للفواتير المحسنة بـ ChatGPT
// يشمل اختبار النظامين التقليدي والمحسن مع مقارنة الأداء

import { invoiceOcrService } from '../services/invoice-ocr';
import { invoiceChatGPTEnhancer } from '../services/invoice-chatgpt-enhancer';
import { InvoiceData, MockInvoiceData } from '../types/invoice-types';

export class EnhancedInvoiceTestingSuite {
  
  /**
   * تشغيل جميع الاختبارات
   */
  async runAllTests(): Promise<TestResults> {
    console.log('🧪 بدء اختبار النظام المحسن بـ ChatGPT...');
    
    const startTime = Date.now();
    const testScenarios = this.getTestScenarios();
    const results: TestResults = {
      totalTests: testScenarios.length,
      passedTests: 0,
      failedTests: 0,
      averageAccuracy: 0,
      averageProcessingTime: 0,
      performanceComparison: {
        traditional: { accuracy: 0, averageTime: 0 },
        enhanced: { accuracy: 0, averageTime: 0 }
      },
      detailedResults: [],
      summary: '',
      totalTime: 0
    };

    console.log(`📊 سيتم اختبار ${testScenarios.length} سيناريو مختلف...`);

    for (let i = 0; i < testScenarios.length; i++) {
      const scenario = testScenarios[i];
      console.log(`\n🔍 اختبار السيناريو ${i + 1}/${testScenarios.length}: ${scenario.scenario}`);
      
      try {
        const testResult = await this.testSingleScenario(scenario);
        results.detailedResults.push(testResult);
        
        if (testResult.passed) {
          results.passedTests++;
          console.log('✅ نجح الاختبار');
        } else {
          results.failedTests++;
          console.log('❌ فشل الاختبار');
        }
        
      } catch (error) {
        console.error(`❌ خطأ في اختبار السيناريو ${scenario.id}:`, error);
        results.failedTests++;
        results.detailedResults.push({
          scenarioId: scenario.id,
          scenarioName: scenario.scenario,
          passed: false,
          accuracy: 0,
          processingTime: 0,
          errors: [`خطأ في التنفيذ: ${error}`],
          traditionalResult: null,
          enhancedResult: null,
          comparison: {
            accuracyImprovement: 0,
            speedDifference: 0,
            winner: 'error'
          }
        });
      }
    }

    // حساب الإحصائيات النهائية
    this.calculateFinalStatistics(results);
    results.totalTime = Date.now() - startTime;

    // عرض التقرير النهائي
    this.displayFinalReport(results);

    return results;
  }

  /**
   * اختبار سيناريو واحد
   */
  private async testSingleScenario(scenario: MockInvoiceData): Promise<DetailedTestResult> {
    const startTime = Date.now();
    
    // اختبار النظام التقليدي
    console.log('🔧 اختبار النظام التقليدي...');
    const traditionalStart = Date.now();
    const traditionalFile = this.createMockFile(scenario.ocrText);
    const traditionalResult = await invoiceOcrService.scanInvoiceFromFile(traditionalFile);
    const traditionalTime = Date.now() - traditionalStart;

    // اختبار النظام المحسن (مباشرة مع ChatGPT)
    console.log('🧠 اختبار النظام المحسن بـ ChatGPT...');
    const enhancedStart = Date.now();
    const enhancedResult = await invoiceChatGPTEnhancer.enhanceInvoiceAnalysis(scenario.ocrText);
    const enhancedTime = Date.now() - enhancedStart;

    // تحليل النتائج
    const traditionalAccuracy = this.calculateAccuracy(
      traditionalResult.data || {} as InvoiceData, 
      scenario.expectedResult
    );
    
    const enhancedAccuracy = this.calculateAccuracy(
      enhancedResult.data || {} as InvoiceData, 
      scenario.expectedResult
    );

    // مقارنة الأداء
    const accuracyImprovement = enhancedAccuracy - traditionalAccuracy;
    const speedDifference = traditionalTime - enhancedTime;
    const winner = this.determineWinner(traditionalAccuracy, enhancedAccuracy, traditionalTime, enhancedTime);

    const testResult: DetailedTestResult = {
      scenarioId: scenario.id,
      scenarioName: scenario.scenario,
      passed: enhancedAccuracy >= 80, // نعتبر النجاح 80% فأكثر
      accuracy: enhancedAccuracy,
      processingTime: Date.now() - startTime,
      errors: this.findErrors(enhancedResult.data || {} as InvoiceData, scenario.expectedResult),
      traditionalResult: {
        accuracy: traditionalAccuracy,
        processingTime: traditionalTime,
        confidence: traditionalResult.confidence || 0,
        data: traditionalResult.data
      },
      enhancedResult: {
        accuracy: enhancedAccuracy,
        processingTime: enhancedTime,
        confidence: enhancedResult.confidence || 0,
        data: enhancedResult.data,
        usedChatGPT: enhancedResult.success,
        aiAnalysis: enhancedResult.aiAnalysis
      },
      comparison: {
        accuracyImprovement,
        speedDifference,
        winner
      }
    };

    console.log(`📊 النتائج - تقليدي: ${traditionalAccuracy.toFixed(1)}% | محسن: ${enhancedAccuracy.toFixed(1)}% | تحسن: ${accuracyImprovement > 0 ? '+' : ''}${accuracyImprovement.toFixed(1)}%`);

    return testResult;
  }

  /**
   * سيناريوهات الاختبار المتنوعة
   */
  private getTestScenarios(): MockInvoiceData[] {
    return [
      {
        id: 'enhanced-001',
        scenario: 'فاتورة إيجار عربية بسيطة',
        difficulty: 'easy',
        ocrText: `
          شركة الراشد لتأجير السيارات
          فاتورة إيجار شهري رقم INV-2024-150
          التاريخ: 15/01/2024
          
          العميل: خالد أحمد السليم
          رقم السيارة: 789123 ب
          
          قيمة الإيجار الشهري: 2800 ريال قطري
          طريقة الدفع: نقداً
          
          شكراً لثقتكم بنا
        `,
        expectedResult: {
          amount: 2800,
          date: '2024-01-15',
          customerName: 'خالد أحمد السليم',
          vehiclePlate: '789123 ب',
          invoiceNumber: 'INV-2024-150',
          category: 'إيجار',
          paymentMethod: 'نقداً',
          currency: 'QAR'
        }
      },
      {
        id: 'enhanced-002',
        scenario: 'فاتورة وقود معقدة مع تفاصيل',
        difficulty: 'medium',
        ocrText: `
          محطة الوقود الذهبية - فرع المطار
          إيصال شراء وقود
          رقم المعاملة: F-789456123
          التاريخ والوقت: 2024/01/20 14:30
          
          نوع الوقود: بنزين ممتاز 95
          الكمية: 45.8 لتر
          السعر للتر: 2.15 ريال
          الإجمالي: 98.47 ريال قطري
          
          رقم اللوحة: 456789 أ
          العميل: محمد عبدالله الكواري
          طريقة الدفع: بطاقة ائتمان
          
          شكراً لزيارتكم
        `,
        expectedResult: {
          amount: 98.47,
          date: '2024-01-20',
          customerName: 'محمد عبدالله الكواري',
          vehiclePlate: '456789 أ',
          invoiceNumber: 'F-789456123',
          category: 'وقود',
          paymentMethod: 'بطاقة ائتمان',
          currency: 'QAR'
        }
      },
      {
        id: 'enhanced-003',
        scenario: 'فاتورة صيانة باللغتين',
        difficulty: 'medium',
        ocrText: `
          Al-Mahaba Auto Service Center
          مركز المحبة لخدمة السيارات
          
          Invoice No: MAINT-2024-0088
          رقم الفاتورة: MAINT-2024-0088
          Date/التاريخ: 22/01/2024
          
          Customer/العميل: Ahmed Al-Thani / أحمد الثاني
          Vehicle Plate/رقم السيارة: 321654 ج
          
          Services Performed/الخدمات المنجزة:
          - Oil Change / تغيير الزيت: 180 QAR
          - Brake Inspection / فحص الفرامل: 120 QAR
          - General Checkup / فحص عام: 150 QAR
          
          Total Amount/المبلغ الإجمالي: 450 QAR
          Payment Method/طريقة الدفع: Bank Transfer/تحويل بنكي
          
          Thank you / شكراً لكم
        `,
        expectedResult: {
          amount: 450,
          date: '2024-01-22',
          customerName: 'Ahmed Al-Thani',
          vehiclePlate: '321654 ج',
          invoiceNumber: 'MAINT-2024-0088',
          category: 'صيانة',
          paymentMethod: 'تحويل بنكي',
          currency: 'QAR'
        }
      },
      {
        id: 'enhanced-004',
        scenario: 'فاتورة غرامة مرور معقدة',
        difficulty: 'hard',
        ocrText: `
          وزارة الداخلية - إدارة المرور
          Ministry of Interior - Traffic Department
          
          إيصال دفع مخالفة مرورية
          Traffic Violation Payment Receipt
          
          رقم المخالفة: TV-2024-456789
          Violation No: TV-2024-456789
          
          تاريخ المخالفة: 2024/01/18
          Violation Date: 2024/01/18
          
          نوع المخالفة: تجاوز السرعة المحددة
          Violation Type: Exceeding Speed Limit
          
          المركبة: سيارة خاصة
          رقم اللوحة: 159753 هـ
          Vehicle Plate: 159753 هـ
          
          مالك المركبة: سعد بن محمد القحطاني
          Vehicle Owner: Saad bin Mohammed Al-Qahtani
          
          قيمة الغرامة: 500.00 ريال قطري
          Fine Amount: 500.00 QAR
          
          تاريخ السداد: 25/01/2024
          Payment Date: 25/01/2024
          
          طريقة السداد: دفع إلكتروني
          Payment Method: Electronic Payment
          
          حالة السداد: مسددة
          Payment Status: Paid
        `,
        expectedResult: {
          amount: 500,
          date: '2024-01-25',
          customerName: 'سعد بن محمد القحطاني',
          vehiclePlate: '159753 هـ',
          invoiceNumber: 'TV-2024-456789',
          category: 'غرامة',
          paymentMethod: 'دفع إلكتروني',
          currency: 'QAR'
        }
      },
      {
        id: 'enhanced-005',
        scenario: 'فاتورة مشوهة أو صعبة القراءة',
        difficulty: 'hard',
        ocrText: `
          ش_كة... للتأج_ر
          فاتو_ة ر_م: 20_4-XYZ
          
          التار_خ: _5/_1/2024
          
          العم_ل: فا_د... الم_ري
          ر_م السيا_ة: 987_21 _
          
          قيمة الإ_جار: 32__ ر_ال
          طر_قة الد_ع: ن_داً
          
          ملاحظ_ت: دفع_ة شهر _ناير
        `,
        expectedResult: {
          amount: 3200,
          date: '2024-01-25',
          customerName: 'فايد المري',
          vehiclePlate: '987321',
          invoiceNumber: '2024-XYZ',
          category: 'إيجار',
          paymentMethod: 'نقداً',
          currency: 'QAR'
        }
      }
    ];
  }

  /**
   * حساب دقة استخراج البيانات
   */
  private calculateAccuracy(extracted: InvoiceData, expected: InvoiceData): number {
    let totalFields = 0;
    let correctFields = 0;
    const tolerance = 0.01; // تسامح للأرقام

    // فحص المبلغ (أهم حقل - 30%)
    totalFields += 3;
    if (Math.abs((extracted.amount || 0) - expected.amount) <= tolerance) {
      correctFields += 3;
    }

    // فحص التاريخ (مهم - 20%)
    totalFields += 2;
    if (extracted.date === expected.date) {
      correctFields += 2;
    }

    // فحص اسم العميل (مهم - 20%)
    totalFields += 2;
    if (this.compareNames(extracted.customerName, expected.customerName)) {
      correctFields += 2;
    }

    // فحص رقم السيارة (مهم - 20%)
    totalFields += 2;
    if (this.comparePlates(extracted.vehiclePlate, expected.vehiclePlate)) {
      correctFields += 2;
    }

    // فحص رقم الفاتورة (متوسط - 10%)
    totalFields += 1;
    if (extracted.invoiceNumber === expected.invoiceNumber) {
      correctFields += 1;
    }

    return (correctFields / totalFields) * 100;
  }

  /**
   * مقارنة الأسماء مع تسامح للأخطاء الطفيفة
   */
  private compareNames(extracted?: string, expected?: string): boolean {
    if (!extracted || !expected) return false;
    
    const clean1 = this.cleanForComparison(extracted);
    const clean2 = this.cleanForComparison(expected);
    
    return clean1 === clean2 || this.calculateSimilarity(clean1, clean2) > 0.8;
  }

  /**
   * مقارنة أرقام اللوحات
   */
  private comparePlates(extracted?: string, expected?: string): boolean {
    if (!extracted || !expected) return false;
    
    const clean1 = extracted.replace(/\s/g, '').toUpperCase();
    const clean2 = expected.replace(/\s/g, '').toUpperCase();
    
    return clean1 === clean2;
  }

  /**
   * تنظيف النص للمقارنة
   */
  private cleanForComparison(text: string): string {
    return text.trim().replace(/\s+/g, ' ').toLowerCase();
  }

  /**
   * حساب التشابه بين نصين
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * حساب مسافة Levenshtein
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * البحث عن الأخطاء
   */
  private findErrors(extracted: InvoiceData, expected: InvoiceData): string[] {
    const errors: string[] = [];
    
    if (!extracted.amount || Math.abs(extracted.amount - expected.amount) > 0.01) {
      errors.push(`خطأ في المبلغ: متوقع ${expected.amount}، مستخرج ${extracted.amount || 'غير محدد'}`);
    }
    
    if (extracted.date !== expected.date) {
      errors.push(`خطأ في التاريخ: متوقع ${expected.date}، مستخرج ${extracted.date || 'غير محدد'}`);
    }
    
    if (!this.compareNames(extracted.customerName, expected.customerName)) {
      errors.push(`خطأ في اسم العميل: متوقع ${expected.customerName}، مستخرج ${extracted.customerName || 'غير محدد'}`);
    }
    
    if (!this.comparePlates(extracted.vehiclePlate, expected.vehiclePlate)) {
      errors.push(`خطأ في رقم السيارة: متوقع ${expected.vehiclePlate}، مستخرج ${extracted.vehiclePlate || 'غير محدد'}`);
    }
    
    return errors;
  }

  /**
   * تحديد الفائز بين النظامين
   */
  private determineWinner(tradAcc: number, enhAcc: number, tradTime: number, enhTime: number): 'traditional' | 'enhanced' | 'tie' | 'error' {
    const accDiff = enhAcc - tradAcc;
    const timeDiff = tradTime - enhTime;
    
    if (accDiff > 5) return 'enhanced'; // تحسن كبير في الدقة
    if (accDiff < -5) return 'traditional'; // تراجع كبير
    if (Math.abs(accDiff) <= 5 && timeDiff > 2000) return 'traditional'; // نفس الدقة لكن أسرع
    if (Math.abs(accDiff) <= 5 && timeDiff < -2000) return 'enhanced'; // نفس الدقة لكن أبطأ كثيراً
    
    return enhAcc >= tradAcc ? 'enhanced' : 'traditional';
  }

  /**
   * حساب الإحصائيات النهائية
   */
  private calculateFinalStatistics(results: TestResults): void {
    if (results.detailedResults.length === 0) return;

    let totalAccuracy = 0;
    let totalTime = 0;
    let traditionalAccuracy = 0;
    let enhancedAccuracy = 0;
    let traditionalTime = 0;
    let enhancedTime = 0;

    results.detailedResults.forEach(result => {
      totalAccuracy += result.accuracy;
      totalTime += result.processingTime;
      
      if (result.traditionalResult) {
        traditionalAccuracy += result.traditionalResult.accuracy;
        traditionalTime += result.traditionalResult.processingTime;
      }
      
      if (result.enhancedResult) {
        enhancedAccuracy += result.enhancedResult.accuracy;
        enhancedTime += result.enhancedResult.processingTime;
      }
    });

    const count = results.detailedResults.length;
    results.averageAccuracy = totalAccuracy / count;
    results.averageProcessingTime = totalTime / count;
    
    results.performanceComparison.traditional.accuracy = traditionalAccuracy / count;
    results.performanceComparison.traditional.averageTime = traditionalTime / count;
    results.performanceComparison.enhanced.accuracy = enhancedAccuracy / count;
    results.performanceComparison.enhanced.averageTime = enhancedTime / count;
  }

  /**
   * عرض التقرير النهائي
   */
  private displayFinalReport(results: TestResults): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 التقرير النهائي لاختبار النظام المحسن بـ ChatGPT');
    console.log('='.repeat(80));
    
    console.log(`\n📈 النتائج العامة:`);
    console.log(`   • إجمالي الاختبارات: ${results.totalTests}`);
    console.log(`   • نجح: ${results.passedTests} (${((results.passedTests / results.totalTests) * 100).toFixed(1)}%)`);
    console.log(`   • فشل: ${results.failedTests} (${((results.failedTests / results.totalTests) * 100).toFixed(1)}%)`);
    console.log(`   • متوسط الدقة: ${results.averageAccuracy.toFixed(1)}%`);
    console.log(`   • متوسط وقت المعالجة: ${results.averageProcessingTime.toFixed(0)}ms`);
    console.log(`   • الوقت الإجمالي: ${(results.totalTime / 1000).toFixed(1)}s`);

    console.log(`\n🔍 مقارنة الأداء:`);
    console.log(`   النظام التقليدي:`);
    console.log(`   • متوسط الدقة: ${results.performanceComparison.traditional.accuracy.toFixed(1)}%`);
    console.log(`   • متوسط الوقت: ${results.performanceComparison.traditional.averageTime.toFixed(0)}ms`);
    
    console.log(`   النظام المحسن بـ ChatGPT:`);
    console.log(`   • متوسط الدقة: ${results.performanceComparison.enhanced.accuracy.toFixed(1)}%`);
    console.log(`   • متوسط الوقت: ${results.performanceComparison.enhanced.averageTime.toFixed(0)}ms`);

    const accuracyImprovement = results.performanceComparison.enhanced.accuracy - results.performanceComparison.traditional.accuracy;
    const timeChange = results.performanceComparison.enhanced.averageTime - results.performanceComparison.traditional.averageTime;

    console.log(`\n📊 التحسينات:`);
    console.log(`   • تحسن الدقة: ${accuracyImprovement > 0 ? '+' : ''}${accuracyImprovement.toFixed(1)}%`);
    console.log(`   • تغير الوقت: ${timeChange > 0 ? '+' : ''}${timeChange.toFixed(0)}ms`);

    // عرض تفاصيل النتائج الفردية
    console.log(`\n📋 تفاصيل الاختبارات:`);
    results.detailedResults.forEach((result, index) => {
      const status = result.passed ? '✅' : '❌';
      const winner = result.comparison.winner === 'enhanced' ? '🏆' : 
                     result.comparison.winner === 'traditional' ? '🥈' : '🤝';
      
      console.log(`   ${status} ${index + 1}. ${result.scenarioName}`);
      console.log(`      دقة: ${result.accuracy.toFixed(1)}% | وقت: ${result.processingTime}ms | فائز: ${winner}`);
      
      if (result.errors.length > 0) {
        console.log(`      أخطاء: ${result.errors[0]}`);
      }
    });

    // توصيات
    console.log(`\n💡 التوصيات:`);
    if (accuracyImprovement > 10) {
      console.log(`   • النظام المحسن بـ ChatGPT يُظهر تحسناً ملحوظاً في الدقة`);
      console.log(`   • يُنصح بتفعيل النظام المحسن كالنظام الأساسي`);
    } else if (accuracyImprovement > 5) {
      console.log(`   • النظام المحسن يُظهر تحسناً متوسطاً`);
      console.log(`   • يمكن استخدامه للحالات المعقدة`);
    } else {
      console.log(`   • النظام التقليدي لا يزال منافساً قوياً`);
      console.log(`   • يمكن الاعتماد على النظام الهجين`);
    }

    if (timeChange > 3000) {
      console.log(`   • النظام المحسن أبطأ، لكن الدقة تبرر الوقت الإضافي`);
    } else if (timeChange < -1000) {
      console.log(`   • النظام المحسن أسرع وأدق - مثالي!`);
    }

    console.log('\n' + '='.repeat(80));
  }

  /**
   * إنشاء ملف وهمي للاختبار
   */
  private createMockFile(ocrText: string): File {
    const blob = new Blob([ocrText], { type: 'text/plain' });
    return new File([blob], 'test-invoice.txt', { type: 'text/plain' });
  }
}

// أنواع البيانات للنتائج
export interface TestResults {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  averageAccuracy: number;
  averageProcessingTime: number;
  performanceComparison: {
    traditional: { accuracy: number; averageTime: number };
    enhanced: { accuracy: number; averageTime: number };
  };
  detailedResults: DetailedTestResult[];
  summary: string;
  totalTime: number;
}

export interface DetailedTestResult {
  scenarioId: string;
  scenarioName: string;
  passed: boolean;
  accuracy: number;
  processingTime: number;
  errors: string[];
  traditionalResult: {
    accuracy: number;
    processingTime: number;
    confidence: number;
    data?: InvoiceData;
  } | null;
  enhancedResult: {
    accuracy: number;
    processingTime: number;
    confidence: number;
    data?: InvoiceData;
    usedChatGPT: boolean;
    aiAnalysis?: string;
  } | null;
  comparison: {
    accuracyImprovement: number;
    speedDifference: number;
    winner: 'traditional' | 'enhanced' | 'tie' | 'error';
  };
}

// تصدير instance جاهز للاستخدام
export const enhancedInvoiceTestingSuite = new EnhancedInvoiceTestingSuite(); 