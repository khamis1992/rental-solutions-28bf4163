
import { Agreement, AgreementStatus } from '@/types/agreement';
import { supabase } from '@/lib/supabase';

export const checkAndUpdateAgreementStatus = async (): Promise<{
  success: boolean;
  message?: string;
  updatedAgreements?: number;
}> => {
  try {
    const today = new Date();
    const { data: agreements, error } = await supabase
      .from('leases')
      .select('*');

    if (error) {
      throw error;
    }

    if (!agreements || agreements.length === 0) {
      return {
        success: true,
        message: 'No agreements found to update',
        updatedAgreements: 0,
      };
    }

    let updatedCount = 0;

    for (const agreement of agreements) {
      let shouldUpdate = false;
      let newStatus = agreement.status;
      const endDate = new Date(agreement.end_date);
      const startDate = new Date(agreement.start_date);

      // Check if agreement has expired (end date is in the past)
      if (agreement.status === 'active' && endDate < today) {
        newStatus = 'expired';
        shouldUpdate = true;
      }

      // Check if agreement should be activated (start date has passed and payment received)
      else if (
        agreement.status === 'pending_payment' &&
        startDate <= today
      ) {
        // Here we would normally check if payment has been received
        // This is a simplified check
        const { data: payments } = await supabase
          .from('unified_payments')
          .select('*')
          .eq('lease_id', agreement.id)
          .eq('status', 'paid');

        if (payments && payments.length > 0) {
          newStatus = 'active';
          shouldUpdate = true;
        }
      }

      // Update the agreement if status has changed
      if (shouldUpdate) {
        const { error: updateError } = await supabase
          .from('leases')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', agreement.id);

        if (updateError) {
          console.error(`Failed to update agreement ${agreement.id}:`, updateError);
        } else {
          updatedCount++;
        }
      }
    }

    return {
      success: true,
      message: `Updated status for ${updatedCount} agreements`,
      updatedAgreements: updatedCount,
    };
  } catch (error) {
    console.error('Error checking agreement statuses:', error);
    return {
      success: false,
      message: `Error updating agreement statuses: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};

export const getAgreementMetrics = async (): Promise<{
  totalActive: number;
  expiringSoon: number;
  overdue: number;
  status: {
    [key: string]: number;
  };
}> => {
  try {
    const { data: agreements, error } = await supabase
      .from('leases')
      .select('*');

    if (error) {
      throw error;
    }

    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    // Calculate metrics
    const totalActive = agreements.filter(a => a.status === 'active').length;
    
    const expiringSoon = agreements.filter(a => {
      if (a.status !== 'active') return false;
      const endDate = new Date(a.end_date);
      return endDate > today && endDate <= thirtyDaysFromNow;
    }).length;

    const overdue = agreements.filter(a => {
      // Count agreements with overdue payments
      // This is a simplified check - real app would check payment records
      return a.status === 'active'; // Placeholder logic
    }).length;

    // Count agreements by status
    const statusCounts = agreements.reduce((acc: {[key: string]: number}, curr) => {
      const status = curr.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return {
      totalActive,
      expiringSoon,
      overdue,
      status: statusCounts,
    };
  } catch (error) {
    console.error('Error getting agreement metrics:', error);
    return {
      totalActive: 0,
      expiringSoon: 0,
      overdue: 0,
      status: {},
    };
  }
};

export const runAgreementStatusMaintenance = async () => {
  return await checkAndUpdateAgreementStatus();
};
