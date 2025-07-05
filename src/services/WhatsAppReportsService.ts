/**
 * خدمة إرسال التقارير المجدولة عبر الواتساب
 * تقوم بإرسال التقارير PDF إلى أرقام محددة
 */

import { twilioWhatsAppService } from './TwilioWhatsAppService';
import { ScheduledReport } from '@/hooks/useScheduledReports';

// الأرقام المستهدفة لإرسال التقارير
const TARGET_WHATSAPP_NUMBERS = [
  '+97466707063',
  '+97470598989'
];

export interface WhatsAppReportResult {
  success: boolean;
  sentTo: string[];
  failedTo: string[];
  errors: string[];
}

export class WhatsAppReportsService {
  
  /**
   * إرسال تقرير مجدول إلى أرقام الواتساب المحددة
   */
  async sendScheduledReport(report: ScheduledReport, pdfContent?: string): Promise<WhatsAppReportResult> {
    const result: WhatsAppReportResult = {
      success: false,
      sentTo: [],
      failedTo: [],
      errors: []
    };

    console.log(`بدء إرسال التقرير "${report.name}" إلى ${TARGET_WHATSAPP_NUMBERS.length} رقم`);

    for (const phoneNumber of TARGET_WHATSAPP_NUMBERS) {
      try {
        const message = this.generateReportMessage(report);
        const whatsappResult = await twilioWhatsAppService.sendMessage(
          phoneNumber,
          message,
          'scheduled_report'
        );

        if (whatsappResult.success) {
          result.sentTo.push(phoneNumber);
          console.log(`تم إرسال التقرير بنجاح إلى ${phoneNumber}`);
        } else {
          result.failedTo.push(phoneNumber);
          result.errors.push(`${phoneNumber}: ${whatsappResult.error}`);
          console.error(`فشل إرسال التقرير إلى ${phoneNumber}:`, whatsappResult.error);
        }
      } catch (error) {
        result.failedTo.push(phoneNumber);
        const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
        result.errors.push(`${phoneNumber}: ${errorMessage}`);
        console.error(`خطأ في إرسال التقرير إلى ${phoneNumber}:`, error);
      }
    }

    result.success = result.sentTo.length > 0;
    
    console.log(`انتهى إرسال التقرير. نجح: ${result.sentTo.length}, فشل: ${result.failedTo.length}`);
    
    return result;
  }

  /**
   * إرسال تقرير فوري مع إمكانية تخصيص الأرقام
   */
  async sendInstantReport(
    report: ScheduledReport, 
    customNumbers?: string[],
    pdfContent?: string
  ): Promise<WhatsAppReportResult> {
    const targetsNumbers = customNumbers || TARGET_WHATSAPP_NUMBERS;
    
    const result: WhatsAppReportResult = {
      success: false,
      sentTo: [],
      failedTo: [],
      errors: []
    };

    console.log(`بدء إرسال التقرير الفوري "${report.name}" إلى ${targetsNumbers.length} رقم`);

    for (const phoneNumber of targetsNumbers) {
      try {
        const message = this.generateInstantReportMessage(report);
        const whatsappResult = await twilioWhatsAppService.sendMessage(
          phoneNumber,
          message,
          'instant_report'
        );

        if (whatsappResult.success) {
          result.sentTo.push(phoneNumber);
          console.log(`تم إرسال التقرير الفوري بنجاح إلى ${phoneNumber}`);
        } else {
          result.failedTo.push(phoneNumber);
          result.errors.push(`${phoneNumber}: ${whatsappResult.error}`);
          console.error(`فشل إرسال التقرير الفوري إلى ${phoneNumber}:`, whatsappResult.error);
        }
      } catch (error) {
        result.failedTo.push(phoneNumber);
        const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
        result.errors.push(`${phoneNumber}: ${errorMessage}`);
        console.error(`خطأ في إرسال التقرير الفوري إلى ${phoneNumber}:`, error);
      }
    }

    result.success = result.sentTo.length > 0;
    
    console.log(`انتهى إرسال التقرير الفوري. نجح: ${result.sentTo.length}, فشل: ${result.failedTo.length}`);
    
    return result;
  }

  /**
   * إرسال ملخص يومي لجميع التقارير المجدولة
   */
  async sendDailySummary(reports: ScheduledReport[]): Promise<WhatsAppReportResult> {
    const activeReports = reports.filter(r => r.status === 'active');
    const todayReports = reports.filter(r => {
      const today = new Date().toISOString().split('T')[0];
      return r.nextRunDate === today && r.status === 'active';
    });

    const message = this.generateDailySummaryMessage(activeReports, todayReports);

    const result: WhatsAppReportResult = {
      success: false,
      sentTo: [],
      failedTo: [],
      errors: []
    };

    for (const phoneNumber of TARGET_WHATSAPP_NUMBERS) {
      try {
        const whatsappResult = await twilioWhatsAppService.sendMessage(
          phoneNumber,
          message,
          'daily_summary'
        );

        if (whatsappResult.success) {
          result.sentTo.push(phoneNumber);
        } else {
          result.failedTo.push(phoneNumber);
          result.errors.push(`${phoneNumber}: ${whatsappResult.error}`);
        }
      } catch (error) {
        result.failedTo.push(phoneNumber);
        const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
        result.errors.push(`${phoneNumber}: ${errorMessage}`);
      }
    }

    result.success = result.sentTo.length > 0;
    return result;
  }

  /**
   * إنشاء رسالة التقرير المجدول
   */
  private generateReportMessage(report: ScheduledReport): string {
    const reportTypeNames = {
      fleet: '🚗 تقرير الأسطول',
      financial: '💰 التقرير المالي',
      customers: '👥 تقرير العملاء',
      maintenance: '🔧 تقرير الصيانة',
      legal: '⚖️ التقرير القانوني'
    };

    const frequencyNames = {
      daily: 'يومي',
      weekly: 'أسبوعي',
      monthly: 'شهري',
      quarterly: 'ربع سنوي'
    };

    const currentDate = new Date().toLocaleDateString('ar-QA');
    const currentTime = new Date().toLocaleTimeString('ar-QA', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    return `*📊 تقرير مجدول - شركة العراف للتأجير*

السلام عليكم ورحمة الله وبركاته،

📋 *اسم التقرير:* ${report.name}
📊 *نوع التقرير:* ${reportTypeNames[report.type] || report.type}
⏰ *التكرار:* ${frequencyNames[report.frequency] || report.frequency}
📅 *تاريخ الإنشاء:* ${currentDate}
🕐 *وقت الإنشاء:* ${currentTime}

✅ تم إنشاء التقرير بنجاح وهو متاح للمراجعة في النظام.

🔗 يمكنكم الوصول للتقرير الكامل عبر النظام الإلكتروني في قسم "التقارير المجدولة".

📧 *عدد المستلمين:* ${report.recipients.length} مستلم

---
*شركة العراف لتأجير السيارات*
📱 للاستفسارات: اتصلوا بفريق الدعم الفني`;
  }

  /**
   * إنشاء رسالة التقرير الفوري
   */
  private generateInstantReportMessage(report: ScheduledReport): string {
    const reportTypeNames = {
      fleet: '🚗 تقرير الأسطول',
      financial: '💰 التقرير المالي',
      customers: '👥 تقرير العملاء',
      maintenance: '🔧 تقرير الصيانة',
      legal: '⚖️ التقرير القانوني'
    };

    const currentDate = new Date().toLocaleDateString('ar-QA');
    const currentTime = new Date().toLocaleTimeString('ar-QA', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    return `*⚡ تقرير فوري - شركة العراف للتأجير*

السلام عليكم ورحمة الله وبركاته،

📋 *اسم التقرير:* ${report.name}
📊 *نوع التقرير:* ${reportTypeNames[report.type] || report.type}
⚡ *نوع الإنشاء:* تقرير فوري (بطلب خاص)
📅 *تاريخ الإنشاء:* ${currentDate}
🕐 *وقت الإنشاء:* ${currentTime}

✅ تم إنشاء التقرير الفوري بنجاح بناءً على طلبكم.

💡 هذا التقرير تم إنشاؤه خارج الجدولة الاعتيادية للمراجعة العاجلة.

🔗 يمكنكم الوصول للتقرير الكامل عبر النظام الإلكتروني.

---
*شركة العراف لتأجير السيارات*
📱 للاستفسارات: اتصلوا بفريق الدعم الفني`;
  }

  /**
   * إنشاء رسالة الملخص اليومي
   */
  private generateDailySummaryMessage(activeReports: ScheduledReport[], todayReports: ScheduledReport[]): string {
    const currentDate = new Date().toLocaleDateString('ar-QA');
    const currentTime = new Date().toLocaleTimeString('ar-QA', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    let todayList = '';
    if (todayReports.length > 0) {
      todayList = todayReports.map((report, index) => 
        `${index + 1}. ${report.name}`
      ).join('\n');
    } else {
      todayList = 'لا توجد تقارير مجدولة لليوم';
    }

    return `*📈 ملخص التقارير اليومي - شركة العراف للتأجير*

السلام عليكم ورحمة الله وبركاته،

📅 *تاريخ الملخص:* ${currentDate}
🕐 *وقت الإنشاء:* ${currentTime}

📊 *إحصائيات التقارير:*
• إجمالي التقارير النشطة: *${activeReports.length}* تقرير
• التقارير المقررة اليوم: *${todayReports.length}* تقرير

📋 *التقارير المقررة اليوم:*
${todayList}

✅ جميع التقارير المجدولة تعمل بانتظام ويتم إنشاؤها تلقائياً.

🔗 للمراجعة التفصيلية، يرجى زيارة قسم "التقارير المجدولة" في النظام.

---
*شركة العراف لتأجير السيارات*
📱 إدارة النظام الإلكتروني`;
  }

  /**
   * إرسال تنبيه عند فشل تقرير مجدول
   */
  async sendReportFailureAlert(report: ScheduledReport, error: string): Promise<WhatsAppReportResult> {
    const message = this.generateFailureAlertMessage(report, error);

    const result: WhatsAppReportResult = {
      success: false,
      sentTo: [],
      failedTo: [],
      errors: []
    };

    for (const phoneNumber of TARGET_WHATSAPP_NUMBERS) {
      try {
        const whatsappResult = await twilioWhatsAppService.sendMessage(
          phoneNumber,
          message,
          'report_failure'
        );

        if (whatsappResult.success) {
          result.sentTo.push(phoneNumber);
        } else {
          result.failedTo.push(phoneNumber);
          result.errors.push(`${phoneNumber}: ${whatsappResult.error}`);
        }
      } catch (error) {
        result.failedTo.push(phoneNumber);
        const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
        result.errors.push(`${phoneNumber}: ${errorMessage}`);
      }
    }

    result.success = result.sentTo.length > 0;
    return result;
  }

  /**
   * إنشاء رسالة تنبيه الفشل
   */
  private generateFailureAlertMessage(report: ScheduledReport, error: string): string {
    const currentDate = new Date().toLocaleDateString('ar-QA');
    const currentTime = new Date().toLocaleTimeString('ar-QA', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    return `*⚠️ تنبيه: فشل في إنشاء تقرير مجدول*

السلام عليكم ورحمة الله وبركاته،

🚨 *نوع التنبيه:* فشل في إنشاء تقرير
📋 *اسم التقرير:* ${report.name}
📅 *التاريخ:* ${currentDate}
🕐 *الوقت:* ${currentTime}

❌ *سبب الفشل:*
${error}

🔧 *الإجراء المطلوب:*
يرجى مراجعة النظام وإعادة تشغيل التقرير يدوياً.

🔗 انتقلوا إلى قسم "التقارير المجدولة" لاتخاذ الإجراء اللازم.

---
*شركة العراف لتأجير السيارات*
📱 فريق الدعم الفني`;
  }

  /**
   * الحصول على الأرقام المستهدفة
   */
  getTargetNumbers(): string[] {
    return [...TARGET_WHATSAPP_NUMBERS];
  }

  /**
   * إضافة رقم جديد للقائمة (مؤقتاً لهذه الجلسة)
   */
  addTemporaryNumber(phoneNumber: string): boolean {
    if (!TARGET_WHATSAPP_NUMBERS.includes(phoneNumber)) {
      TARGET_WHATSAPP_NUMBERS.push(phoneNumber);
      return true;
    }
    return false;
  }

  /**
   * إزالة رقم من القائمة (مؤقتاً لهذه الجلسة)
   */
  removeTemporaryNumber(phoneNumber: string): boolean {
    const index = TARGET_WHATSAPP_NUMBERS.indexOf(phoneNumber);
    if (index > -1) {
      TARGET_WHATSAPP_NUMBERS.splice(index, 1);
      return true;
    }
    return false;
  }
}

// تصدير instance واحد
export const whatsAppReportsService = new WhatsAppReportsService(); 