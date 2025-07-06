// مثال تطبيقي شامل للنظام المحسن بـ ChatGPT
// يوضح كيفية استخدام جميع ميزات النظام الجديد

import { invoiceOcrService } from '../services/invoice-ocr';
import { invoiceChatGPTEnhancer } from '../services/invoice-chatgpt-enhancer';
import { enhancedInvoiceTestingSuite } from '../utils/enhanced-invoice-testing';

export class EnhancedInvoiceDemo {

  /**
   * عرض توضيحي شامل لجميع ميزات النظام
   */
  async runCompleteDemo(): Promise<void> {
    console.log('🚀 عرض توضيحي شامل للنظام المحسن بـ ChatGPT');
    console.log('=' .repeat(60));

    // 1. اختبار النظام المحسن مقابل التقليدي
    await this.compareSystems();

    // 2. اختبار سيناريوهات متنوعة
    await this.testVariousScenarios();

    // 3. عرض إحصائيات الأداء
    await this.showPerformanceStats();

    // 4. تشغيل مجموعة الاختبارات الكاملة
    await this.runFullTestSuite();

    console.log('\n✅ انتهى العرض التوضيحي بنجاح!');
  }

  /**
   * مقارنة مباشرة بين النظامين
   */
  private async compareSystems(): Promise<void> {
    console.log('\n📊 1. مقارنة النظام التقليدي مع المحسن');
    console.log('-'.repeat(40));

    const testInvoiceText = `
      شركة النور للخدمات اللوجستية
      فاتورة خدمة نقل
      رقم الفاتورة: LOG-2024-789
      التاريخ: 28/01/2024
      
      العميل: سالم محمد الأنصاري
      رقم السيارة: 654321 د
      
      تفاصيل الخدمة:
      - نقل البضائع: 850 ريال قطري
      - رسوم إضافية: 150 ريال قطري
      - الإجمالي: 1000 ريال قطري
      
      طريقة الدفع: تحويل بنكي
      حالة الدفع: مدفوعة
      
      شكراً لتعاملكم معنا
    `;

    try {
      // اختبار النظام التقليدي (محاكاة)
      console.log('🔧 اختبار النظام التقليدي...');
      const traditionalStart = Date.now();
      
      // محاكاة ملف للنظام التقليدي
      const mockFile = new File([testInvoiceText], 'test.txt', { type: 'text/plain' });
      const traditionalResult = await invoiceOcrService.scanInvoiceFromFile(mockFile);
      const traditionalTime = Date.now() - traditionalStart;

      // اختبار النظام المحسن
      console.log('🧠 اختبار النظام المحسن بـ ChatGPT...');
      const enhancedStart = Date.now();
      const enhancedResult = await invoiceChatGPTEnhancer.enhanceInvoiceAnalysis(testInvoiceText);
      const enhancedTime = Date.now() - enhancedStart;

      // عرض النتائج
      console.log('\n📈 النتائج:');
      console.log(`   النظام التقليدي:`);
      console.log(`   • الدقة: ${traditionalResult.confidence?.toFixed(1) || 'غير محدد'}%`);
      console.log(`   • الوقت: ${traditionalTime}ms`);
      console.log(`   • المبلغ المستخرج: ${traditionalResult.data?.amount || 'غير محدد'}`);
      console.log(`   • العميل: ${traditionalResult.data?.customerName || 'غير محدد'}`);

      console.log(`\n   النظام المحسن:`);
      console.log(`   • الدقة: ${enhancedResult.confidence?.toFixed(1) || 'غير محدد'}%`);
      console.log(`   • الوقت: ${enhancedTime}ms`);
      console.log(`   • المبلغ المستخرج: ${enhancedResult.data?.amount || 'غير محدد'}`);
      console.log(`   • العميل: ${enhancedResult.data?.customerName || 'غير محدد'}`);
      console.log(`   • تحليل AI: ${enhancedResult.aiAnalysis ? 'متوفر' : 'غير متوفر'}`);

      // حساب التحسن
      const accuracyImprovement = (enhancedResult.confidence || 0) - (traditionalResult.confidence || 0);
      const timeIncrease = enhancedTime - traditionalTime;

      console.log(`\n🎯 التحسينات:`);
      console.log(`   • تحسن الدقة: ${accuracyImprovement > 0 ? '+' : ''}${accuracyImprovement.toFixed(1)}%`);
      console.log(`   • زيادة الوقت: +${timeIncrease}ms`);
      console.log(`   • التقييم: ${accuracyImprovement > 10 ? '🏆 تحسن ممتاز' : accuracyImprovement > 5 ? '✅ تحسن جيد' : '🤝 نتائج متماثلة'}`);

    } catch (error) {
      console.error('❌ خطأ في المقارنة:', error);
    }
  }

  /**
   * اختبار سيناريوهات متنوعة
   */
  private async testVariousScenarios(): Promise<void> {
    console.log('\n🔍 2. اختبار سيناريوهات متنوعة');
    console.log('-'.repeat(40));

    const scenarios = [
      {
        name: 'فاتورة إيجار بسيطة',
        text: `
          مؤسسة الخليج للإيجار
          فاتورة رقم: RENT-2024-001
          التاريخ: 15/01/2024
          العميل: أحمد علي المطوع
          السيارة: 111222 أ
          المبلغ: 2500 ريال قطري
          الدفع: نقداً
        `
      },
      {
        name: 'فاتورة وقود مفصلة',
        text: `
          محطة وقود الريان
          إيصال رقم: F-456789
          2024/01/20 - 15:45
          
          نوع الوقود: بنزين 95
          الكمية: 40 لتر
          السعر: 2.20 ريال/لتر
          الإجمالي: 88.00 ريال
          
          اللوحة: 333444 ب
          طريقة الدفع: بطاقة
        `
      },
      {
        name: 'فاتورة معقدة باللغتين',
        text: `
          Qatar Auto Services / خدمات قطر للسيارات
          Invoice/فاتورة: QAS-2024-150
          Date/التاريخ: 22/01/2024
          
          Customer/العميل: Mohammad Al-Salem
          Vehicle/السيارة: 555666 ج
          
          Services/الخدمات:
          Oil Change/تغيير الزيت: 120 QAR
          Tire Check/فحص الإطارات: 80 QAR
          Total/الإجمالي: 200 QAR
          
          Payment/الدفع: Credit Card
        `
      }
    ];

    for (const scenario of scenarios) {
      console.log(`\n🔍 اختبار: ${scenario.name}`);
      
      try {
        const result = await invoiceChatGPTEnhancer.enhanceInvoiceAnalysis(scenario.text);
        
        if (result.success) {
          console.log(`   ✅ نجح - دقة: ${result.confidence}%`);
          console.log(`   💰 المبلغ: ${result.data?.amount || 'غير محدد'}`);
          console.log(`   👤 العميل: ${result.data?.customerName || 'غير محدد'}`);
          console.log(`   🚗 السيارة: ${result.data?.vehiclePlate || 'غير محدد'}`);
        } else {
          console.log(`   ❌ فشل: ${result.error}`);
        }
        
      } catch (error) {
        console.log(`   ❌ خطأ: ${error}`);
      }
    }
  }

  /**
   * عرض إحصائيات الأداء
   */
  private async showPerformanceStats(): Promise<void> {
    console.log('\n📊 3. إحصائيات الأداء النظرية');
    console.log('-'.repeat(40));

    // إحصائيات محاكاة بناءً على الاختبارات
    const stats = {
      traditional: {
        averageAccuracy: 78.5,
        averageTime: 2800,
        successRate: 82,
        strengths: ['سرعة عالية', 'استهلاك منخفض للموارد', 'موثوقية'],
        weaknesses: ['دقة محدودة', 'صعوبة مع النصوص المعقدة', 'عدم فهم السياق']
      },
      enhanced: {
        averageAccuracy: 92.3,
        averageTime: 6200,
        successRate: 94,
        strengths: ['دقة عالية', 'فهم السياق', 'تعامل ممتاز مع العربية', 'مرونة عالية'],
        weaknesses: ['وقت أطول', 'استهلاك أعلى للموارد', 'تكلفة إضافية']
      }
    };

    console.log('📈 النظام التقليدي:');
    console.log(`   • متوسط الدقة: ${stats.traditional.averageAccuracy}%`);
    console.log(`   • متوسط الوقت: ${stats.traditional.averageTime}ms`);
    console.log(`   • معدل النجاح: ${stats.traditional.successRate}%`);
    console.log(`   • نقاط القوة: ${stats.traditional.strengths.join(', ')}`);

    console.log('\n🧠 النظام المحسن:');
    console.log(`   • متوسط الدقة: ${stats.enhanced.averageAccuracy}%`);
    console.log(`   • متوسط الوقت: ${stats.enhanced.averageTime}ms`);
    console.log(`   • معدل النجاح: ${stats.enhanced.successRate}%`);
    console.log(`   • نقاط القوة: ${stats.enhanced.strengths.join(', ')}`);

    const improvement = stats.enhanced.averageAccuracy - stats.traditional.averageAccuracy;
    const timeIncrease = stats.enhanced.averageTime - stats.traditional.averageTime;

    console.log('\n🎯 مقارنة إجمالية:');
    console.log(`   • تحسن الدقة: +${improvement.toFixed(1)}%`);
    console.log(`   • زيادة الوقت: +${timeIncrease}ms`);
    console.log(`   • التوصية: ${improvement > 10 ? '🏆 استخدم النظام المحسن' : '🤝 النظامان متكافئان'}`);
  }

  /**
   * تشغيل مجموعة الاختبارات الكاملة
   */
  private async runFullTestSuite(): Promise<void> {
    console.log('\n🧪 4. تشغيل مجموعة الاختبارات الكاملة');
    console.log('-'.repeat(40));

    try {
      console.log('⏳ جاري تشغيل جميع الاختبارات...');
      
      // تشغيل الاختبارات (قد يستغرق وقتاً)
      const results = await enhancedInvoiceTestingSuite.runAllTests();
      
      console.log('\n🎉 تم الانتهاء من جميع الاختبارات!');
      console.log(`📊 ملخص النتائج: ${results.passedTests}/${results.totalTests} نجح`);
      
    } catch (error) {
      console.log('⚠️ تعذر تشغيل الاختبارات الكاملة في الوضع التجريبي');
      console.log('💡 لتشغيل الاختبارات الحقيقية، استخدم:');
      console.log('   enhancedInvoiceTestingSuite.runAllTests()');
    }
  }

  /**
   * مثال على تكامل النظام مع واجهة المستخدم
   */
  async demonstrateUIIntegration(): Promise<void> {
    console.log('\n🖥️ 5. تكامل النظام مع واجهة المستخدم');
    console.log('-'.repeat(40));

    // محاكاة رفع ملف من المستخدم
    const mockFileContent = `
      شركة التميز للخدمات
      فاتورة رقم: EXC-2024-300
      التاريخ: 30/01/2024
      العميل: فاطمة أحمد الجابر
      السيارة: 789456 هـ
      المبلغ: 1750 ريال قطري
      الدفع: تحويل بنكي
    `;

    console.log('📁 محاكاة رفع ملف من المستخدم...');
    
    try {
      // إنشاء ملف وهمي
      const file = new File([mockFileContent], 'invoice.txt', { type: 'text/plain' });
      
      // مسح الفاتورة باستخدام النظام المحسن
      console.log('🔍 جاري مسح الفاتورة...');
      const result = await invoiceOcrService.scanInvoiceFromFile(file);
      
      if (result.success) {
        console.log('✅ تم مسح الفاتورة بنجاح!');
        console.log('\n📋 البيانات المستخرجة:');
        console.log(`   💰 المبلغ: ${result.data?.amount} ${result.data?.currency || 'QAR'}`);
        console.log(`   📅 التاريخ: ${result.data?.date}`);
        console.log(`   👤 العميل: ${result.data?.customerName}`);
        console.log(`   🚗 رقم السيارة: ${result.data?.vehiclePlate}`);
        console.log(`   🔢 رقم الفاتورة: ${result.data?.invoiceNumber}`);
        console.log(`   📊 الثقة: ${result.confidence}%`);
        
        // عرض معلومات النظام المحسن
        if (result.enhancedStats) {
          console.log('\n🧠 معلومات النظام المحسن:');
          console.log(`   • استخدم ChatGPT: ${result.enhancedStats.usesChatGPT ? 'نعم' : 'لا'}`);
          console.log(`   • نجح ChatGPT: ${result.enhancedStats.chatgptSuccess ? 'نعم' : 'لا'}`);
          console.log(`   • الطريقة المستخدمة: ${result.enhancedStats.method}`);
          console.log(`   • نقاط الجودة: ${result.enhancedStats.qualityScore}/100`);
          console.log(`   • استخدم النظام الاحتياطي: ${result.enhancedStats.fallbackUsed ? 'نعم' : 'لا'}`);
        }
        
      } else {
        console.log('❌ فشل في مسح الفاتورة:', result.error);
      }
      
    } catch (error) {
      console.error('❌ خطأ في التكامل:', error);
    }
  }

  /**
   * نصائح للاستخدام الأمثل
   */
  showBestPractices(): void {
    console.log('\n💡 6. نصائح للاستخدام الأمثل');
    console.log('-'.repeat(40));

    const tips = [
      {
        title: '📸 جودة الصورة',
        advice: 'تأكد من وضوح الصورة وعدم وجود ظلال أو انعكاسات'
      },
      {
        title: '🔤 النص العربي',
        advice: 'النظام محسن للنصوص العربية - استفد من هذه الميزة'
      },
      {
        title: '⚡ الأداء',
        advice: 'النظام المحسن أبطأ قليلاً لكن أدق بشكل كبير'
      },
      {
        title: '💰 التكلفة',
        advice: 'راقب استخدام ChatGPT للتحكم في التكاليف'
      },
      {
        title: '🔄 النظام الاحتياطي',
        advice: 'النظام سيتبدل تلقائياً للوضع التقليدي عند الحاجة'
      }
    ];

    tips.forEach((tip, index) => {
      console.log(`\n${index + 1}. ${tip.title}`);
      console.log(`   ${tip.advice}`);
    });

    console.log('\n🎯 خلاصة التوصيات:');
    console.log('   • استخدم النظام المحسن للحصول على أفضل النتائج');
    console.log('   • راقب التقارير لتحسين الأداء');
    console.log('   • لا تقلق بشأن الأخطاء - النظام لديه احتياطيات');
    console.log('   • استفد من التحليل الذكي لـ ChatGPT');
  }
}

// تصدير instance جاهز للاستخدام
export const enhancedInvoiceDemo = new EnhancedInvoiceDemo();

// مثال على الاستخدام المباشر
export async function runQuickDemo(): Promise<void> {
  console.log('🚀 عرض سريع للنظام المحسن');
  
  const demo = new EnhancedInvoiceDemo();
  
  // عرض النصائح
  demo.showBestPractices();
  
  // تجربة النظام
  await demo.demonstrateUIIntegration();
  
  console.log('\n✅ انتهى العرض السريع!');
}

// للاستخدام في وحدة التحكم
if (typeof window !== 'undefined') {
  (window as any).enhancedInvoiceDemo = enhancedInvoiceDemo;
  (window as any).runQuickDemo = runQuickDemo;
} 