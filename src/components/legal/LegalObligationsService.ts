
import { supabase } from '@/lib/supabase';
import { hasData } from '@/utils/database-type-helpers';

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

// Mock data for various obligations
async function getOverduePaymentObligations() {
  try {
    const { data, error } = await supabase
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

    if (error || !data) {
      console.error('Error fetching overdue payments:', error);
      return [];
    }

    // Get customer information for enrichment
    const customerIds = [...new Set(data.map(item => item.customer_id))];
    const { data: customers } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', customerIds);

    // Get agreement information
    const agreementIds = [...new Set(data.map(item => item.agreement_id).filter(Boolean))];
    const { data: agreements } = await supabase
      .from('leases')
      .select('id, agreement_number')
      .in('id', agreementIds);

    const customerMap = new Map();
    const agreementMap = new Map();

    if (customers && Array.isArray(customers)) {
      customers.forEach(c => c && c.id && customerMap.set(c.id, c.full_name));
    }

    if (agreements && Array.isArray(agreements)) {
      agreements.forEach(a => a && a.id && agreementMap.set(a.id, a.agreement_number));
    }

    return data.map(item => {
      return {
        id: item.id,
        type: 'overdue_payment',
        title: 'Overdue Payment',
        dueDate: null,
        amount: item.balance || 0,
        customerId: item.customer_id,
        customerName: customerMap.get(item.customer_id) || 'Unknown Customer',
        status: item.status || 'pending',
        leaseId: item.agreement_id,
        agreementNumber: item.agreement_id ? agreementMap.get(item.agreement_id) : undefined
      };
    });
  } catch (error) {
    console.error('Error in getOverduePaymentObligations:', error);
    return [];
  }
}

// Fetch upcoming payments within the next days
async function getUpcomingPaymentObligations(days = 7) {
  try {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    const { data, error } = await supabase
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

    if (error || !data) {
      console.error('Error fetching upcoming payments:', error);
      return [];
    }

    // Fetch additional data
    const leaseIds = [...new Set(data.filter(p => p.lease_id).map(p => p.lease_id))];
    
    const { data: leases } = await supabase
      .from('leases')
      .select('id, agreement_number, customer_id')
      .in('id', leaseIds);

    const customerIds = leases ? [...new Set(leases.filter(l => l.customer_id).map(l => l.customer_id))] : [];
    
    const { data: customers } = customerIds.length > 0 ? await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', customerIds) : { data: null };
    
    const leaseMap = new Map();
    const customerMap = new Map();
    
    if (leases && Array.isArray(leases)) {
      leases.forEach(l => l && l.id && leaseMap.set(l.id, {
        agreementNumber: l.agreement_number,
        customerId: l.customer_id
      }));
    }
    
    if (customers && Array.isArray(customers)) {
      customers.forEach(c => c && c.id && customerMap.set(c.id, c.full_name));
    }

    return data.map(payment => {
      const leaseInfo = payment.lease_id ? leaseMap.get(payment.lease_id) || {} : {};
      const customerId = leaseInfo.customerId || '';
      
      return {
        id: payment.id,
        type: 'upcoming_payment',
        title: 'Upcoming Payment',
        dueDate: payment.due_date ? new Date(payment.due_date) : new Date(),
        amount: payment.amount || 0,
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

// Fetch agreements with expiring dates
async function getExpiringAgreementObligations(days = 30) {
  try {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    const { data, error } = await supabase
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

    if (error || !data) {
      console.error('Error fetching expiring agreements:', error);
      return [];
    }

    const customerIds = [...new Set(data.filter(l => l.customer_id).map(l => l.customer_id))];
    
    const { data: customers } = customerIds.length > 0 ? await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', customerIds) : { data: null };
    
    const customerMap = new Map();
    
    if (customers && Array.isArray(customers)) {
      customers.forEach(c => c && c.id && customerMap.set(c.id, c.full_name));
    }

    return data.map(lease => {
      return {
        id: lease.id,
        type: 'expiring_agreement',
        title: 'Expiring Agreement',
        dueDate: lease.end_date ? new Date(lease.end_date) : new Date(),
        customerId: lease.customer_id || '',
        customerName: lease.customer_id ? (customerMap.get(lease.customer_id) || 'Unknown Customer') : 'Unknown Customer',
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

// Get Unpaid Traffic Fines
async function getUnpaidTrafficFines() {
  try {
    // Query traffic fines with license plate information
    const { data, error } = await supabase
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

    if (error || !data) {
      console.error('Error fetching unpaid traffic fines:', error);
      return [];
    }

    // Fetch additional data
    const leaseIds = [...new Set(data.filter(f => f.lease_id).map(f => f.lease_id))];
    
    const { data: leases } = leaseIds.length > 0 ? await supabase
      .from('leases')
      .select('id, agreement_number, customer_id')
      .in('id', leaseIds) : { data: null };

    const customerIds = leases ? [...new Set(leases.filter(l => l.customer_id).map(l => l.customer_id))] : [];
    
    const { data: customers } = customerIds.length > 0 ? await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', customerIds) : { data: null };
    
    const leaseMap = new Map();
    const customerMap = new Map();
    
    if (leases && Array.isArray(leases)) {
      leases.forEach(l => l && l.id && leaseMap.set(l.id, {
        agreementNumber: l.agreement_number,
        customerId: l.customer_id
      }));
    }
    
    if (customers && Array.isArray(customers)) {
      customers.forEach(c => c && c.id && customerMap.set(c.id, c.full_name));
    }

    return data.map(fine => {
      const leaseInfo = fine.lease_id ? leaseMap.get(fine.lease_id) || {} : {};
      const customerId = leaseInfo.customerId || '';
      
      return {
        id: fine.id,
        type: 'unpaid_fine',
        title: `Traffic Fine (${fine.license_plate || 'Unknown'})`,
        dueDate: fine.violation_date ? new Date(fine.violation_date) : new Date(),
        amount: fine.fine_amount || 0,
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

// Comprehensive function to fetch all types of legal obligations
export const fetchLegalObligations = async () => {
  try {
    // Fetch obligations from different sources
    const overduePayments = await getOverduePaymentObligations();
    const upcomingPayments = await getUpcomingPaymentObligations();
    const expiringAgreements = await getExpiringAgreementObligations();
    const trafficFines = await getUnpaidTrafficFines();

    // Map all items to the CustomerObligation interface
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

// Export class for backward compatibility
export class LegalObligationsService {
  static async getOverduePaymentObligations() {
    return getOverduePaymentObligations();
  }
  
  static async getUpcomingPaymentObligations(days = 7) {
    return getUpcomingPaymentObligations(days);
  }
  
  static async getExpiringAgreementObligations(days = 30) {
    return getExpiringAgreementObligations(days);
  }

  static async getUnpaidTrafficFines() {
    return getUnpaidTrafficFines();
  }
}
