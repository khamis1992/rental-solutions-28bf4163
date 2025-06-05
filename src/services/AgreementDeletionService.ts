import { supabase } from '@/lib/supabase';
import { BaseService } from './base/BaseService';
import { Result } from '@/types/response.types';
import {
  createServiceError,
  createNotFoundError,
  ErrorContext
} from '@/types/error.types';

export interface DeletionWarning {
  type: 'payment' | 'schedule' | 'fine' | 'legal' | 'document';
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
  agreement: number;
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
        documents: 0
      };

      const warnings: DeletionWarning[] = [];

      // Check payments
      const { count: paymentsCount, error: paymentsError } = await supabase
        .from('unified_payments')
        .select('*', { count: 'exact', head: true })
        .eq('lease_id', agreementId);
      
      if (paymentsError) {
        throw this.createServiceError(
          'Failed to check payment dependencies',
          'validateDeletion'
        );
      }
      
      dependentRecords.payments = paymentsCount || 0;

      // Check payment schedules
      const { count: schedulesCount, error: schedulesError } = await supabase
        .from('payment_schedules')
        .select('*', { count: 'exact', head: true })
        .eq('lease_id', agreementId);
      
      if (schedulesError) {
        throw this.createServiceError(
          'Failed to check payment schedule dependencies',
          'validateDeletion'
        );
      }
      
      dependentRecords.paymentSchedules = schedulesCount || 0;

      // Check traffic fines
      const { count: finesCount, error: finesError } = await supabase
        .from('traffic_fines')
        .select('*', { count: 'exact', head: true })
        .eq('lease_id', agreementId);
      
      if (finesError) {
        throw this.createServiceError(
          'Failed to check traffic fine dependencies',
          'validateDeletion'
        );
      }
      
      dependentRecords.trafficFines = finesCount || 0;

      // Check legal cases (by customer_id, not lease_id)
      // 1. Fetch the agreement to get customer_id
      const { data: agreement, error: agreementError } = await supabase
        .from('leases')
        .select('customer_id')
        .eq('id', agreementId)
        .single();
      if (agreementError || !agreement) {
        throw this.createServiceError(
          'Failed to fetch agreement for legal case check',
          'validateDeletion'
        );
      }
      // 2. Check for legal cases with that customer_id
      const { count: casesCount, error: casesError } = await supabase
        .from('legal_cases')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', agreement.customer_id);
      if (casesError) {
        throw this.createServiceError(
          'Failed to check legal case dependencies',
          'validateDeletion'
        );
      }
      dependentRecords.legalCases = casesCount || 0;

      // Check documents
      const { count: docsCount, error: docsError } = await supabase
        .from('agreement_documents')
        .select('*', { count: 'exact', head: true })
        .eq('lease_id', agreementId);
      
      if (docsError) {
        throw this.createServiceError(
          'Failed to check document dependencies',
          'validateDeletion'
        );
      }
      
      dependentRecords.documents = docsCount || 0;

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
      const deletedRecords: DeletedRecords = {
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
        throw this.createServiceError(
          'Failed to validate deletion requirements',
          'deleteAgreement'
        );
      }

      // Delete dependent records in correct order (most dependent first)
      
      // 1. Delete agreement documents
      const { error: docsError, count: docsDeleted } = await supabase
        .from('agreement_documents')
        .delete({ count: 'exact' })
        .eq('lease_id', agreementId);
      
      if (docsError) {
        throw this.createServiceError(
          `Failed to delete documents: ${docsError.message}`,
          'deleteAgreement'
        );
      }
      deletedRecords.documents = docsDeleted || 0;

      // 2. Delete legal cases (by customer_id, not lease_id)
      // Fetch the agreement to get customer_id
      const { data: agreementForDelete, error: agreementForDeleteError } = await supabase
        .from('leases')
        .select('customer_id')
        .eq('id', agreementId)
        .single();
      if (agreementForDeleteError || !agreementForDelete) {
        throw this.createServiceError(
          'Failed to fetch agreement for legal case deletion',
          'deleteAgreement'
        );
      }
      const { error: casesError, count: casesDeleted } = await supabase
        .from('legal_cases')
        .delete({ count: 'exact' })
        .eq('customer_id', agreementForDelete.customer_id);
      if (casesError) {
        throw this.createServiceError(
          `Failed to delete legal cases: ${typeof casesError === 'object' && casesError !== null && 'message' in casesError ? (casesError as any).message : casesError}`,
          'deleteAgreement'
        );
      }
      deletedRecords.legalCases = casesDeleted || 0;

      // 3. Delete traffic fines
      const { error: finesError, count: finesDeleted } = await supabase
        .from('traffic_fines')
        .delete({ count: 'exact' })
        .eq('lease_id', agreementId);
      
      if (finesError) {
        throw this.createServiceError(
          `Failed to delete traffic fines: ${finesError.message}`,
          'deleteAgreement'
        );
      }
      deletedRecords.trafficFines = finesDeleted || 0;

      // 4. Delete payment schedules
      const { error: schedulesError, count: schedulesDeleted } = await supabase
        .from('payment_schedules')
        .delete({ count: 'exact' })
        .eq('lease_id', agreementId);
      
      if (schedulesError) {
        throw this.createServiceError(
          `Failed to delete payment schedules: ${schedulesError.message}`,
          'deleteAgreement'
        );
      }
      deletedRecords.paymentSchedules = schedulesDeleted || 0;

      // 5. Delete payments
      const { error: paymentsError, count: paymentsDeleted } = await supabase
        .from('unified_payments')
        .delete({ count: 'exact' })
        .eq('lease_id', agreementId);
      
      if (paymentsError) {
        throw this.createServiceError(
          `Failed to delete payments: ${paymentsError.message}`,
          'deleteAgreement'
        );
      }
      deletedRecords.payments = paymentsDeleted || 0;

      // 6. Finally delete the agreement itself
      const { error: agreementError, count: agreementDeleted } = await supabase
        .from('leases')
        .delete({ count: 'exact' })
        .eq('id', agreementId);
      
      if (agreementError) {
        throw this.createServiceError(
          `Failed to delete agreement: ${agreementError.message}`,
          'deleteAgreement'
        );
      }
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
  async hasCompletedPayments(agreementId: string): Promise<Result<boolean>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('unified_payments')
        .select('*')
        .eq('lease_id', agreementId)
        .eq('status', 'completed')
        .limit(1);

      if (error) {
        throw this.createServiceError(
          'Failed to check completed payments',
          'hasCompletedPayments'
        );
      }

      return data && data.length > 0;
    }, 'Failed to check completed payments');
  }

  /**
   * Check if agreement is currently active
   */
  async isActiveAgreement(agreementId: string): Promise<Result<boolean>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('leases')
        .select('status')
        .eq('id', agreementId)
        .single();

      if (error) {
        throw this.createServiceError(
          'Failed to check agreement status',
          'isActiveAgreement'
        );
      }

      if (!data) {
        throw createNotFoundError('Agreement not found', { id: agreementId });
      }

      return data.status === 'active';
    }, 'Failed to check agreement status');
  }
}

export const agreementDeletionService = new AgreementDeletionService();
