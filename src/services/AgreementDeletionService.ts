
import { supabase } from '@/lib/supabase';
import { BaseService } from './base/BaseService';
import { Result } from '@/types/response.types';

export interface DeletionWarning {
  type: 'payment' | 'schedule' | 'fine' | 'legal' | 'document' | 'damage' | 'other';
  message: string;
  count: number;
  details?: {
    ids?: string[];
    dates?: string[];
    amounts?: number[];
  };
}

export interface DeletionValidationResult {
  canDelete: boolean;
  dependentRecords: {
    payments: number;
    paymentSchedules: number;
    trafficFines: number;
    legalCases: number;
    documents: number;
    damages: number;
    other: number;
  };
  totalDependencies: number;
  warnings: DeletionWarning[];
}

export interface DeletionOptions {
  force?: boolean;
  cascadeDelete?: boolean;
  preservePaymentHistory?: boolean;
}

export interface DeletedRecords {
  payments: number;
  paymentSchedules: number;
  trafficFines: number;
  legalCases: number;
  documents: number;
  damages: number;
  agreement: number;
  newUnifiedPayments: number;
  other: number;
}

export interface DeletionResult {
  deletedRecords: DeletedRecords;
  message: string;
}

export class AgreementDeletionService extends BaseService {
  constructor() {
    super(supabase);
  }

  /**
   * Validate if an agreement can be deleted and return dependency information
   */
  async validateDeletion(agreementId: string): Promise<Result<DeletionValidationResult>> {
    return this.safeExecute(async () => {
      const dependentRecords = {
        payments: 0,
        paymentSchedules: 0,
        trafficFines: 0,
        legalCases: 0,
        documents: 0,
        damages: 0,
        other: 0
      };

      const warnings: DeletionWarning[] = [];

      // Check unified_payments
      const { count: paymentsCount, error: paymentsError } = await supabase
        .from('unified_payments')
        .select('*', { count: 'exact', head: true })
        .eq('lease_id', agreementId);
      
      if (paymentsError) {
        console.error('Failed to check payment dependencies:', paymentsError);
      } else {
        dependentRecords.payments = paymentsCount || 0;
      }

      // Check payment schedules
      const { count: schedulesCount, error: schedulesError } = await supabase
        .from('payment_schedules')
        .select('*', { count: 'exact', head: true })
        .eq('lease_id', agreementId);
      
      if (schedulesError) {
        console.error('Failed to check payment schedule dependencies:', schedulesError);
      } else {
        dependentRecords.paymentSchedules = schedulesCount || 0;
      }

      // Check traffic fines
      const { count: finesCount, error: finesError } = await supabase
        .from('traffic_fines')
        .select('*', { count: 'exact', head: true })
        .eq('lease_id', agreementId);
      
      if (finesError) {
        console.error('Failed to check traffic fine dependencies:', finesError);
      } else {
        dependentRecords.trafficFines = finesCount || 0;
      }

      // Check damages table
      try {
        const { count: damagesCount, error: damagesError } = await supabase
          .from('damages')
          .select('*', { count: 'exact', head: true })
          .eq('lease_id', agreementId);
        
        if (damagesError && !damagesError.message.includes('does not exist')) {
          console.error('Failed to check damages dependencies:', damagesError);
        } else {
          dependentRecords.damages = damagesCount || 0;
        }
      } catch (error) {
        console.warn('Damages table may not exist:', error);
      }

      // Check legal cases (by customer_id, not lease_id)
      const { data: agreement, error: agreementError } = await supabase
        .from('leases')
        .select('customer_id')
        .eq('id', agreementId)
        .single();
      
      if (agreementError || !agreement) {
        console.error('Failed to fetch agreement for legal case check:', agreementError);
      } else {
        const { count: casesCount, error: casesError } = await supabase
          .from('legal_cases')
          .select('*', { count: 'exact', head: true })
          .eq('customer_id', agreement.customer_id);
        
        if (casesError) {
          console.error('Failed to check legal case dependencies:', casesError);
        } else {
          dependentRecords.legalCases = casesCount || 0;
        }
      }

      // Check documents
      const { count: docsCount, error: docsError } = await supabase
        .from('agreement_documents')
        .select('*', { count: 'exact', head: true })
        .eq('lease_id', agreementId);
      
      if (docsError) {
        console.error('Failed to check document dependencies:', docsError);
      } else {
        dependentRecords.documents = docsCount || 0;
      }

      const totalDependencies = Object.values(dependentRecords).reduce((sum, count) => sum + count, 0);

      // Generate warnings based on dependencies
      if (dependentRecords.payments > 0) {
        warnings.push({
          type: 'payment',
          message: `${dependentRecords.payments} payment record(s) will be permanently deleted`,
          count: dependentRecords.payments
        });
      }
      if (dependentRecords.trafficFines > 0) {
        warnings.push({
          type: 'fine',
          message: `${dependentRecords.trafficFines} traffic fine(s) will be permanently deleted`,
          count: dependentRecords.trafficFines
        });
      }
      if (dependentRecords.legalCases > 0) {
        warnings.push({
          type: 'legal',
          message: `${dependentRecords.legalCases} legal case(s) will be permanently deleted`,
          count: dependentRecords.legalCases
        });
      }
      if (dependentRecords.documents > 0) {
        warnings.push({
          type: 'document',
          message: `${dependentRecords.documents} document(s) will be permanently deleted`,
          count: dependentRecords.documents
        });
      }
      if (dependentRecords.damages > 0) {
        warnings.push({
          type: 'damage',
          message: `${dependentRecords.damages} damage record(s) will be permanently deleted`,
          count: dependentRecords.damages
        });
      }

      return {
        canDelete: true, // We can always delete with proper cascade
        dependentRecords,
        totalDependencies,
        warnings
      };
    }, 'Failed to validate agreement deletion');
  }

  /**
   * Delete agreement with proper cascade handling
   */
  async deleteAgreement(
    agreementId: string, 
    options: DeletionOptions = {}
  ): Promise<Result<DeletionResult>> {
    return this.safeExecute(async () => {
      console.log(`Starting agreement deletion for ID: ${agreementId}`);
      
      const deletedRecords: DeletedRecords = {
        payments: 0,
        paymentSchedules: 0,
        trafficFines: 0,
        legalCases: 0,
        documents: 0,
        damages: 0,
        agreement: 0,
        newUnifiedPayments: 0,
        other: 0
      };

      // First validate the deletion
      const validationResult = await this.validateDeletion(agreementId);
      if (!validationResult.success) {
        throw new Error('Failed to validate deletion requirements');
      }

      // Delete from new_unified_payments table (if it exists)
      try {
        const { error: newUnifiedPaymentsError, count: newUnifiedPaymentsDeleted } = await supabase
          .from('new_unified_payments')
          .delete({ count: 'exact' })
          .eq('lease_id', agreementId);
        if (newUnifiedPaymentsError && !newUnifiedPaymentsError.message.includes('does not exist')) {
          console.warn('Failed to delete new_unified_payments:', newUnifiedPaymentsError.message);
        }
        deletedRecords.newUnifiedPayments = newUnifiedPaymentsDeleted || 0;
      } catch (error) {
        console.warn('Error deleting from new_unified_payments (table may not exist):', error);
      }

      // Delete from damages table (if it exists)
      try {
        const { error: damagesError, count: damagesDeleted } = await supabase
          .from('damages')
          .delete({ count: 'exact' })
          .eq('lease_id', agreementId);
        if (damagesError && !damagesError.message.includes('does not exist')) {
          console.warn('Failed to delete damages:', damagesError.message);
        }
        deletedRecords.damages = damagesDeleted || 0;
      } catch (error) {
        console.warn('Error deleting from damages (table may not exist):', error);
      }

      // Delete from agreement_documents
      const { error: docsError, count: docsDeleted } = await supabase
        .from('agreement_documents')
        .delete({ count: 'exact' })
        .eq('lease_id', agreementId);
      if (docsError) {
        console.warn('Failed to delete agreement_documents:', docsError.message);
      }
      deletedRecords.documents = docsDeleted || 0;

      // Delete from legal_cases (by customer_id)
      const { data: agreementForDelete, error: agreementForDeleteError } = await supabase
        .from('leases')
        .select('customer_id')
        .eq('id', agreementId)
        .single();
      if (agreementForDeleteError || !agreementForDelete) {
        console.warn('Failed to fetch agreement for legal case deletion');
      } else {
        const { error: casesError, count: casesDeleted } = await supabase
          .from('legal_cases')
          .delete({ count: 'exact' })
          .eq('customer_id', agreementForDelete.customer_id);
        if (casesError) {
          console.warn('Failed to delete legal_cases:', casesError.message);
        }
        deletedRecords.legalCases = casesDeleted || 0;
      }

      // Delete from traffic_fines
      const { error: finesError, count: finesDeleted } = await supabase
        .from('traffic_fines')
        .delete({ count: 'exact' })
        .eq('lease_id', agreementId);
      if (finesError) {
        console.warn('Failed to delete traffic_fines:', finesError.message);
      }
      deletedRecords.trafficFines = finesDeleted || 0;

      // Delete from payment_schedules
      const { error: schedulesError, count: schedulesDeleted } = await supabase
        .from('payment_schedules')
        .delete({ count: 'exact' })
        .eq('lease_id', agreementId);
      if (schedulesError) {
        console.warn('Failed to delete payment_schedules:', schedulesError.message);
      }
      deletedRecords.paymentSchedules = schedulesDeleted || 0;

      // Delete from unified_payments
      const { error: paymentsError, count: paymentsDeleted } = await supabase
        .from('unified_payments')
        .delete({ count: 'exact' })
        .eq('lease_id', agreementId);
      if (paymentsError) {
        console.warn('Failed to delete unified_payments:', paymentsError.message);
      }
      deletedRecords.payments = paymentsDeleted || 0;

      // Finally delete the agreement itself
      const { error: agreementError, count: agreementDeleted } = await supabase
        .from('leases')
        .delete({ count: 'exact' })
        .eq('id', agreementId);
      if (agreementError) {
        console.error('Failed to delete agreement:', agreementError);
        throw new Error(`Failed to delete agreement: ${agreementError.message}`);
      }
      deletedRecords.agreement = agreementDeleted || 0;

      const totalDeleted = Object.values(deletedRecords).reduce((sum, count) => sum + count, 0);
      
      console.log(`Agreement deletion completed. Total records deleted: ${totalDeleted}`);
      
      return {
        deletedRecords,
        message: `Successfully deleted agreement and ${totalDeleted - 1} related records`
      };
    }, 'Failed to delete agreement');
  }

  /**
   * Check if agreement has any completed payments (business rule validation)
   */
  async hasCompletedPayments(agreementId: string): Promise<Result<boolean>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('unified_payments')
        .select('*')
        .eq('lease_id', agreementId)
        .eq('status', 'completed')
        .limit(1);

      if (error) {
        throw new Error('Failed to check completed payments');
      }

      return data && data.length > 0;
    }, 'Failed to check completed payments');
  }

  async isActiveAgreement(agreementId: string): Promise<Result<boolean>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('leases')
        .select('status')
        .eq('id', agreementId)
        .single();

      if (error) {
        throw new Error('Failed to check agreement status');
      }

      if (!data) {
        throw new Error('Agreement not found');
      }

      return data.status === 'active';
    }, 'Failed to check agreement status');
  }
}

export const agreementDeletionService = new AgreementDeletionService();
