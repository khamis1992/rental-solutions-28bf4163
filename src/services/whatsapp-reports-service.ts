class WhatsAppReportsService {
  private targetNumbers = ['+97466707063', '+97470598989'];
  private supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  
  async sendScheduledReport(reportData: {
    reportName: string;
    reportType: string;
    generatedAt: string;
    pdfUrl?: string;
    reportSize?: string;
  }) {
    const results = [];
    
    for (const phoneNumber of this.targetNumbers) {
      try {
        console.log(`إرسال تقرير إلى: ${phoneNumber}`);
        
        const result = await this.sendReportWithPDF(phoneNumber, reportData);
        
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

  private async sendReportWithPDF(phoneNumber: string, reportData: {
    reportName: string;
    reportType: string;
    generatedAt: string;
    pdfUrl?: string;
    reportSize?: string;
  }) {
    try {
      const response = await fetch(`${this.supabaseUrl}/functions/v1/send-whatsapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          to: phoneNumber,
          messageType: 'report_with_pdf',
          variables: {
            '1': reportData.reportName,
            '2': this.getReportTypeArabic(reportData.reportType),
            '3': this.formatDate(reportData.generatedAt),
            '4': this.formatTime(reportData.generatedAt),
            '5': reportData.reportSize || 'غير محدد'
          },
          mediaUrl: reportData.pdfUrl
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.log('فشل إرسال القالب، محاولة إرسال رسالة نصية...');
        return await this.sendReportAsText(phoneNumber, reportData);
      }

      return {
        success: true,
        message: 'تم إرسال التقرير مع ملف PDF بنجاح',
        messageId: result.messageId
      };

    } catch (error) {
      console.error('خطأ في إرسال التقرير مع PDF:', error);
      return await this.sendReportAsText(phoneNumber, reportData);
    }
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
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          to: phoneNumber,
          messageType: 'general',
          body: arabicMessage
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'فشل في إرسال الرسالة');
      }

      return {
        success: true,
        message: 'تم إرسال التقرير كرسالة نصية',
        messageId: result.messageId
      };

    } catch (error) {
      throw new Error(`فشل إرسال الرسالة النصية: ${error.message}`);
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
    
    message += `\n🔍 *حالة التقرير:* جاهز للتحميل\n`;
    
    if (reportData.pdfUrl) {
      message += `\n📥 *رابط التحميل:*\n${reportData.pdfUrl}\n`;
    }
    
    message += `\n---\n`;
    message += `🏢 شركة الأرف لتأجير السيارات\n`;
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
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ test: true })
      });

      const result = await response.json();
      return result.success;
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