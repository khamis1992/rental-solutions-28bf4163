import { supabase } from '@/lib/supabase';
import { CarInstallmentPayment, CarInstallmentContract } from '@/types/car-installment';

export interface NotificationChannel {
  type: 'sms' | 'email' | 'push' | 'whatsapp';
  enabled: boolean;
  address: string; // phone number, email, device token, etc.
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'overdue_payment' | 'payment_reminder' | 'payment_received' | 'contract_completed';
  language: 'ar' | 'en';
  subject?: string; // for email
  message: string;
  variables: string[]; // placeholders like {customerName}, {amount}, etc.
}

export interface NotificationPreferences {
  userId: string;
  channels: NotificationChannel[];
  templates: NotificationTemplate[];
  reminderDays: number[]; // days before due date to send reminders
  overdueReminderFrequency: 'daily' | 'weekly' | 'monthly';
  timezone: string;
}

export class MobileNotificationService {
  
  // Default templates in Arabic and English
  private defaultTemplates: NotificationTemplate[] = [
    {
      id: 'overdue_ar',
      name: 'تذكير بدفعة متأخرة',
      type: 'overdue_payment',
      language: 'ar',
      subject: 'تذكير بدفعة متأخرة - {carType}',
      message: 'عزيزي {customerName}، دفعة بقيمة {amount} ريال قطري متأخرة {daysOverdue} يوم لعقد {carType}. يرجى السداد في أقرب وقت ممكن.',
      variables: ['customerName', 'amount', 'daysOverdue', 'carType']
    },
    {
      id: 'overdue_en',
      name: 'Overdue Payment Reminder',
      type: 'overdue_payment',
      language: 'en',
      subject: 'Overdue Payment Reminder - {carType}',
      message: 'Dear {customerName}, your payment of {amount} QAR is {daysOverdue} days overdue for {carType} contract. Please make payment as soon as possible.',
      variables: ['customerName', 'amount', 'daysOverdue', 'carType']
    },
    {
      id: 'reminder_ar',
      name: 'تذكير بدفعة قادمة',
      type: 'payment_reminder',
      language: 'ar',
      subject: 'تذكير بدفعة قادمة - {carType}',
      message: 'عزيزي {customerName}، دفعة بقيمة {amount} ريال قطري مستحقة خلال {daysUntilDue} يوم لعقد {carType}.',
      variables: ['customerName', 'amount', 'daysUntilDue', 'carType']
    },
    {
      id: 'reminder_en',
      name: 'Payment Reminder',
      type: 'payment_reminder',
      language: 'en',
      subject: 'Payment Reminder - {carType}',
      message: 'Dear {customerName}, your payment of {amount} QAR is due in {daysUntilDue} days for {carType} contract.',
      variables: ['customerName', 'amount', 'daysUntilDue', 'carType']
    },
    {
      id: 'received_ar',
      name: 'تأكيد استلام الدفعة',
      type: 'payment_received',
      language: 'ar',
      subject: 'تم استلام دفعتك - {carType}',
      message: 'عزيزي {customerName}، تم استلام دفعة بقيمة {amount} ريال قطري بنجاح لعقد {carType}. شكراً لك.',
      variables: ['customerName', 'amount', 'carType']
    },
    {
      id: 'received_en',
      name: 'Payment Received Confirmation',
      type: 'payment_received',
      language: 'en',
      subject: 'Payment Received - {carType}',
      message: 'Dear {customerName}, we have successfully received your payment of {amount} QAR for {carType} contract. Thank you.',
      variables: ['customerName', 'amount', 'carType']
    }
  ];

  // Send SMS notification
  async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
    try {
      // This would integrate with SMS providers like Twilio, AWS SNS, etc.
      // For now, we'll simulate the SMS sending
      
      console.log(`SMS to ${phoneNumber}: ${message}`);
      
      // In a real implementation, you would call the SMS API here
      // Example with Twilio:
      // const client = twilio(accountSid, authToken);
      // await client.messages.create({
      //   body: message,
      //   from: '+1234567890',
      //   to: phoneNumber
      // });

      // Log the notification
      await this.logNotification('sms', phoneNumber, message, 'sent');
      
      return true;
    } catch (error) {
      console.error('Error sending SMS:', error);
      await this.logNotification('sms', phoneNumber, message, 'failed');
      return false;
    }
  }

  // Send email notification
  async sendEmail(email: string, subject: string, message: string): Promise<boolean> {
    try {
      // This would integrate with email providers like SendGrid, AWS SES, etc.
      // For now, we'll simulate the email sending
      
      console.log(`Email to ${email}: ${subject}\n${message}`);
      
      // In a real implementation, you would call the email API here
      // Example with SendGrid:
      // const msg = {
      //   to: email,
      //   from: 'noreply@yourcompany.com',
      //   subject: subject,
      //   text: message,
      //   html: `<p>${message}</p>`
      // };
      // await sgMail.send(msg);

      // Log the notification
      await this.logNotification('email', email, `${subject}\n${message}`, 'sent');
      
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      await this.logNotification('email', email, `${subject}\n${message}`, 'failed');
      return false;
    }
  }

  // Send WhatsApp notification
  async sendWhatsApp(phoneNumber: string, message: string): Promise<boolean> {
    try {
      // This would integrate with WhatsApp Business API
      console.log(`WhatsApp to ${phoneNumber}: ${message}`);
      
      // Log the notification
      await this.logNotification('whatsapp', phoneNumber, message, 'sent');
      
      return true;
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      await this.logNotification('whatsapp', phoneNumber, message, 'failed');
      return false;
    }
  }

  // Send push notification
  async sendPushNotification(deviceToken: string, title: string, message: string): Promise<boolean> {
    try {
      // This would integrate with Firebase Cloud Messaging or similar
      console.log(`Push to ${deviceToken}: ${title}\n${message}`);
      
      // Log the notification
      await this.logNotification('push', deviceToken, `${title}\n${message}`, 'sent');
      
      return true;
    } catch (error) {
      console.error('Error sending push notification:', error);
      await this.logNotification('push', deviceToken, `${title}\n${message}`, 'failed');
      return false;
    }
  }

  // Get user notification preferences
  async getUserPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        // Return default preferences
        return {
          userId,
          channels: [
            { type: 'sms', enabled: true, address: '' },
            { type: 'email', enabled: true, address: '' }
          ],
          templates: this.defaultTemplates,
          reminderDays: [7, 3, 1],
          overdueReminderFrequency: 'weekly',
          timezone: 'Asia/Qatar'
        };
      }

      return data as NotificationPreferences;
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return null;
    }
  }

  // Update user notification preferences
  async updateUserPreferences(preferences: NotificationPreferences): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert(preferences)
        .eq('user_id', preferences.userId);

      return !error;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return false;
    }
  }

  // Send notification using template
  async sendTemplatedNotification(
    userId: string,
    templateType: NotificationTemplate['type'],
    variables: Record<string, string>,
    language: 'ar' | 'en' = 'ar'
  ): Promise<boolean> {
    try {
      const preferences = await this.getUserPreferences(userId);
      if (!preferences) return false;

      const template = preferences.templates.find(
        t => t.type === templateType && t.language === language
      ) || this.defaultTemplates.find(
        t => t.type === templateType && t.language === language
      );

      if (!template) return false;

      // Replace variables in template
      let message = template.message;
      let subject = template.subject || '';

      for (const [key, value] of Object.entries(variables)) {
        const placeholder = `{${key}}`;
        message = message.replace(new RegExp(placeholder, 'g'), value);
        subject = subject.replace(new RegExp(placeholder, 'g'), value);
      }

      // Send through enabled channels
      const results: boolean[] = [];

      for (const channel of preferences.channels) {
        if (!channel.enabled || !channel.address) continue;

        switch (channel.type) {
          case 'sms':
            results.push(await this.sendSMS(channel.address, message));
            break;
          case 'email':
            results.push(await this.sendEmail(channel.address, subject, message));
            break;
          case 'whatsapp':
            results.push(await this.sendWhatsApp(channel.address, message));
            break;
          case 'push':
            results.push(await this.sendPushNotification(channel.address, subject, message));
            break;
        }
      }

      return results.some(result => result);
    } catch (error) {
      console.error('Error sending templated notification:', error);
      return false;
    }
  }

  // Send overdue payment notification
  async sendOverdueNotification(
    payment: CarInstallmentPayment,
    contract: CarInstallmentContract,
    customerName: string,
    language: 'ar' | 'en' = 'ar'
  ): Promise<boolean> {
    const paymentDate = new Date(payment.payment_date);
    const today = new Date();
    const daysOverdue = Math.floor((today.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24));

    const variables = {
      customerName,
      amount: payment.amount.toString(),
      daysOverdue: daysOverdue.toString(),
      carType: contract.car_type || 'Vehicle'
    };

    return await this.sendTemplatedNotification(
      contract.customer_id || '',
      'overdue_payment',
      variables,
      language
    );
  }

  // Send payment reminder notification
  async sendPaymentReminder(
    payment: CarInstallmentPayment,
    contract: CarInstallmentContract,
    customerName: string,
    language: 'ar' | 'en' = 'ar'
  ): Promise<boolean> {
    const paymentDate = new Date(payment.payment_date);
    const today = new Date();
    const daysUntilDue = Math.ceil((paymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const variables = {
      customerName,
      amount: payment.amount.toString(),
      daysUntilDue: daysUntilDue.toString(),
      carType: contract.car_type || 'Vehicle'
    };

    return await this.sendTemplatedNotification(
      contract.customer_id || '',
      'payment_reminder',
      variables,
      language
    );
  }

  // Send payment received confirmation
  async sendPaymentReceivedNotification(
    payment: CarInstallmentPayment,
    contract: CarInstallmentContract,
    customerName: string,
    language: 'ar' | 'en' = 'ar'
  ): Promise<boolean> {
    const variables = {
      customerName,
      amount: (payment.paid_amount || payment.amount).toString(),
      carType: contract.car_type || 'Vehicle'
    };

    return await this.sendTemplatedNotification(
      contract.customer_id || '',
      'payment_received',
      variables,
      language
    );
  }

  // Log notification for tracking
  private async logNotification(
    type: string,
    recipient: string,
    message: string,
    status: 'sent' | 'failed'
  ): Promise<void> {
    try {
      await supabase
        .from('notification_logs')
        .insert({
          type,
          recipient,
          message,
          status,
          sent_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error logging notification:', error);
    }
  }

  // Get notification statistics
  async getNotificationStats(userId: string, days: number = 30): Promise<{
    totalSent: number;
    totalFailed: number;
    byType: Record<string, number>;
    byChannel: Record<string, number>;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('notification_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('sent_at', startDate.toISOString());

      if (error || !data) {
        return {
          totalSent: 0,
          totalFailed: 0,
          byType: {},
          byChannel: {}
        };
      }

      const stats = {
        totalSent: data.filter(n => n.status === 'sent').length,
        totalFailed: data.filter(n => n.status === 'failed').length,
        byType: {} as Record<string, number>,
        byChannel: {} as Record<string, number>
      };

      // Group by type and channel
      data.forEach(notification => {
        stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
        stats.byChannel[notification.type] = (stats.byChannel[notification.type] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return {
        totalSent: 0,
        totalFailed: 0,
        byType: {},
        byChannel: {}
      };
    }
  }
}

export const mobileNotificationService = new MobileNotificationService(); 