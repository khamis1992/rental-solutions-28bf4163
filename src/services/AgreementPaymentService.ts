import { paymentScheduleService } from './PaymentScheduleService';
import { paymentService } from './PaymentService';
import { generatePaymentSchedule } from '@/utils/payment-schedule-generator';
import { Agreement } from '@/types/agreement';
import { supabase } from '@/lib/supabase';

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
      
      // Check if payments already exist for this agreement to prevent duplicates
      const { data: existingPayments, error: paymentsError } = await supabase
        .from('unified_payments')
        .select('id')
        .eq('lease_id', agreement.id!)
        .limit(1);

      if (paymentsError) {
        console.error('Error checking existing payments:', paymentsError);
        return {
          success: false,
          scheduleCount: 0,
          paymentCount: 0,
          error: `Failed to check existing payments: ${paymentsError.message}`
        };
      }

      if (existingPayments && existingPayments.length > 0) {
        console.log('Payments already exist for this agreement, skipping creation');
        return {
          success: true,
          scheduleCount: 0,
          paymentCount: 0,
          error: 'Payment schedule already exists for this agreement'
        };
      }
      
      // Generate the payment schedule
      const schedule = generatePaymentSchedule({
        startDate: new Date(agreement.start_date),
        endDate: new Date(agreement.end_date),
        rentAmount: agreement.rent_amount,
        paymentFrequency: (agreement.payment_frequency as "monthly" | "weekly" | "daily") || 'monthly',
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
      const paymentPromises = createdSchedules.map(async (scheduleItem: any) => {
        const paymentData = {
          lease_id: agreement.id!,
          amount: scheduleItem.amount,
          payment_date: scheduleItem.due_date,
          original_due_date: scheduleItem.due_date,
          description: scheduleItem.description || 'Scheduled Payment',
          status: 'pending' as const,
          type: scheduleItem.description?.toLowerCase().includes('deposit') ? 'deposit' : 'rent',
          payment_method: 'pending'
          // Note: schedule_id is not included as it may not exist in all table schemas
        };

        console.log(`📝 Creating payment record:`, {
          amount: paymentData.amount,
          due_date: paymentData.payment_date,
          type: paymentData.type,
          description: paymentData.description
        });

        const paymentResult = await paymentService.recordPayment(paymentData);
        
        if (!paymentResult.success) {
          console.error(`❌ Failed to create payment record:`, paymentResult.error);
          throw new Error(`Failed to create payment record: ${paymentResult.error}`);
        }
        
        console.log(`✅ Payment record created successfully:`, paymentResult.data?.id);
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

  /**
   * Creates payment schedule for an existing agreement by ID
   * Checks if payments already exist before creating new ones
   */
  async createPaymentScheduleByAgreementId(agreementId: string): Promise<{
    success: boolean;
    scheduleCount: number;
    paymentCount: number;
    error?: string;
    message?: string;
  }> {
    try {
      console.log('Creating payment schedule for existing agreement:', agreementId);
      
      // First, get the agreement details
      const { data: agreement, error: agreementError } = await supabase
        .from('leases')
        .select('*')
        .eq('id', agreementId)
        .single();

      if (agreementError || !agreement) {
        return {
          success: false,
          scheduleCount: 0,
          paymentCount: 0,
          error: `Failed to fetch agreement: ${agreementError?.message || 'Agreement not found'}`
        };
      }

      // Check if payments already exist for this agreement
      const { data: existingPayments, error: paymentsError } = await supabase
        .from('unified_payments')
        .select('id')
        .eq('lease_id', agreementId)
        .limit(1);

      if (paymentsError) {
        return {
          success: false,
          scheduleCount: 0,
          paymentCount: 0,
          error: `Failed to check existing payments: ${paymentsError.message}`
        };
      }

      if (existingPayments && existingPayments.length > 0) {
        return {
          success: true,
          scheduleCount: 0,
          paymentCount: 0,
          message: 'Payment schedule already exists for this agreement'
        };
      }

      // Create payment schedule for this agreement
      const result = await this.createPaymentScheduleForAgreement(agreement as Agreement);
      
      return {
        ...result,
        message: result.success ? 
          `Successfully created ${result.scheduleCount} schedule items and ${result.paymentCount} payment records` :
          result.error
      };
      
    } catch (error) {
      console.error('Error in createPaymentScheduleByAgreementId:', error);
      return {
        success: false,
        scheduleCount: 0,
        paymentCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Force create payment schedule for agreement regardless of existing payments
   * Useful for fixing missing payment schedules
   */
  async forceCreatePaymentSchedule(agreementId: string): Promise<{
    success: boolean;
    scheduleCount: number;
    paymentCount: number;
    error?: string;
    message?: string;
  }> {
    try {
      console.log('Force creating payment schedule for agreement:', agreementId);
      
      // Get the agreement details
      const { data: agreement, error: agreementError } = await supabase
        .from('leases')
        .select('*')
        .eq('id', agreementId)
        .single();

      if (agreementError || !agreement) {
        return {
          success: false,
          scheduleCount: 0,
          paymentCount: 0,
          error: `Failed to fetch agreement: ${agreementError?.message || 'Agreement not found'}`        };
      }

      // Delete existing payment schedules and payments for this agreement
      console.log('Removing existing payment records for clean slate...');
      
      await supabase
        .from('unified_payments')
        .delete()
        .eq('lease_id', agreementId);

      await supabase
        .from('payment_schedules')
        .delete()
        .eq('lease_id', agreementId);

      // Create fresh payment schedule
      const result = await this.createPaymentScheduleForAgreement(agreement as Agreement);
      
      return {
        ...result,
        message: result.success ? 
          `Successfully force-created ${result.scheduleCount} schedule items and ${result.paymentCount} payment records` :
          result.error
      };
      
    } catch (error) {
      console.error('Error in forceCreatePaymentSchedule:', error);
      return {
        success: false,
        scheduleCount: 0,
        paymentCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check all agreements and create missing payment schedules automatically
   * This is useful for fixing agreements that were created before the automatic system
   */
  async fixAllMissingPaymentSchedules(): Promise<{
    success: boolean;
    totalAgreements: number;
    fixedAgreements: number;
    errors: string[];
    message: string;
  }> {
    try {
      console.log('🔄 Starting automatic fix for all missing payment schedules...');
      
      // Get all active agreements
      const { data: agreements, error: agreementsError } = await supabase
        .from('leases')
        .select('id, agreement_number, rent_amount, start_date, end_date')
        .in('status', ['active', 'pending']);

      if (agreementsError) {
        return {
          success: false,
          totalAgreements: 0,
          fixedAgreements: 0,
          errors: [`Failed to fetch agreements: ${agreementsError.message}`],
          message: 'Failed to start the fixing process'
        };
      }

      if (!agreements || agreements.length === 0) {
        return {
          success: true,
          totalAgreements: 0,
          fixedAgreements: 0,
          errors: [],
          message: 'No active agreements found'
        };
      }

      console.log(`📊 Found ${agreements.length} active agreements to check`);

      const errors: string[] = [];
      let fixedCount = 0;

      // Process each agreement
      for (const agreement of agreements) {
        try {
          // Check if this agreement has any payments
          const { data: existingPayments, error: paymentsError } = await supabase
            .from('unified_payments')
            .select('id')
            .eq('lease_id', agreement.id)
            .limit(1);

          if (paymentsError) {
            errors.push(`Failed to check payments for ${agreement.agreement_number}: ${paymentsError.message}`);
            continue;
          }

          // If no payments exist, create them
          if (!existingPayments || existingPayments.length === 0) {
            console.log(`🔧 Fixing missing payments for agreement ${agreement.agreement_number}`);
            
            const result = await this.createPaymentScheduleByAgreementId(agreement.id);
            
            if (result.success && result.scheduleCount > 0) {
              fixedCount++;
              console.log(`✅ Fixed ${agreement.agreement_number}: Created ${result.scheduleCount} payments`);
            } else {
              errors.push(`Failed to fix ${agreement.agreement_number}: ${result.error}`);
            }
          }

          // Add a small delay to avoid overwhelming the database
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Error processing ${agreement.agreement_number}: ${errorMessage}`);
        }
      }

      const message = `Processed ${agreements.length} agreements, fixed ${fixedCount} missing payment schedules`;
      
      console.log(`✅ Completed fixing process: ${message}`);
      if (errors.length > 0) {
        console.warn('⚠️ Some errors occurred:', errors);
      }

      return {
        success: true,
        totalAgreements: agreements.length,
        fixedAgreements: fixedCount,
        errors,
        message
      };
      
    } catch (error) {
      console.error('❌ Error in fixAllMissingPaymentSchedules:', error);
      return {
        success: false,
        totalAgreements: 0,
        fixedAgreements: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        message: 'Failed to complete the fixing process'
      };
    }
  }
}

export const agreementPaymentService = new AgreementPaymentService();

