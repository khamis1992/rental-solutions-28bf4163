/**
 * Twilio WhatsApp Service for sending WhatsApp messages
 * 
 * Following Twilio WhatsApp Business API Documentation:
 * https://www.twilio.com/docs/whatsapp/quickstart
 * 
 * Required Environment Variables:
 * - VITE_TWILIO_ACCOUNT_SID: Your Twilio Account SID (starts with 'AC')
 * - VITE_TWILIO_AUTH_TOKEN: Your Twilio Auth Token
 * - VITE_TWILIO_WHATSAPP_NUMBER: Your Twilio WhatsApp number (format: whatsapp:+14155238886)
 * 
 * Example usage:
 * ```
 * import { twilioWhatsAppService } from '@/services/TwilioWhatsAppService';
 * 
 * const result = await twilioWhatsAppService.sendPaymentReminder(
 *   '+97450000000',
 *   'أحمد محمد',
 *   500,
 *   '2024-01-15',
 *   'تأجير سيارة'
 * );
 * 
 * if (result.success) {
 *   console.log('Message sent successfully:', result.messageId);
 * } else {
 *   console.error('Failed to send message:', result.error);
 * }
 * ```
 * 
 * Message Format:
 * - All messages use the 'whatsapp:' prefix as required by Twilio
 * - Phone numbers are automatically formatted for Qatar (+974)
 * - Messages are logged to Supabase database for tracking
 * - Cost is calculated based on Twilio pricing ($0.005 per segment)
 */
import { supabase } from '@/lib/supabase';

// --- INTERFACES AND TYPES ---
export interface WhatsAppMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// --- SERVICE CLASS ---
export class TwilioWhatsAppService {
  constructor() {
    console.log("[WhatsApp Service] Client module initialized. Ready to proxy to Supabase Edge Function.");
  }

  // --- PUBLIC API METHODS ---

  /**
   * Sends a pre-defined payment reminder message using a WhatsApp template.
   */
  async sendPaymentReminder(
    customerPhone: string,
    customerName: string,
    amount: number,
    dueDate: string,
    contractType: string
  ): Promise<WhatsAppMessageResult> {
    const variables = {
      '1': customerName,
      '2': String(amount),
      '3': dueDate,
      '4': contractType,
    };
    // The 'body' is now just for logging purposes, the server will use the template.
    const logBody = `Payment reminder for ${customerName}, Amount: ${amount}`;
    return this.sendMessage(customerPhone, logBody, 'payment_reminder', variables);
  }

  /**
   * Sends a pre-defined overdue payment alert.
   */
  async sendOverduePaymentAlert(
    customerPhone: string,
    customerName: string,
    amount: number,
    daysOverdue: number,
    contractType: string
  ): Promise<WhatsAppMessageResult> {
    const body = this.getOverduePaymentAlertText(customerName, amount, daysOverdue, contractType);
    return this.sendMessage(customerPhone, body, 'overdue_payment');
  }

  /**
   * Sends a pre-defined payment confirmation message.
   */
  async sendPaymentConfirmation(
    customerPhone: string,
    customerName: string,
    amount: number,
    paymentDate: string,
    contractType: string,
    receiptNumber?: string
  ): Promise<WhatsAppMessageResult> {
    const body = this.getPaymentConfirmationText(customerName, amount, paymentDate, contractType, receiptNumber);
    return this.sendMessage(customerPhone, body, 'payment_received');
  }

  /**
   * إرسال تذكير دفعة شهرية (28 من كل شهر)
   */
  async sendMonthlyReminder(
    customerPhone: string,
    customerName: string,
    amount: number,
    dueDate: string,
    contractNumber: string,
    remainingInstallments: number
  ): Promise<WhatsAppMessageResult> {
    const variables = {
      '1': customerName,
      '2': String(amount),
      '3': dueDate,
      '4': contractNumber,
      '5': String(remainingInstallments),
    };
    const logBody = `Monthly reminder for ${customerName}, Amount: ${amount}, Due: ${dueDate}`;
    return this.sendMessage(customerPhone, logBody, 'monthly_reminder', variables);
  }

  /**
   * إرسال إنذار غرامة تأخير (1 من كل شهر)
   */
  async sendDelayPenalty(
    customerPhone: string,
    customerName: string,
    overdueAmount: number,
    penaltyAmount: number,
    daysOverdue: number,
    contractNumber: string,
    totalDue: number
  ): Promise<WhatsAppMessageResult> {
    const variables = {
      '1': customerName,
      '2': String(overdueAmount),
      '3': String(penaltyAmount),
      '4': String(daysOverdue),
      '5': contractNumber,
      '6': String(totalDue),
    };
    const logBody = `Delay penalty notice for ${customerName}, Overdue: ${overdueAmount}, Penalty: ${penaltyAmount}`;
    return this.sendMessage(customerPhone, logBody, 'delay_penalty', variables);
  }

  /**
   * إرسال إنذار نهائي قانوني
   */
  async sendFinalWarning(
    customerPhone: string,
    customerName: string,
    totalDue: number,
    contractNumber: string,
    daysOverdue: number
  ): Promise<WhatsAppMessageResult> {
    const variables = {
      '1': customerName,
      '2': String(totalDue),
      '3': contractNumber,
      '4': String(daysOverdue),
    };
    const logBody = `Final legal warning for ${customerName}, Total due: ${totalDue}`;
    return this.sendMessage(customerPhone, logBody, 'final_warning', variables);
  }

  /**
   * إرسال إنذار إجراء قانوني (24 ساعة)
   */
  async sendLegalAction(
    customerPhone: string,
    customerName: string,
    totalDue: number,
    contractNumber: string,
    vehicleDetails: string
  ): Promise<WhatsAppMessageResult> {
    const variables = {
      '1': customerName,
      '2': String(totalDue),
      '3': contractNumber,
      '4': vehicleDetails,
    };
    const logBody = `Legal action notice for ${customerName}, Total due: ${totalDue}`;
    return this.sendMessage(customerPhone, logBody, 'legal_action', variables);
  }

  /**
   * إرسال تقرير يومي للمدير العام (أيام 1-10 من كل شهر)
   */
  async sendManagerReport(
    managerPhone: string,
    managerName: string,
    reportDate: string,
    totalCollections: number,
    overduePayments: number,
    newContracts: number,
    totalRevenue: number,
    activeVehicles: number
  ): Promise<WhatsAppMessageResult> {
    const variables = {
      '1': managerName,
      '2': reportDate,
      '3': String(totalCollections),
      '4': String(overduePayments),
      '5': String(newContracts),
      '6': String(totalRevenue),
      '7': String(activeVehicles),
    };
    const logBody = `Daily manager report for ${managerName}, Date: ${reportDate}`;
    return this.sendMessage(managerPhone, logBody, 'manager_report', variables);
  }

  /**
   * Core method to securely invoke the Supabase Edge Function.
   * This is the only method that communicates with the backend.
   * It now supports sending template variables.
   */
  async sendMessage(
    to: string,
    body: string, // Kept for logging purposes
    messageType: string = 'general',
    variables?: Record<string, string>
  ): Promise<WhatsAppMessageResult> {
    const formattedTo = this.formatQatarPhone(to);

    try {
      console.log('Calling send-whatsapp function with:', { to: formattedTo, messageType, variables });

      // Securely call the serverless function.
      // Credentials are now stored as secrets on the server-side for production.
      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: { 
          to: formattedTo, 
          body, // Sent for logging and backward compatibility
          messageType,
          variables, // The template variables
        },
      });

      console.log('Function response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        
        // Handle specific error cases with user-friendly messages
        if (error.message?.includes('Edge Function returned a non-2xx status code')) {
          throw new Error('خدمة الواتساب غير متاحة حالياً. تحقق من إعدادات Twilio في Supabase.');
        }
        
        throw new Error(`Function invocation failed: ${error.message}`);
      }
      
      if (!data) {
        throw new Error('لم يتم استلام رد من خدمة الواتساب');
      }

      if (!data.success) {
        console.error('Function returned error:', data);
        
        // Handle common Twilio errors with Arabic messages
        if (data.error?.includes('Twilio secrets not configured')) {
          throw new Error('لم يتم تكوين بيانات Twilio في Supabase. يرجى إعداد الـ Function Secrets.');
        }
        
        if (data.error?.includes('21211')) {
          throw new Error('رقم الهاتف غير صحيح. تأكد من الصيغة الدولية.');
        }
        
        if (data.error?.includes('21614')) {
          throw new Error('رقم الواتساب غير مفعل أو غير مشترك في الخدمة.');
        }
        
        throw new Error(data.error || 'خطأ غير معروف في خدمة الواتساب');
      }
      
      // Log success for client-side UI statistics
      await this.logMessageToDB(formattedTo, body, messageType, 'sent', data.messageId);

      return { success: true, messageId: data.messageId };

    } catch (err: any) {
      console.error('Error invoking send-whatsapp function:', err);
      
      // Log failure for client-side UI statistics
      await this.logMessageToDB(formattedTo, body, messageType, 'failed', '', err.message);
      
      // Return user-friendly error messages
      let userError = err.message;
      if (err.message?.includes('FunctionsHttpError')) {
        userError = 'خدمة الواتساب غير متاحة حالياً. تحقق من إعدادات النظام.';
      }
      
      return { success: false, error: userError };
    }
  }

  /**
   * Retrieves stats from the client-side logs for UI display.
   */
  async getWhatsAppStats(days: number = 30): Promise<{
    totalSent: number;
    totalFailed: number;
    totalCost: number;
    byType: Record<string, number>;
  }> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('status, message_type, cost')
        .gte('sent_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

      if (error) {
        console.warn("Error getting WhatsApp stats:", error.message);
        return { totalSent: 0, totalFailed: 0, totalCost: 0, byType: {} };
      }

      if (!data) {
        return { totalSent: 0, totalFailed: 0, totalCost: 0, byType: {} };
      }
      
      const stats = {
        totalSent: data.filter(m => m.status === 'sent').length,
        totalFailed: data.filter(m => m.status === 'failed').length,
        totalCost: data.reduce((sum, m) => sum + (m.cost || 0), 0),
        byType: {} as Record<string, number>
      };

      data.forEach(message => {
        stats.byType[message.message_type] = (stats.byType[message.message_type] || 0) + 1;
      });

      return stats;
    } catch (err) {
      console.warn("Error fetching WhatsApp stats:", err);
      return { totalSent: 0, totalFailed: 0, totalCost: 0, byType: {} };
    }
  }

  /**
   * Checks if the WhatsApp service is properly configured on the server.
   */
  async getServiceStatus(): Promise<{
    available: boolean;
    error?: string;
  }> {
    try {
      console.log("[WhatsApp Service] Checking service status...");
      
      // Test connection by trying to call the edge function with a test flag.
      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: { test: true }
      });

      console.log("[WhatsApp Service] Status check response:", { data, error });

      if (error) {
        console.error("[WhatsApp Service] Error during status check:", error);
        
        // Handle different types of errors gracefully
        if (error.message?.includes('Edge Function returned a non-2xx status code')) {
      return {
        available: false,
            error: 'خدمة الواتساب غير مكونة بشكل صحيح. يرجى التحقق من Edge Function والـ Secrets.'
      };
    }

        if (error.message?.includes('FunctionsHttpError')) {
      return {
        available: false,
            error: 'وظيفة الواتساب غير متاحة في Supabase أو تحتاج إعادة نشر.'
          };
        }
        
        return {
          available: false,
          error: `خطأ في الخدمة: ${error.message}`
        };
      }
      
      if (data && !data.success) {
        console.warn("[WhatsApp Service] Service returned failure:", data);
        return {
          available: false,
          error: data.error || 'بيانات Twilio غير مكونة في الخادم.'
        };
      }

      console.log("[WhatsApp Service] Service is available and working!");
      return { available: true };

    } catch (err: any) {
      console.error("[WhatsApp Service] Exception during status check:", err);
      
      // Return user-friendly error messages instead of throwing
      let errorMessage = 'خدمة الواتساب غير متاحة حالياً';
      
      if (err.message?.includes('credentials')) {
        errorMessage = 'بيانات Twilio غير مكونة في النظام';
      } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
        errorMessage = 'مشكلة في الاتصال بخدمة الواتساب';
      }
      
      return {
        available: false,
        error: errorMessage
      };
    }
  }

  // --- PRIVATE HELPERS ---

  /**
   * Logs message status to the database for UI tracking.
   */
  private async logMessageToDB(
    phoneNumber: string, message: string, messageType: string,
    status: 'sent' | 'failed', messageId?: string, errorMessage?: string
  ): Promise<void> {
    try {
      const { error } = await supabase.from('whatsapp_messages').insert({
        phone_number: phoneNumber,
        message_content: message,
        message_type: messageType,
        status,
        twilio_message_id: messageId,
        error_message: errorMessage,
        sent_at: new Date().toISOString(),
        cost: 0 // Cost is now a server-side concern
      });
      
      if (error) {
        console.warn('Failed to log message to database:', error.message);
        // Don't throw error to avoid blocking main functionality
      }
    } catch (err) {
      console.warn('Failed to log message to database:', err);
      // Don't throw error to avoid blocking main functionality
    }
  }

  /**
   * Formats a phone number to E.164 format for Qatar.
   */
  private formatQatarPhone(phone: string): string {
    const cleanPhone = phone.replace(/[^\d]/g, '');
    return cleanPhone.startsWith('974') ? `+${cleanPhone}` : `+974${cleanPhone}`;
  }

  // --- MESSAGE TEMPLATE GENERATORS ---

  private getOverduePaymentAlertText(name: string, amount: number, days: number, type: string): string {
    const urgency = days > 30 ? '*عاجل جداً*' : '*مهم*';
    return `${urgency}\n\nالسلام عليكم ${name},\n\nدفعة بقيمة *${amount} ريال قطري* متأخرة *${days} يوم* لعقد ${type}.\n\nيرجى المبادرة بالسداد فوراً لتجنب الإجراءات القانونية.\n\n*شركة العراف للتأجير*`;
  }

  private getPaymentConfirmationText(name: string, amount: number, date: string, type: string, receipt?: string): string {
    return `*تم استلام الدفعة بنجاح*\n\nالسلام عليكم ${name},\n\nتم استلام دفعتكم بنجاح:\n\n*المبلغ*: ${amount} ريال قطري\n*تاريخ الدفع*: ${date}\n*نوع العقد*: ${type}${receipt ? `\n*رقم الإيصال*: ${receipt}` : ''}\n\nشكراً لكم على التزامكم.\n*شركة العراف للتأجير*`;
  }
}

// --- SINGLETON EXPORT ---
export const twilioWhatsAppService = new TwilioWhatsAppService();
