
class WhatsAppReportsService {
  private targetNumbers = ['+97466707063', '+97470598989'];
  private supabaseUrl = 'https://vqdlsidkucrownbfuouq.supabase.co';
  
  async sendScheduledReport(reportData: {
    reportName: string;
    reportType: string;
    generatedAt: string;
    pdfUrl?: string;
    reportSize?: string;
  }) {
    const results = [];
    
    // First check if service is configured
    const serviceReady = await this.testConnection();
    if (!serviceReady) {
      console.error('WhatsApp service is not configured properly');
      return [{
        phone: 'service_error',
        success: false,
        message: 'WhatsApp service is not configured. Please check the setup.'
      }];
    }
    
    for (const phoneNumber of this.targetNumbers) {
      try {
        console.log(`إرسال تقرير إلى: ${phoneNumber}`);
        
        const result = await this.sendReportAsText(phoneNumber, reportData);
        
        results.push({
          phone: phoneNumber,
          success: result.success,
          message: result.message || 'تم الإرسال بنجاح'
        });
        
      } catch (error) {
        console.error(`فشل إرسال التقرير إلى ${phoneNumber}:`, error);
        results.push({
          phone: phoneNumber,
          success: false,
          message: `فشل الإرسال: ${error.message}`
        });
      }
    }
    
    return results;
  }

  private async sendReportAsText(phoneNumber: string, reportData: {
    reportName: string;
    reportType: string;
    generatedAt: string;
    pdfUrl?: string;
    reportSize?: string;
  }) {
    const arabicMessage = this.createArabicReportMessage(reportData);
    
    try {
      const response = await fetch(`${this.supabaseUrl}/functions/v1/send-whatsapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxZGxzaWRrdWNyb3duYmZ1b3VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzMDc4NDgsImV4cCI6MjA0OTg4Mzg0OH0.ARDnjN_J_bz74zQfV7IRDrq6ZL5-xs9L21zI3eG6O5Y`
        },
        body: JSON.stringify({
          to: phoneNumber,
          messageType: 'scheduled_report',
          body: arabicMessage
        })
      });

      const result = await response.json();
      console.log('WhatsApp service response:', result);
      
      if (!response.ok || !result.success) {
        // Handle specific setup errors
        if (result.setup_required) {
          throw new Error('خدمة الواتساب تحتاج إعداد. يرجى مراجعة إعدادات Twilio في Supabase');
        }
        throw new Error(result.error || 'فشل في إرسال الرسالة');
      }

      return {
        success: true,
        message: 'تم إرسال التقرير بنجاح',
        messageId: result.messageId
      };

    } catch (error) {
      console.error('خطأ في إرسال التقرير:', error);
      throw new Error(`فشل إرسال التقرير: ${error.message}`);
    }
  }

  private createArabicReportMessage(reportData: {
    reportName: string;
    reportType: string;
    generatedAt: string;
    pdfUrl?: string;
    reportSize?: string;
  }): string {
    const reportTypeArabic = this.getReportTypeArabic(reportData.reportType);
    const formattedDate = this.formatDate(reportData.generatedAt);
    const formattedTime = this.formatTime(reportData.generatedAt);

    let message = `📊 *تقرير جديد متاح*\n\n`;
    message += `📋 *اسم التقرير:* ${reportData.reportName}\n`;
    message += `📊 *النوع:* ${reportTypeArabic}\n`;
    message += `📅 *تاريخ الإنشاء:* ${formattedDate}\n`;
    message += `⏰ *وقت الإنشاء:* ${formattedTime}\n`;
    
    if (reportData.reportSize) {
      message += `📁 *حجم الملف:* ${reportData.reportSize}\n`;
    }
    
    message += `\n🔍 *حالة التقرير:* جاهز للمراجعة\n`;
    
    if (reportData.pdfUrl) {
      message += `\n📥 *رابط التحميل:*\n${reportData.pdfUrl}\n`;
    }
    
    message += `\n---\n`;
    message += `🏢 شركة العراف لتأجير السيارات\n`;
    message += `📱 نظام التقارير الآلي`;

    return message;
  }

  private getReportTypeArabic(type: string): string {
    const types = {
      'fleet': '🚗 تقرير الأسطول',
      'financial': '💰 التقرير المالي',
      'customers': '👥 تقرير العملاء',
      'maintenance': '🔧 تقرير الصيانة',
      'legal': '⚖️ التقرير القانوني',
      'traffic': '🚦 تقرير المخالفات المرورية'
    };
    return types[type] || `📊 ${type}`;
  }

  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ar-QA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });
    } catch {
      return dateString;
    }
  }

  private formatTime(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('ar-QA', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateString;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.supabaseUrl}/functions/v1/send-whatsapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxZGxzaWRrdWNyb3duYmZ1b3VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzMDc4NDgsImV4cCI6MjA0OTg4Mzg0OH0.ARDnjN_J_bz74zQfV7IRDrq6ZL5-xs9L21zI3eG6O5Y`
        },
        body: JSON.stringify({ test: true })
      });

      const result = await response.json();
      return result.success === true;
    } catch (error) {
      console.error('فشل اختبار الاتصال:', error);
      return false;
    }
  }

  getTargetNumbers(): string[] {
    return [...this.targetNumbers];
  }
}

// Create service instance for named export
export const whatsAppReportsService = new WhatsAppReportsService();

// Default export for compatibility
export default WhatsAppReportsService;
