
import { paymentScheduleService } from './PaymentScheduleService';
import { paymentService } from './PaymentService';
import { generatePaymentSchedule } from '@/utils/payment-schedule-generator';
import { Agreement } from '@/types/agreement';

export class AgreementPaymentService {
  
  /**
   * Creates both payment schedule records and unified payment records for a new agreement
   */
  async createPaymentScheduleForAgreement(agreement: Agreement): Promise<{
    success: boolean;
    scheduleCount: number;
    paymentCount: number;
    error?: string;
  }> {
    try {
      console.log('Creating complete payment schedule for agreement:', agreement.id);
      
      // Generate the payment schedule
      const schedule = generatePaymentSchedule({
        startDate: new Date(agreement.start_date),
        endDate: new Date(agreement.end_date),
        rentAmount: agreement.rent_amount,
        paymentFrequency: agreement.payment_frequency || 'monthly',
        paymentDay: agreement.payment_day || 1,
        includeDeposit: !!agreement.deposit_amount,
        depositAmount: agreement.deposit_amount || 0
      });

      if (schedule.length === 0) {
        return {
          success: false,
          scheduleCount: 0,
          paymentCount: 0,
          error: 'No payment schedule items generated'
        };
      }

      console.log('Generated payment schedule with', schedule.length, 'items');

      // Create payment schedule records first
      const schedulePromises = schedule.map(async (payment) => {
        const scheduleData = {
          lease_id: agreement.id!,
          amount: payment.amount,
          due_date: payment.dueDate.toISOString(),
          status: 'pending' as const,
          description: payment.description
        };

        const result = await paymentScheduleService.createPaymentSchedule(scheduleData);
        
        if (!result.success) {
          throw new Error(`Failed to create payment schedule: ${result.error}`);
        }
        
        return result.data;
      });

      const createdSchedules = await Promise.all(schedulePromises);
      console.log('Created', createdSchedules.length, 'payment schedule records');

      // Create unified payment records
      const paymentPromises = createdSchedules.map(async (scheduleItem) => {
        const paymentData = {
          lease_id: agreement.id!,
          amount: scheduleItem.amount,
          payment_date: scheduleItem.due_date,
          original_due_date: scheduleItem.due_date,
          description: scheduleItem.description || 'Scheduled Payment',
          status: 'pending' as const,
          type: scheduleItem.description?.toLowerCase().includes('deposit') ? 'deposit' : 'rent',
          payment_method: 'pending',
          schedule_id: scheduleItem.id
        };

        const paymentResult = await paymentService.recordPayment(paymentData);
        
        if (!paymentResult.success) {
          throw new Error(`Failed to create payment record: ${paymentResult.error}`);
        }
        
        return paymentResult.data;
      });

      const createdPayments = await Promise.all(paymentPromises);
      console.log('Created', createdPayments.length, 'unified payment records');

      return {
        success: true,
        scheduleCount: createdSchedules.length,
        paymentCount: createdPayments.length
      };
      
    } catch (error) {
      console.error('Error creating payment schedule for agreement:', error);
      return {
        success: false,
        scheduleCount: 0,
        paymentCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const agreementPaymentService = new AgreementPaymentService();
