import { supabase } from '@/lib/supabase';
import { CarInstallmentPayment, CarInstallmentContract } from '@/types/car-installment';
import { toast } from 'sonner';

export interface NotificationData {
  user_id: string;
  type: 'overdue_payment' | 'payment_reminder' | 'contract_completed' | 'payment_received';
  title: string;
  message: string;
  data?: Record<string, any>;
  action_url?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export class NotificationService {
  
  // Check for overdue payments and send notifications
  async checkOverduePayments(): Promise<void> {
    try {
      const { data: overduePayments, error } = await supabase
        .from('car_installment_payments')
        .select(`
          *,
          car_installment_contracts (
            id,
            car_type,
            customer_id
          )
        `)
        .eq('status', 'overdue');

      if (error) {
        console.error('Error fetching overdue payments:', error);
        return;
      }

      for (const payment of overduePayments || []) {
        await this.sendOverdueNotification(payment);
      }
    } catch (error) {
      console.error('Error in checkOverduePayments:', error);
    }
  }
  
  // Send payment reminder notifications
  async sendPaymentReminders(daysAhead: number = 7): Promise<void> {
    try {
      const reminderDate = new Date();
      reminderDate.setDate(reminderDate.getDate() + daysAhead);

      const { data: upcomingPayments, error } = await supabase
        .from('car_installment_payments')
        .select(`
          *,
          car_installment_contracts (
            id,
            car_type,
            customer_id
          )
        `)
        .eq('status', 'pending')
        .lte('payment_date', reminderDate.toISOString())
        .gte('payment_date', new Date().toISOString());

      if (error) {
        console.error('Error fetching upcoming payments:', error);
        return;
      }

      for (const payment of upcomingPayments || []) {
        await this.sendReminderNotification(payment);
      }
    } catch (error) {
      console.error('Error in sendPaymentReminders:', error);
    }
  }
  
  private async sendOverdueNotification(payment: any): Promise<void> {
    try {
      const contract = payment.car_installment_contracts;
      if (!contract) return;

      // Calculate days overdue
      const paymentDate = new Date(payment.payment_date);
      const today = new Date();
      const daysOverdue = Math.floor((today.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24));

      const notificationData: NotificationData = {
        user_id: contract.customer_id,
        type: 'overdue_payment',
        title: 'دفعة متأخرة', // 'Overdue Payment'
        message: `دفعة بقيمة ${this.formatCurrency(payment.amount)} متأخرة ${daysOverdue} يوم لعقد ${contract.car_type}`,
        data: { 
          payment_id: payment.id, 
          contract_id: contract.id,
          days_overdue: daysOverdue,
          amount: payment.amount
        },
        action_url: `/financials/installments?contract=${contract.id}`,
        priority: daysOverdue > 30 ? 'urgent' : daysOverdue > 14 ? 'high' : 'medium'
      };

      await this.createInAppNotification(notificationData);
      
      // Show toast notification for current user
      toast.error(notificationData.title, {
        description: notificationData.message,
        action: {
          label: 'عرض',
          onClick: () => window.location.href = notificationData.action_url || ''
        }
      });

    } catch (error) {
      console.error('Error sending overdue notification:', error);
    }
  }
  
  private async sendReminderNotification(payment: any): Promise<void> {
    try {
      const contract = payment.car_installment_contracts;
      if (!contract) return;

      const paymentDate = new Date(payment.payment_date);
      const today = new Date();
      const daysUntilDue = Math.ceil((paymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      const notificationData: NotificationData = {
        user_id: contract.customer_id,
        type: 'payment_reminder',
        title: 'تذكير بدفعة قادمة', // 'Upcoming Payment Reminder'
        message: `دفعة بقيمة ${this.formatCurrency(payment.amount)} مستحقة خلال ${daysUntilDue} يوم لعقد ${contract.car_type}`,
        data: { 
          payment_id: payment.id, 
          contract_id: contract.id,
          days_until_due: daysUntilDue,
          amount: payment.amount
        },
        action_url: `/financials/installments?contract=${contract.id}`,
        priority: daysUntilDue <= 3 ? 'high' : 'medium'
      };

      await this.createInAppNotification(notificationData);

    } catch (error) {
      console.error('Error sending reminder notification:', error);
    }
  }

  private async createInAppNotification(notificationData: NotificationData): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert([{
          user_id: notificationData.user_id,
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          data: notificationData.data,
          action_url: notificationData.action_url,
          priority: notificationData.priority,
          read: false,
          created_at: new Date().toISOString()
        }]);

      if (error) {
        console.error('Error creating notification:', error);
      }
    } catch (error) {
      console.error('Error in createInAppNotification:', error);
    }
  }

  // Send notification when payment is received
  async sendPaymentReceivedNotification(payment: CarInstallmentPayment, contract: CarInstallmentContract): Promise<void> {
    try {
      const notificationData: NotificationData = {
        user_id: contract.customer_id || '',
        type: 'payment_received',
        title: 'تم استلام الدفعة', // 'Payment Received'
        message: `تم استلام دفعة بقيمة ${this.formatCurrency(payment.paid_amount || payment.amount)} لعقد ${contract.car_type}`,
        data: { 
          payment_id: payment.id, 
          contract_id: contract.id,
          amount: payment.paid_amount || payment.amount
        },
        action_url: `/financials/installments?contract=${contract.id}`,
        priority: 'low'
      };

      await this.createInAppNotification(notificationData);

    } catch (error) {
      console.error('Error sending payment received notification:', error);
    }
  }

  // Send notification when contract is completed
  async sendContractCompletedNotification(contract: CarInstallmentContract): Promise<void> {
    try {
      const notificationData: NotificationData = {
        user_id: contract.customer_id || '',
        type: 'contract_completed',
        title: 'تم إكمال العقد', // 'Contract Completed'
        message: `تم إكمال جميع دفعات عقد ${contract.car_type} بنجاح`,
        data: { 
          contract_id: contract.id,
          total_amount: contract.total_contract_value
        },
        action_url: `/financials/installments?contract=${contract.id}`,
        priority: 'medium'
      };

      await this.createInAppNotification(notificationData);

    } catch (error) {
      console.error('Error sending contract completed notification:', error);
    }
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ar-QA', {
      style: 'currency',
      currency: 'QAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // Get notifications for a user
  async getUserNotifications(userId: string, limit: number = 20): Promise<NotificationData[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserNotifications:', error);
      return [];
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
      }
    } catch (error) {
      console.error('Error in markAsRead:', error);
    }
  }
}

export const notificationService = new NotificationService(); 