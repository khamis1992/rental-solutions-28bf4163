
import { supabase } from '@/lib/supabase';
import { hasData } from '@/utils/database-type-helpers';

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

// Type for the CustomerObligation with all required properties
export interface CustomerObligation {
  id: string;
  customerId: string;
  customerName: string;
  obligationType: 'payment' | 'traffic_fine' | 'legal_case';
  amount: number;
  dueDate: Date;
  description: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  daysOverdue: number;
  agreementId?: string;
  agreementNumber?: string;
  lateFine?: number;
}

// Comprehensive function to fetch all types of legal obligations
export const fetchLegalObligations = async () => {
  try {
    // Mock data for various obligations
    const overduePayments = await getOverduePaymentObligations();
    const upcomingPayments = await getUpcomingPaymentObligations();
    const expiringAgreements = await getExpiringAgreementObligations();
    const trafficFines = await getUnpaidTrafficFines();

    // Combine all obligations and map to CustomerObligation type
    const allObligations = [
      ...overduePayments.map(item => ({
        id: item.id,
        customerId: item.customerId,
        customerName: item.customerName,
        obligationType: 'payment' as const,
        amount: item.amount || 0,
        dueDate: new Date(),
        description: `Overdue Payment: ${item.agreementNumber || 'Unknown Agreement'}`,
        urgency: determineUrgency(30, item.amount || 0),
        status: item.status,
        daysOverdue: 30,
        lateFine: 500,
        agreementId: item.leaseId,
        agreementNumber: item.agreementNumber
      })),
      ...upcomingPayments.map(item => ({
        id: item.id,
        customerId: item.customerId,
        customerName: item.customerName,
        obligationType: 'payment' as const,
        amount: item.amount || 0,
        dueDate: item.dueDate || new Date(),
        description: `Upcoming Payment: ${item.agreementNumber || 'Unknown Agreement'}`,
        urgency: determineUrgency(0, item.amount || 0),
        status: item.status,
        daysOverdue: 0,
        lateFine: 0,
        agreementId: item.leaseId,
        agreementNumber: item.agreementNumber
      })),
      ...expiringAgreements.map(item => ({
        id: item.id,
        customerId: item.customerId,
        customerName: item.customerName,
        obligationType: 'legal_case' as const,
        amount: 0,
        dueDate: item.dueDate || new Date(),
        description: `Expiring Agreement: ${item.agreementNumber || 'Unknown Agreement'}`,
        urgency: 'medium' as const,
        status: 'pending',
        daysOverdue: 0,
        agreementId: item.leaseId,
        agreementNumber: item.agreementNumber
      })),
      ...trafficFines.map(item => ({
        id: item.id,
        customerId: item.customerId,
        customerName: item.customerName,
        obligationType: 'traffic_fine' as const,
        amount: item.amount || 0,
        dueDate: item.dueDate || new Date(),
        description: `Traffic Fine: ${item.title}`,
        urgency: determineUrgency(15, item.amount || 0),
        status: item.status,
        daysOverdue: 15,
        lateFine: 200,
        agreementNumber: item.agreementNumber
      }))
    ] as CustomerObligation[];

    return {
      obligations: allObligations,
      partialSuccess: false,
      error: null
    };
  } catch (error) {
    console.error('Error fetching legal obligations:', error);
    return {
      obligations: [] as CustomerObligation[],
      partialSuccess: false,
      error: 'Failed to fetch legal obligations'
    };
  }
};

// Helper function to safely get data from potentially unsafe sources
function safeProp<T>(obj: any, prop: string, fallback: T): T {
  if (obj && typeof obj === 'object' && prop in obj) {
    return obj[prop];
  }
  return fallback;
}

// LegalObligationsService class with methods to fetch different types of obligations
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
          status
        `)
        .order('id');

      if (error || !overdue) {
        console.error('Error fetching overdue payments:', error);
        return [];
      }

      // Fetch additional data for enrichment
      const customerIds = [...new Set(overdue.map(item => item.customer_id))];
      const agreementIds = [...new Set(overdue.map(item => item.agreement_id))];

      const { data: customers } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', customerIds);

      const { data: agreements } = await supabase
        .from('leases')
        .select('id, agreement_number')
        .in('id', agreementIds);

      const customerMap = new Map();
      const agreementMap = new Map();

      if (customers) {
        customers.forEach(c => customerMap.set(c.id, c.full_name));
      }

      if (agreements) {
        agreements.forEach(a => agreementMap.set(a.id, a.agreement_number));
      }

      return overdue.map(item => {
        return {
          id: item.id,
          type: 'overdue_payment',
          title: 'Overdue Payment',
          dueDate: null,
          amount: item.balance,
          customerId: item.customer_id,
          customerName: customerMap.get(item.customer_id) || 'Unknown Customer',
          status: item.status || 'pending',
          leaseId: item.agreement_id,
          agreementNumber: agreementMap.get(item.agreement_id)
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
          lease_id
        `)
        .eq('status', 'pending')
        .lt('due_date', futureDate.toISOString())
        .gt('due_date', new Date().toISOString())
        .order('due_date');

      if (error || !payments) {
        console.error('Error fetching upcoming payments:', error);
        return [];
      }

      // Fetch additional data
      const leaseIds = [...new Set(payments.filter(p => p.lease_id).map(p => p.lease_id))];
      
      const { data: leases } = await supabase
        .from('leases')
        .select('id, agreement_number, customer_id')
        .in('id', leaseIds);

      const customerIds = leases?.map(l => l.customer_id) || [];
      
      const { data: customers } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', customerIds);
      
      const leaseMap = new Map();
      const customerMap = new Map();
      
      if (leases) {
        leases.forEach(l => leaseMap.set(l.id, {
          agreementNumber: l.agreement_number,
          customerId: l.customer_id
        }));
      }
      
      if (customers) {
        customers.forEach(c => customerMap.set(c.id, c.full_name));
      }

      return payments.map(payment => {
        const leaseInfo = leaseMap.get(payment.lease_id) || {};
        const customerId = leaseInfo.customerId || '';
        
        return {
          id: payment.id,
          type: 'upcoming_payment',
          title: 'Upcoming Payment',
          dueDate: payment.due_date ? new Date(payment.due_date) : null,
          amount: payment.amount,
          customerId: customerId,
          customerName: customerMap.get(customerId) || 'Unknown Customer',
          status: payment.status || 'pending',
          leaseId: payment.lease_id,
          agreementNumber: leaseInfo.agreementNumber
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
          status
        `)
        .lt('end_date', futureDate.toISOString())
        .gt('end_date', new Date().toISOString())
        .order('end_date');

      if (error || !leases) {
        console.error('Error fetching expiring agreements:', error);
        return [];
      }

      const customerIds = [...new Set(leases.map(lease => lease.customer_id))];
      
      const { data: customers } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', customerIds);
      
      const customerMap = new Map();
      
      if (customers) {
        customers.forEach(c => customerMap.set(c.id, c.full_name));
      }

      return leases.map(lease => {
        return {
          id: lease.id,
          type: 'expiring_agreement',
          title: 'Expiring Agreement',
          dueDate: lease.end_date ? new Date(lease.end_date) : null,
          customerId: lease.customer_id,
          customerName: customerMap.get(lease.customer_id) || 'Unknown Customer',
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
      // Query traffic fines with license plate information
      const { data: fines, error } = await supabase
        .from('traffic_fines')
        .select(`
          id, 
          fine_amount,
          license_plate,
          violation_date,
          payment_status,
          lease_id
        `)
        .eq('payment_status', 'pending')
        .order('violation_date');

      if (error || !fines) {
        console.error('Error fetching unpaid traffic fines:', error);
        return [];
      }

      // Fetch additional data
      const leaseIds = [...new Set(fines.filter(f => f.lease_id).map(f => f.lease_id))];
      
      const { data: leases } = await supabase
        .from('leases')
        .select('id, agreement_number, customer_id')
        .in('id', leaseIds);

      const customerIds = leases?.map(l => l.customer_id) || [];
      
      const { data: customers } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', customerIds);
      
      const leaseMap = new Map();
      const customerMap = new Map();
      
      if (leases) {
        leases.forEach(l => leaseMap.set(l.id, {
          agreementNumber: l.agreement_number,
          customerId: l.customer_id
        }));
      }
      
      if (customers) {
        customers.forEach(c => customerMap.set(c.id, c.full_name));
      }

      return fines.map(fine => {
        const leaseInfo = leaseMap.get(fine.lease_id) || {};
        const customerId = leaseInfo.customerId || '';
        
        return {
          id: fine.id,
          type: 'unpaid_fine',
          title: `Traffic Fine (${fine.license_plate || 'Unknown'})`,
          dueDate: fine.violation_date ? new Date(fine.violation_date) : null,
          amount: fine.fine_amount,
          customerId: customerId,
          customerName: customerMap.get(customerId) || 'Unknown',
          status: fine.payment_status || 'pending',
          leaseId: fine.lease_id,
          agreementNumber: leaseInfo.agreementNumber
        };
      });
    } catch (error) {
      console.error('Error in getUnpaidTrafficFines:', error);
      return [];
    }
  }
}
