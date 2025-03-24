
import { supabase } from '@/integrations/supabase/client';
import { CustomerObligation, ObligationType, UrgencyLevel } from './CustomerLegalObligations';
import { toast } from 'sonner';

// Helper function to determine urgency based on days overdue
export const determineUrgency = (daysOverdue: number): UrgencyLevel => {
  if (daysOverdue <= 0) return 'low';
  if (daysOverdue <= 15) return 'medium';
  if (daysOverdue <= 30) return 'high';
  return 'critical';
};

// Calculate late fine for overdue payments
// 120 QAR per day starting from due date, maximum 3000 QAR per month
export const calculateLateFine = (daysOverdue: number): number => {
  if (daysOverdue <= 0) return 0;
  const lateFine = daysOverdue * 120;
  // Cap the fine at 3000 QAR
  return Math.min(lateFine, 3000);
};

// Type guard function to validate profile data
const isValidProfile = (profile: any): profile is { id: string; full_name: string } => {
  return (
    profile &&
    typeof profile === 'object' &&
    'id' in profile &&
    'full_name' in profile &&
    typeof profile.id === 'string' &&
    typeof profile.full_name === 'string' &&
    profile.id !== null &&
    profile.full_name !== null
  );
};

// Fetch overdue payments
const fetchOverduePayments = async (): Promise<{ 
  data: CustomerObligation[];
  error: string | null;
}> => {
  try {
    console.log("Fetching overdue payments...");
    
    // Step 1: First fetch payments that are overdue
    const { data: overduePayments, error: paymentsError } = await supabase
      .from('unified_payments')
      .select(`
        id, 
        amount, 
        amount_paid, 
        balance, 
        payment_date, 
        days_overdue,
        lease_id
      `)
      .eq('status', 'pending')
      .gt('days_overdue', 0)
      .order('days_overdue', { ascending: false });
    
    if (paymentsError) {
      console.error('Error fetching overdue payments:', paymentsError);
      return { data: [], error: `Payment fetch error: ${paymentsError.message}` };
    }
    
    console.log(`Fetched ${overduePayments?.length || 0} overdue payments`);
    
    if (!overduePayments || overduePayments.length === 0) {
      return { data: [], error: null };
    }
    
    // Step 2: Extract lease IDs for the second query
    const leaseIds = overduePayments.map(payment => payment.lease_id).filter(Boolean);
    
    if (leaseIds.length === 0) {
      return { data: [], error: null };
    }
    
    // Step 3: Fetch leases data separately
    const { data: leasesData, error: leasesError } = await supabase
      .from('leases')
      .select(`
        id,
        agreement_number,
        customer_id
      `)
      .in('id', leaseIds);
    
    if (leasesError) {
      console.error('Error fetching leases data:', leasesError);
      return { data: [], error: `Lease data fetch error: ${leasesError.message}` };
    }
    
    // Step 4: Create a map of lease IDs to lease data for quick lookup
    const leaseMap = new Map();
    leasesData?.forEach(lease => {
      leaseMap.set(lease.id, lease);
    });
    
    // Step 5: Extract customer IDs for the third query
    const customerIds = leasesData?.map(lease => lease.customer_id).filter(Boolean) || [];
    
    if (customerIds.length === 0) {
      return { data: [], error: null };
    }
    
    // Step 6: Fetch customer data separately
    const { data: customersData, error: customersError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name
      `)
      .in('id', customerIds);
    
    if (customersError) {
      console.error('Error fetching customers data:', customersError);
      return { data: [], error: `Customer data fetch error: ${customersError.message}` };
    }
    
    // Step 7: Create a map of customer IDs to customer data for quick lookup
    const customerMap = new Map();
    customersData?.forEach(customer => {
      customerMap.set(customer.id, customer);
    });
    
    // Step 8: Combine all the data manually
    const result: CustomerObligation[] = [];
    
    for (const payment of overduePayments) {
      if (!payment.lease_id) {
        console.log(`Skipping payment ${payment.id} - missing lease ID`);
        continue;
      }
      
      const lease = leaseMap.get(payment.lease_id);
      if (!lease) {
        console.log(`Skipping payment ${payment.id} - missing lease data for lease ID ${payment.lease_id}`);
        continue;
      }
      
      if (!lease.customer_id) {
        console.log(`Skipping payment ${payment.id} - missing customer ID in lease ${lease.id}`);
        continue;
      }
      
      const customer = customerMap.get(lease.customer_id);
      if (!customer) {
        console.log(`Skipping payment ${payment.id} - missing customer data for customer ID ${lease.customer_id}`);
        continue;
      }
      
      // Type guard to ensure we have proper profile data
      if (!isValidProfile(customer)) {
        console.log(`Skipping payment ${payment.id} - invalid profile data for customer ID ${lease.customer_id}`);
        continue;
      }
      
      const daysOverdue = payment.days_overdue || 0;
      
      // Calculate late fine for this payment
      const lateFine = calculateLateFine(daysOverdue);
      
      // Add the original balance plus the late fine
      const totalAmount = (payment.balance || 0) + lateFine;
      
      result.push({
        id: payment.id,
        customerId: customer.id,
        customerName: customer.full_name,
        obligationType: 'payment' as ObligationType,
        amount: totalAmount,
        dueDate: new Date(payment.payment_date),
        description: `Overdue rent payment (Agreement #${lease.agreement_number})`,
        urgency: determineUrgency(daysOverdue),
        status: 'pending',
        daysOverdue,
        agreementId: lease.id,
        agreementNumber: lease.agreement_number,
        lateFine: lateFine // Add the late fine amount to the obligation object
      });
    }
    
    return { data: result, error: null };
  } catch (error) {
    console.error('Error processing payment obligations:', error);
    return { data: [], error: 'Failed to load payment obligations' };
  }
};

// Fetch traffic fines
const fetchTrafficFines = async (): Promise<{
  data: CustomerObligation[];
  error: string | null;
}> => {
  try {
    console.log("Fetching traffic fines...");
    
    // First fetch traffic fines with lease_id
    const { data: trafficFines, error: finesError } = await supabase
      .from('traffic_fines')
      .select(`
        id, 
        fine_amount, 
        violation_date, 
        violation_number,
        violation_charge,
        fine_location,
        lease_id
      `)
      .eq('payment_status', 'pending')
      .order('violation_date', { ascending: false });
    
    if (finesError) {
      console.error('Error fetching traffic fines:', finesError);
      return { data: [], error: `Traffic fines fetch error: ${finesError.message}` };
    }
    
    console.log(`Fetched ${trafficFines?.length || 0} traffic fines`);
    
    if (!trafficFines || trafficFines.length === 0) {
      return { data: [], error: null };
    }
    
    // Extract lease IDs for the second query
    const leaseIds = trafficFines.map(fine => fine.lease_id).filter(id => id != null);
    
    if (leaseIds.length === 0) {
      return { data: [], error: null };
    }
    
    // Fetch leases data for these fines
    const { data: leasesData, error: leasesError } = await supabase
      .from('leases')
      .select(`
        id,
        agreement_number,
        customer_id
      `)
      .in('id', leaseIds);
    
    if (leasesError) {
      console.error('Error fetching leases data for fines:', leasesError);
      return { data: [], error: `Lease data fetch error: ${leasesError.message}` };
    }
    
    // Create a map of lease IDs to lease data for quick lookup
    const leaseMap = new Map();
    leasesData?.forEach(lease => {
      leaseMap.set(lease.id, lease);
    });
    
    // Extract customer IDs for the third query
    const customerIds = leasesData?.map(lease => lease.customer_id) || [];
    
    // Fetch customer data
    const { data: customersData, error: customersError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name
      `)
      .in('id', customerIds);
    
    if (customersError) {
      console.error('Error fetching customers data for fines:', customersError);
      return { data: [], error: `Customer data fetch error: ${customersError.message}` };
    }
    
    // Create a map of customer IDs to customer data for quick lookup
    const customerMap = new Map();
    customersData?.forEach(customer => {
      customerMap.set(customer.id, customer);
    });
    
    const result: CustomerObligation[] = [];
    
    // Combine all the data
    for (const fine of trafficFines) {
      if (!fine.lease_id) {
        console.log(`Skipping fine ${fine.id} - missing lease ID`);
        continue;
      }
      
      const lease = leaseMap.get(fine.lease_id);
      if (!lease) {
        console.log(`Skipping fine ${fine.id} - missing lease data`);
        continue;
      }
      
      const customer = customerMap.get(lease.customer_id);
      if (!customer) {
        console.log(`Skipping fine ${fine.id} - missing customer data`);
        continue;
      }
      
      // Type guard to ensure we have proper profile data
      if (!isValidProfile(customer)) {
        console.log(`Skipping fine ${fine.id} - invalid profile data`);
        continue;
      }
      
      const violationDate = new Date(fine.violation_date);
      const today = new Date();
      const daysOverdue = Math.floor((today.getTime() - violationDate.getTime()) / (1000 * 60 * 60 * 24));
      
      result.push({
        id: fine.id,
        customerId: customer.id,
        customerName: customer.full_name,
        obligationType: 'traffic_fine' as ObligationType,
        amount: fine.fine_amount || 0,
        dueDate: violationDate,
        description: `Unpaid traffic fine (Agreement #${lease.agreement_number})`,
        urgency: determineUrgency(daysOverdue),
        status: 'pending',
        daysOverdue,
        agreementId: lease.id,
        agreementNumber: lease.agreement_number
      });
    }
    
    return { data: result, error: null };
  } catch (error) {
    console.error('Error processing traffic fine obligations:', error);
    return { data: [], error: 'Failed to load traffic fine obligations' };
  }
};

// Fetch legal cases
const fetchLegalCases = async (): Promise<{
  data: CustomerObligation[];
  error: string | null;
}> => {
  try {
    console.log("Fetching legal cases...");
    
    // Fetch legal cases directly with customer_id
    const { data: legalCases, error: casesError } = await supabase
      .from('legal_cases')
      .select(`
        id, 
        amount_owed, 
        created_at, 
        customer_id, 
        priority, 
        status
      `)
      .in('status', ['pending_reminder', 'in_legal_process', 'escalated'])
      .order('created_at', { ascending: false });
    
    if (casesError) {
      console.error('Error fetching legal cases:', casesError);
      return { data: [], error: `Legal cases fetch error: ${casesError.message}` };
    }
    
    console.log(`Fetched ${legalCases?.length || 0} legal cases`);
    
    if (!legalCases || legalCases.length === 0) {
      return { data: [], error: null };
    }
    
    // Extract customer IDs for the second query
    const customerIds = legalCases.map(legalCase => legalCase.customer_id).filter(id => id != null);
    
    if (customerIds.length === 0) {
      return { data: [], error: null };
    }
    
    // Fetch customer data
    const { data: customersData, error: customersError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name
      `)
      .in('id', customerIds);
    
    if (customersError) {
      console.error('Error fetching customers data for legal cases:', customersError);
      return { data: [], error: `Customer data fetch error: ${customersError.message}` };
    }
    
    // Create a map of customer IDs to customer data for quick lookup
    const customerMap = new Map();
    customersData?.forEach(customer => {
      customerMap.set(customer.id, customer);
    });
    
    const result: CustomerObligation[] = [];
    
    // Combine all the data
    for (const legalCase of legalCases) {
      if (!legalCase.customer_id) {
        console.log(`Skipping legal case ${legalCase.id} - missing customer ID`);
        continue;
      }
      
      const customer = customerMap.get(legalCase.customer_id);
      if (!customer) {
        console.log(`Skipping legal case ${legalCase.id} - missing customer data`);
        continue;
      }
      
      // Type guard to ensure we have proper profile data
      if (!isValidProfile(customer)) {
        console.log(`Skipping legal case ${legalCase.id} - invalid profile data`);
        continue;
      }
      
      const createdDate = new Date(legalCase.created_at);
      const today = new Date();
      const daysOverdue = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Map priority to urgency
      let urgency: UrgencyLevel = 'medium';
      if (legalCase.priority === 'high') urgency = 'high';
      if (legalCase.priority === 'urgent') urgency = 'critical';
      if (legalCase.priority === 'low') urgency = 'low';
      
      result.push({
        id: legalCase.id,
        customerId: legalCase.customer_id,
        customerName: customer.full_name,
        obligationType: 'legal_case' as ObligationType,
        amount: legalCase.amount_owed || 0,
        dueDate: createdDate,
        description: `Legal case (${String(legalCase.status).replace(/_/g, ' ')})`,
        urgency,
        status: 'pending',
        daysOverdue
      });
    }
    
    return { data: result, error: null };
  } catch (error) {
    console.error('Error processing legal case obligations:', error);
    return { data: [], error: 'Failed to load legal case obligations' };
  }
};

// Main function to fetch all legal obligations with progressive loading
export const fetchLegalObligations = async (): Promise<{
  obligations: CustomerObligation[];
  error: string | null;
  partialSuccess?: boolean;
}> => {
  try {
    console.log("Starting legal obligations fetch...");
    
    // Try to fetch all types of obligations, but handle failures independently
    const [paymentsResult, finesResult, casesResult] = await Promise.allSettled([
      fetchOverduePayments(),
      fetchTrafficFines(),
      fetchLegalCases()
    ]);
    
    // Initialize collections
    const allObligations: CustomerObligation[] = [];
    const errors: string[] = [];
    let partialSuccess = false;
    
    // Process payments result
    if (paymentsResult.status === 'fulfilled') {
      if (paymentsResult.value.error) {
        errors.push(paymentsResult.value.error);
      } else {
        allObligations.push(...paymentsResult.value.data);
        partialSuccess = true;
      }
    } else {
      errors.push('Failed to fetch payment obligations');
    }
    
    // Process fines result
    if (finesResult.status === 'fulfilled') {
      if (finesResult.value.error) {
        errors.push(finesResult.value.error);
      } else {
        allObligations.push(...finesResult.value.data);
        partialSuccess = true;
      }
    } else {
      errors.push('Failed to fetch traffic fine obligations');
    }
    
    // Process legal cases result
    if (casesResult.status === 'fulfilled') {
      if (casesResult.value.error) {
        errors.push(casesResult.value.error);
      } else {
        allObligations.push(...casesResult.value.data);
        partialSuccess = true;
      }
    } else {
      errors.push('Failed to fetch legal case obligations');
    }
    
    console.log(`Total obligations fetched: ${allObligations.length}`);
    
    // If we have some data but not all, we can still show what we have
    if (allObligations.length > 0 && errors.length > 0) {
      return {
        obligations: allObligations,
        error: errors.join('. '),
        partialSuccess: true
      };
    }
    
    // If all failed, return an error
    if (errors.length > 0 && allObligations.length === 0) {
      return {
        obligations: [],
        error: errors.join('. ')
      };
    }
    
    // Everything succeeded
    return {
      obligations: allObligations,
      error: null
    };
  } catch (error) {
    console.error('Unexpected error fetching all obligations:', error);
    return {
      obligations: [],
      error: 'Failed to load legal obligations. Please try again.'
    };
  }
};
