
import { supabase } from '@/lib/supabase';
import { BaseService, ServiceResult } from './base/BaseService';

export interface DeletionValidationResult {
  canDelete: boolean;
  dependentRecords: {
    payments: number;
    paymentSchedules: number;
    trafficFines: number;
    legalCases: number;
    documents: number;
  };
  totalDependencies: number;
  warnings: string[];
}

export interface DeletionOptions {
  force?: boolean;
  cascadeDelete?: boolean;
  preservePaymentHistory?: boolean;
}

export class AgreementDeletionService extends BaseService {
  constructor() {
    super(supabase);
  }

  /**
   * Validate if an agreement can be deleted and return dependency information
   */
  async validateDeletion(agreementId: string): Promise<ServiceResult<DeletionValidationResult>> {
    return this.safeExecute(async () => {
      const dependentRecords = {
        payments: 0,
        paymentSchedules: 0,
        trafficFines: 0,
        legalCases: 0,
        documents: 0
      };

      const warnings: string[] = [];

      // Check payments
      const { count: paymentsCount } = await supabase
        .from('unified_payments')
        .select('*', { count: 'exact', head: true })
        .eq('lease_id', agreementId);
      
      dependentRecords.payments = paymentsCount || 0;

      // Check payment schedules
      const { count: schedulesCount } = await supabase
        .from('payment_schedules')
        .select('*', { count: 'exact', head: true })
        .eq('lease_id', agreementId);
      
      dependentRecords.paymentSchedules = schedulesCount || 0;

      // Check traffic fines
      const { count: finesCount } = await supabase
        .from('traffic_fines')
        .select('*', { count: 'exact', head: true })
        .eq('lease_id', agreementId);
      
      dependentRecords.trafficFines = finesCount || 0;

      // Check legal cases
      const { count: casesCount } = await supabase
        .from('legal_cases')
        .select('*', { count: 'exact', head: true })
        .eq('lease_id', agreementId);
      
      dependentRecords.legalCases = casesCount || 0;

      // Check documents
      const { count: docsCount } = await supabase
        .from('agreement_documents')
        .select('*', { count: 'exact', head: true })
        .eq('lease_id', agreementId);
      
      dependentRecords.documents = docsCount || 0;

      const totalDependencies = Object.values(dependentRecords).reduce((sum, count) => sum + count, 0);

      // Generate warnings based on dependencies
      if (dependentRecords.payments > 0) {
        warnings.push(`${dependentRecords.payments} payment record(s) will be permanently deleted`);
      }
      if (dependentRecords.trafficFines > 0) {
        warnings.push(`${dependentRecords.trafficFines} traffic fine(s) will be permanently deleted`);
      }
      if (dependentRecords.legalCases > 0) {
        warnings.push(`${dependentRecords.legalCases} legal case(s) will be permanently deleted`);
      }
      if (dependentRecords.documents > 0) {
        warnings.push(`${dependentRecords.documents} document(s) will be permanently deleted`);
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
  ): Promise<ServiceResult<{ deletedRecords: any; message: string }>> {
    return this.safeExecute(async () => {
      const deletedRecords = {
        payments: 0,
        paymentSchedules: 0,
        trafficFines: 0,
        legalCases: 0,
        documents: 0,
        agreement: 0
      };

      // First validate the deletion
      const validationResult = await this.validateDeletion(agreementId);
      if (!validationResult.success) {
        throw new Error('Failed to validate deletion requirements');
      }

      // Delete dependent records in correct order (most dependent first)
      
      // 1. Delete agreement documents
      const { error: docsError, count: docsDeleted } = await supabase
        .from('agreement_documents')
        .delete({ count: 'exact' })
        .eq('lease_id', agreementId);
      
      if (docsError) throw new Error(`Failed to delete documents: ${docsError.message}`);
      deletedRecords.documents = docsDeleted || 0;

      // 2. Delete legal cases
      const { error: casesError, count: casesDeleted } = await supabase
        .from('legal_cases')
        .delete({ count: 'exact' })
        .eq('lease_id', agreementId);
      
      if (casesError) throw new Error(`Failed to delete legal cases: ${casesError.message}`);
      deletedRecords.legalCases = casesDeleted || 0;

      // 3. Delete traffic fines
      const { error: finesError, count: finesDeleted } = await supabase
        .from('traffic_fines')
        .delete({ count: 'exact' })
        .eq('lease_id', agreementId);
      
      if (finesError) throw new Error(`Failed to delete traffic fines: ${finesError.message}`);
      deletedRecords.trafficFines = finesDeleted || 0;

      // 4. Delete payment schedules
      const { error: schedulesError, count: schedulesDeleted } = await supabase
        .from('payment_schedules')
        .delete({ count: 'exact' })
        .eq('lease_id', agreementId);
      
      if (schedulesError) throw new Error(`Failed to delete payment schedules: ${schedulesError.message}`);
      deletedRecords.paymentSchedules = schedulesDeleted || 0;

      // 5. Delete payments
      const { error: paymentsError, count: paymentsDeleted } = await supabase
        .from('unified_payments')
        .delete({ count: 'exact' })
        .eq('lease_id', agreementId);
      
      if (paymentsError) throw new Error(`Failed to delete payments: ${paymentsError.message}`);
      deletedRecords.payments = paymentsDeleted || 0;

      // 6. Finally delete the agreement itself
      const { error: agreementError, count: agreementDeleted } = await supabase
        .from('leases')
        .delete({ count: 'exact' })
        .eq('id', agreementId);
      
      if (agreementError) throw new Error(`Failed to delete agreement: ${agreementError.message}`);
      deletedRecords.agreement = agreementDeleted || 0;

      const totalDeleted = Object.values(deletedRecords).reduce((sum, count) => sum + count, 0);
      
      return {
        deletedRecords,
        message: `Successfully deleted agreement and ${totalDeleted - 1} related records`
      };
    }, 'Failed to delete agreement');
  }

  /**
   * Check if agreement has any completed payments (business rule validation)
   */
  async hasCompletedPayments(agreementId: string): Promise<ServiceResult<boolean>> {
    return this.safeExecute(async () => {
      const { count } = await supabase
        .from('unified_payments')
        .select('*', { count: 'exact', head: true })
        .eq('lease_id', agreementId)
        .eq('status', 'completed');
      
      return (count || 0) > 0;
    }, 'Failed to check payment status');
  }

  /**
   * Check if agreement is currently active
   */
  async isActiveAgreement(agreementId: string): Promise<ServiceResult<boolean>> {
    return this.safeExecute(async () => {
      const { data } = await supabase
        .from('leases')
        .select('status')
        .eq('id', agreementId)
        .single();
      
      return data?.status === 'active';
    }, 'Failed to check agreement status');
  }
}

export const agreementDeletionService = new AgreementDeletionService();
