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
   * الحصول على الأرقام المستهدفة
   */
  getTargetNumbers(): string[] {
    return [...TARGET_WHATSAPP_NUMBERS];
  }
}

// تصدير instance واحد
export const whatsAppReportsService = new WhatsAppReportsService(); 