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
        const leaseId = payment.leases?.lease_id;
        return {
          id: payment.id,
          type: 'upcoming_payment',
          title: 'Upcoming Payment',
          dueDate: payment.due_date ? new Date(payment.due_date) : null,
          amount: payment.amount,
          customerId: payment.leases?.customer_id || '',
          customerName: payment.profiles?.full_name || 'Unknown Customer',
          status: payment.status,
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
        const id = lease?.id;
        const customerName = lease?.profiles?.full_name || 'Unknown Customer';
        const customerId = lease?.customer_id || '';
        
        return {
          id: id || '',
          type: 'expiring_agreement',
          title: 'Expiring Agreement',
          dueDate: lease.end_date ? new Date(lease.end_date) : null,
          customerId,
          customerName,
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
        // Extract customer name safely with optional chaining
        const customerName = fine.profiles?.full_name || 'Unknown';
        const customerId = fine.profiles?.id || '';

        return {
          id: fine.id,
          type: 'unpaid_fine',
          title: `Unpaid Traffic Fine (${fine.license_plate || 'Unknown'})`,
          dueDate: fine.violation_date ? new Date(fine.violation_date) : null,
          amount: fine.fine_amount,
          customerId: customerId,
          customerName: customerName,
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
