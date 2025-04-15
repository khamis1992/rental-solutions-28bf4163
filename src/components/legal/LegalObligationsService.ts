
import { supabase } from '@/lib/supabase';
import { hasData, asStatusColumn, asLeaseIdColumn, asCustomerId } from '@/utils/database-type-helpers';

export interface LegalObligation {
  id: string;
  type: string;
  title: string;
  dueDate: Date | null;
  amount?: number;
  customerId: string;
  customerName: string;
  status: string;
  leaseId?: string;
  agreementNumber?: string;
}

// Function to determine the urgency level based on various factors
export const determineUrgency = (daysOverdue: number, amount: number): 'low' | 'medium' | 'high' | 'critical' => {
  if (daysOverdue > 60 || amount > 10000) return 'critical';
  if (daysOverdue > 30 || amount > 5000) return 'high';
  if (daysOverdue > 14 || amount > 2000) return 'medium';
  return 'low';
};

// Comprehensive function to fetch all types of legal obligations
export const fetchLegalObligations = async () => {
  try {
    // Fetch different types of obligations
    const overduePayments = await LegalObligationsService.getOverduePaymentObligations();
    const upcomingPayments = await LegalObligationsService.getUpcomingPaymentObligations();
    const expiringAgreements = await LegalObligationsService.getExpiringAgreementObligations();
    const trafficFines = await LegalObligationsService.getUnpaidTrafficFines();

    // Combine all obligations
    const allObligations = [
      ...overduePayments.map(item => ({
        ...item,
        daysOverdue: 30, // Example value, in reality should be calculated
        lateFine: 500, // Example value
        obligationType: 'payment' as const,
        urgency: determineUrgency(30, item.amount || 0)
      })),
      ...upcomingPayments.map(item => ({
        ...item,
        daysOverdue: 0,
        lateFine: 0,
        obligationType: 'payment' as const,
        urgency: determineUrgency(0, item.amount || 0)
      })),
      ...expiringAgreements.map(item => ({
        ...item,
        daysOverdue: 0,
        lateFine: 0,
        obligationType: 'legal_case' as const,
        urgency: determineUrgency(0, 0)
      })),
      ...trafficFines.map(item => ({
        ...item,
        daysOverdue: 15, // Example value
        lateFine: 200, // Example value
        obligationType: 'traffic_fine' as const,
        urgency: determineUrgency(15, item.amount || 0)
      }))
    ];

    return {
      obligations: allObligations,
      partialSuccess: false,
      error: null
    };
  } catch (error) {
    console.error('Error fetching legal obligations:', error);
    return {
      obligations: [],
      partialSuccess: false,
      error: 'Failed to fetch legal obligations'
    };
  }
};

export class LegalObligationsService {
  
  /**
   * Fetches overdue payments for all customers
   */
  static async getOverduePaymentObligations(): Promise<LegalObligation[]> {
    try {
      const { data: overdue, error } = await supabase
        .from('overdue_payments')
        .select(`
          id,
          agreement_id,
          customer_id,
          total_amount,
          amount_paid,
          balance,
          status,
          leases:agreement_id(agreement_number),
          profiles:customer_id(full_name)
        `)
        .order('days_overdue', { ascending: false });

      if (error || !overdue) {
        console.error('Error fetching overdue payments:', error);
        return [];
      }

      return overdue.map(item => {
        return {
          id: item.id,
          type: 'overdue_payment',
          title: 'Overdue Payment',
          dueDate: null,
          amount: item.balance,
          customerId: item.customer_id,
          customerName: item.profiles?.full_name || 'Unknown Customer',
          status: item.status || 'pending',
          leaseId: item.agreement_id,
          agreementNumber: item.leases?.agreement_number
        };
      });
    } catch (error) {
      console.error('Error in getOverduePaymentObligations:', error);
      return [];
    }
  }
  
  /**
   * Fetches upcoming payments within the next days
   */
  static async getUpcomingPaymentObligations(days: number = 7): Promise<LegalObligation[]> {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      
      const { data: payments, error } = await supabase
        .from('unified_payments')
        .select(`
          id,
          amount,
          due_date,
          status,
          lease_id,
          leases:lease_id(agreement_number, customer_id),
          profiles:leases.customer_id(full_name)
        `)
        .eq('status', asStatusColumn('pending'))
        .lt('due_date', futureDate.toISOString())
        .gt('due_date', new Date().toISOString())
        .order('due_date');

      if (error || !payments) {
        console.error('Error fetching upcoming payments:', error);
        return [];
      }

      return payments.map(payment => {
        // Use optional chaining and nullish coalescing for safety
        return {
          id: payment.id || '',
          type: 'upcoming_payment',
          title: 'Upcoming Payment',
          dueDate: payment.due_date ? new Date(payment.due_date) : null,
          amount: payment.amount,
          customerId: payment.leases?.customer_id || '',
          customerName: payment.profiles?.full_name || 'Unknown Customer',
          status: payment.status || 'pending',
          leaseId: payment.lease_id,
          agreementNumber: payment.leases?.agreement_number
        };
      });
    } catch (error) {
      console.error('Error in getUpcomingPaymentObligations:', error);
      return [];
    }
  }
  
  /**
   * Fetches agreements with expiring dates
   */
  static async getExpiringAgreementObligations(days: number = 30): Promise<LegalObligation[]> {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      
      const { data: leases, error } = await supabase
        .from('leases')
        .select(`
          id,
          agreement_number,
          customer_id,
          end_date,
          status,
          profiles:customer_id(full_name)
        `)
        .lt('end_date', futureDate.toISOString())
        .gt('end_date', new Date().toISOString())
        .order('end_date');

      if (error || !leases) {
        console.error('Error fetching expiring agreements:', error);
        return [];
      }

      return leases.map(lease => {
        // Safe access using optional chaining
        return {
          id: lease?.id || '',
          type: 'expiring_agreement',
          title: 'Expiring Agreement',
          dueDate: lease.end_date ? new Date(lease.end_date) : null,
          customerId: lease?.customer_id || '',
          customerName: lease?.profiles?.full_name || 'Unknown Customer',
          status: 'pending',
          leaseId: lease.id,
          agreementNumber: lease.agreement_number
        };
      });
    } catch (error) {
      console.error('Error in getExpiringAgreementObligations:', error);
      return [];
    }
  }

  /**
   * Get Unpaid Traffic Fines
   */
  static async getUnpaidTrafficFines(): Promise<LegalObligation[]> {
    try {
      // Query traffic fines with customer information through lease relationship
      const { data: fines, error } = await supabase
        .from('traffic_fines')
        .select(`
          id, 
          fine_amount,
          license_plate,
          violation_date,
          payment_status,
          leases:lease_id(agreement_number, customer_id),
          profiles:leases.customer_id(id, full_name)
        `)
        .eq('payment_status', 'pending')
        .order('violation_date');

      if (error) {
        console.error('Error fetching unpaid traffic fines:', error);
        return [];
      }

      return (fines || []).map(fine => {
        // Use optional chaining and nullish coalescing for safety
        return {
          id: fine.id || '',
          type: 'unpaid_fine',
          title: `Unpaid Traffic Fine (${fine.license_plate || 'Unknown'})`,
          dueDate: fine.violation_date ? new Date(fine.violation_date) : null,
          amount: fine.fine_amount,
          customerId: fine.profiles?.id || '',
          customerName: fine.profiles?.full_name || 'Unknown',
          status: fine.payment_status || 'pending',
          agreementNumber: fine.leases?.agreement_number
        };
      });
    } catch (error) {
      console.error('Error in getUnpaidTrafficFines:', error);
      return [];
    }
  }
}
