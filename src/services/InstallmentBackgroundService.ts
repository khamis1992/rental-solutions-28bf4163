import { supabase } from '@/lib/supabase';
import { carInstallmentService } from './CarInstallmentService';
import { notificationService } from './NotificationService';
import { CarInstallmentPayment } from '@/types/car-installment';

export class InstallmentBackgroundService {
  
  // Daily job to mark overdue payments
  async markOverduePayments(): Promise<void> {
    try {
      console.log('Starting overdue payments check...');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get all pending payments that are past due
      const { data: overduePayments, error } = await supabase
        .from('car_installment_payments')
        .select('*')
        .eq('status', 'pending')
        .lt('payment_date', today.toISOString());

      if (error) {
        console.error('Error fetching overdue payments:', error);
        return;
      }

      console.log(`Found ${overduePayments?.length || 0} overdue payments`);

      // Update each payment to overdue status
      for (const payment of overduePayments || []) {
        const { error: updateError } = await supabase
          .from('car_installment_payments')
          .update({ 
            status: 'overdue',
            updated_at: new Date().toISOString()
          })
          .eq('id', payment.id);

        if (updateError) {
          console.error(`Error updating payment ${payment.id}:`, updateError);
          continue;
        }

        // Recalculate contract summary
        if (payment.contract_id) {
          await carInstallmentService.recalculateContractSummary(payment.contract_id);
        }
      }

      // Send overdue notifications
      await notificationService.checkOverduePayments();

      console.log('Overdue payments check completed');
    } catch (error) {
      console.error('Error in markOverduePayments:', error);
    }
  }

  // Daily job to send payment reminders
  async sendDailyReminders(): Promise<void> {
    try {
      console.log('Starting daily payment reminders...');
      
      // Send reminders for payments due in 7 days
      await notificationService.sendPaymentReminders(7);
      
      // Send urgent reminders for payments due in 3 days
      await notificationService.sendPaymentReminders(3);
      
      // Send final reminders for payments due tomorrow
      await notificationService.sendPaymentReminders(1);

      console.log('Daily payment reminders completed');
    } catch (error) {
      console.error('Error in sendDailyReminders:', error);
    }
  }

  // Update payment status automatically based on paid amount
  async updatePaymentStatuses(): Promise<void> {
    try {
      console.log('Starting payment status updates...');

      // Get all payments that might need status updates
      const { data: payments, error } = await supabase
        .from('car_installment_payments')
        .select('*')
        .in('status', ['pending', 'partial', 'overdue']);

      if (error) {
        console.error('Error fetching payments for status update:', error);
        return;
      }

      for (const payment of payments || []) {
        let newStatus = payment.status;
        const paidAmount = payment.paid_amount || 0;
        const totalAmount = payment.amount;

        // Determine new status based on paid amount
        if (paidAmount >= totalAmount) {
          newStatus = 'paid';
        } else if (paidAmount > 0 && paidAmount < totalAmount) {
          newStatus = 'partial';
        } else if (paidAmount === 0) {
          // Check if overdue
          const paymentDate = new Date(payment.payment_date);
          const today = new Date();
          if (paymentDate < today) {
            newStatus = 'overdue';
          } else {
            newStatus = 'pending';
          }
        }

        // Update if status changed
        if (newStatus !== payment.status) {
          const { error: updateError } = await supabase
            .from('car_installment_payments')
            .update({ 
              status: newStatus,
              updated_at: new Date().toISOString()
            })
            .eq('id', payment.id);

          if (updateError) {
            console.error(`Error updating payment status ${payment.id}:`, updateError);
            continue;
          }

          // Recalculate contract summary
          if (payment.contract_id) {
            await carInstallmentService.recalculateContractSummary(payment.contract_id);
          }

          console.log(`Updated payment ${payment.id} status from ${payment.status} to ${newStatus}`);
        }
      }

      console.log('Payment status updates completed');
    } catch (error) {
      console.error('Error in updatePaymentStatuses:', error);
    }
  }

  // Check and update contract completion status
  async updateContractStatuses(): Promise<void> {
    try {
      console.log('Starting contract status updates...');

      // Get all active contracts
      const { data: contracts, error } = await supabase
        .from('car_installment_contracts')
        .select(`
          *,
          car_installment_payments (
            id,
            status,
            amount,
            paid_amount
          )
        `)
        .eq('status', 'active');

      if (error) {
        console.error('Error fetching contracts for status update:', error);
        return;
      }

      for (const contract of contracts || []) {
        const payments = contract.car_installment_payments || [];
        const totalPayments = payments.length;
        const paidPayments = payments.filter((p: any) => p.status === 'paid').length;
        
        // Check if all payments are completed
        if (totalPayments > 0 && paidPayments === totalPayments) {
          const { error: updateError } = await supabase
            .from('car_installment_contracts')
            .update({ 
              status: 'completed',
              completion_date: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', contract.id);

          if (updateError) {
            console.error(`Error updating contract status ${contract.id}:`, updateError);
            continue;
          }

          // Send completion notification
          await notificationService.sendContractCompletedNotification(contract);

          console.log(`Contract ${contract.id} marked as completed`);
        }
      }

      console.log('Contract status updates completed');
    } catch (error) {
      console.error('Error in updateContractStatuses:', error);
    }
  }

  // Recalculate all contract summaries
  async recalculateAllSummaries(): Promise<void> {
    try {
      console.log('Starting contract summaries recalculation...');

      const { data: contracts, error } = await supabase
        .from('car_installment_contracts')
        .select('id')
        .eq('status', 'active');

      if (error) {
        console.error('Error fetching contracts for recalculation:', error);
        return;
      }

      for (const contract of contracts || []) {
        await carInstallmentService.recalculateContractSummary(contract.id);
      }

      console.log(`Recalculated summaries for ${contracts?.length || 0} contracts`);
    } catch (error) {
      console.error('Error in recalculateAllSummaries:', error);
    }
  }

  // Run all daily maintenance tasks
  async runDailyMaintenance(): Promise<void> {
    try {
      console.log('Starting daily maintenance tasks...');
      
      await this.markOverduePayments();
      await this.updatePaymentStatuses();
      await this.updateContractStatuses();
      await this.sendDailyReminders();
      await this.recalculateAllSummaries();
      
      console.log('Daily maintenance tasks completed');
    } catch (error) {
      console.error('Error in runDailyMaintenance:', error);
    }
  }

  // Schedule daily maintenance (would typically be called by a cron job)
  startScheduledTasks(): void {
    // Run daily maintenance at 6 AM
    const runAt6AM = () => {
      const now = new Date();
      const target = new Date();
      target.setHours(6, 0, 0, 0);
      
      if (target <= now) {
        target.setDate(target.getDate() + 1);
      }
      
      const timeUntilTarget = target.getTime() - now.getTime();
      
      setTimeout(() => {
        this.runDailyMaintenance();
        // Schedule next run
        setInterval(() => {
          this.runDailyMaintenance();
        }, 24 * 60 * 60 * 1000); // 24 hours
      }, timeUntilTarget);
    };

    runAt6AM();
    console.log('Scheduled daily maintenance tasks');
  }
}

export const installmentBackgroundService = new InstallmentBackgroundService(); 