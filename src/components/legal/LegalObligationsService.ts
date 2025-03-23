
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
    
    const { data: overduePayments, error: paymentsError } = await supabase
      .from('unified_payments')
      .select(`
        id, 
        amount, 
        amount_paid, 
        balance, 
        payment_date, 
        days_overdue,
        lease_id,
        leases:lease_id (
          customer_id, 
          agreement_number,
          customer:customer_id (
            id, 
            full_name
          )
        )
      `)
      .eq('status', 'pending')
      .gt('days_overdue', 0)
      .order('days_overdue', { ascending: false });
    
    if (paymentsError) {
      console.error('Error fetching overdue payments:', paymentsError);
      return { data: [], error: `Payment fetch error: ${paymentsError.message}` };
    }
    
    console.log(`Fetched ${overduePayments?.length || 0} overdue payments`);
    
    const result: CustomerObligation[] = [];
    
    if (overduePayments) {
      for (const payment of overduePayments) {
        // Make sure leases exists
        if (!payment.leases) {
          console.log(`Skipping payment ${payment.id} - missing lease data`);
          continue;
        }
        
        // Make sure customer exists in leases
        if (!payment.leases.customer) {
          console.log(`Skipping payment ${payment.id} - missing customer data`);
          continue;
        }
        
        // Type guard to ensure we have proper profile data
        const profileData = payment.leases.customer;
        
        if (!isValidProfile(profileData)) {
          console.log(`Skipping payment ${payment.id} - invalid profile data`);
          continue;
        }
        
        const daysOverdue = payment.days_overdue || 0;
        
        // Safely access customer data after validating with type guard
        result.push({
          id: payment.id,
          customerId: profileData.id,
          customerName: profileData.full_name,
          obligationType: 'payment' as ObligationType,
          amount: payment.balance || 0,
          dueDate: new Date(payment.payment_date),
          description: `Overdue rent payment (Agreement #${payment.leases.agreement_number})`,
          urgency: determineUrgency(daysOverdue),
          status: 'Overdue Payment',
          daysOverdue
        });
      }
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
    
    const { data: trafficFines, error: finesError } = await supabase
      .from('traffic_fines')
      .select(`
        id, 
        fine_amount, 
        violation_date, 
        violation_number,
        violation_charge,
        fine_location,
        lease_id,
        leases:lease_id (
          customer_id, 
          agreement_number,
          customer:customer_id (
            id, 
            full_name
          )
        )
      `)
      .eq('payment_status', 'pending')
      .order('violation_date', { ascending: false });
    
    if (finesError) {
      console.error('Error fetching traffic fines:', finesError);
      return { data: [], error: `Traffic fines fetch error: ${finesError.message}` };
    }
    
    console.log(`Fetched ${trafficFines?.length || 0} traffic fines`);
    
    const result: CustomerObligation[] = [];
    
    if (trafficFines) {
      for (const fine of trafficFines) {
        // Make sure leases exists
        if (!fine.leases) {
          console.log(`Skipping fine ${fine.id} - missing lease data`);
          continue;
        }
        
        // Make sure customer exists in leases
        if (!fine.leases.customer) {
          console.log(`Skipping fine ${fine.id} - missing customer data`);
          continue;
        }
        
        // Type guard to ensure we have proper profile data
        const profileData = fine.leases.customer;
        
        if (!isValidProfile(profileData)) {
          console.log(`Skipping fine ${fine.id} - invalid profile data`);
          continue;
        }
        
        const violationDate = new Date(fine.violation_date);
        const today = new Date();
        const daysOverdue = Math.floor((today.getTime() - violationDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Safely access customer data after validating with type guard
        result.push({
          id: fine.id,
          customerId: profileData.id,
          customerName: profileData.full_name,
          obligationType: 'traffic_fine' as ObligationType,
          amount: fine.fine_amount || 0,
          dueDate: violationDate,
          description: `Unpaid traffic fine (Agreement #${fine.leases.agreement_number})`,
          urgency: determineUrgency(daysOverdue),
          status: 'Unpaid Fine',
          daysOverdue
        });
      }
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
    
    const { data: legalCases, error: casesError } = await supabase
      .from('legal_cases')
      .select(`
        id, 
        amount_owed, 
        created_at, 
        customer_id, 
        priority, 
        status,
        customer:customer_id (
          id, 
          full_name
        )
      `)
      .in('status', ['pending_reminder', 'in_legal_process', 'escalated'])
      .order('created_at', { ascending: false });
    
    if (casesError) {
      console.error('Error fetching legal cases:', casesError);
      return { data: [], error: `Legal cases fetch error: ${casesError.message}` };
    }
    
    console.log(`Fetched ${legalCases?.length || 0} legal cases`);
    
    const result: CustomerObligation[] = [];
    
    if (legalCases) {
      for (const legalCase of legalCases) {
        // Make sure customer exists
        if (!legalCase.customer) {
          console.log(`Skipping legal case ${legalCase.id} - missing customer data`);
          continue;
        }
        
        // Type guard to ensure we have proper profile data
        const profileData = legalCase.customer;
        
        if (!isValidProfile(profileData)) {
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
        
        // Safely access customer data after validating with type guard
        result.push({
          id: legalCase.id,
          customerId: legalCase.customer_id,
          customerName: profileData.full_name,
          obligationType: 'legal_case' as ObligationType,
          amount: legalCase.amount_owed || 0,
          dueDate: createdDate,
          description: `Legal case (${String(legalCase.status).replace(/_/g, ' ')})`,
          urgency,
          status: 'Legal Case',
          daysOverdue
        });
      }
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
