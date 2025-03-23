
import { supabase } from '@/integrations/supabase/client';
import { CustomerObligation, ObligationType, UrgencyLevel } from './CustomerLegalObligations';
import { toast } from 'sonner';

// Helper function to determine urgency
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

// Main function to fetch all legal obligations with optimized queries
export const fetchLegalObligations = async (): Promise<{
  obligations: CustomerObligation[];
  error: string | null;
}> => {
  try {
    console.log("Starting legal obligations fetch...");
    
    // Collect all obligations
    const allObligations: CustomerObligation[] = [];
    let fetchError: string | null = null;
    
    // 1. Fetch overdue payments with customer data in a single optimized query
    try {
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
            profiles:customer_id (
              id, 
              full_name
            )
          )
        `)
        .eq('status', 'pending')
        .gt('days_overdue', 0)
        .order('days_overdue', { ascending: false });
      
      if (paymentsError) {
        console.error('Error fetching overdue payments with JOIN:', paymentsError);
        toast.error('Failed to load payment data');
        throw new Error(paymentsError.message);
      }
      
      console.log(`Fetched ${overduePayments?.length || 0} overdue payments with JOIN`);
      
      if (overduePayments) {
        for (const payment of overduePayments) {
          // Make sure leases exists
          if (!payment.leases) {
            console.log(`Skipping payment ${payment.id} - missing lease data`);
            continue;
          }
          
          // Make sure profiles exists in leases
          if (!payment.leases.profiles) {
            console.log(`Skipping payment ${payment.id} - missing profile data`);
            continue;
          }
          
          // Type guard to ensure we have proper profile data
          const profileData = payment.leases.profiles;
          
          if (!isValidProfile(profileData)) {
            console.log(`Skipping payment ${payment.id} - invalid profile data`);
            continue;
          }
          
          const daysOverdue = payment.days_overdue || 0;
          
          // Safely access customer data after validating with type guard
          allObligations.push({
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
    } catch (error) {
      console.error('Error processing payment obligations:', error);
      fetchError = 'Failed to load payment obligations';
    }
    
    // 2. Fetch traffic fines with customer data in a single optimized query
    try {
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
            profiles:customer_id (
              id, 
              full_name
            )
          )
        `)
        .eq('payment_status', 'pending')
        .order('violation_date', { ascending: false });
      
      if (finesError) {
        console.error('Error fetching traffic fines with JOIN:', finesError);
        toast.error('Failed to load traffic fines data');
        throw new Error(finesError.message);
      }
      
      console.log(`Fetched ${trafficFines?.length || 0} traffic fines with JOIN`);
      
      if (trafficFines) {
        for (const fine of trafficFines) {
          // Make sure leases exists
          if (!fine.leases) {
            console.log(`Skipping fine ${fine.id} - missing lease data`);
            continue;
          }
          
          // Make sure profiles exists in leases
          if (!fine.leases.profiles) {
            console.log(`Skipping fine ${fine.id} - missing profile data`);
            continue;
          }
          
          // Type guard to ensure we have proper profile data
          const profileData = fine.leases.profiles;
          
          if (!isValidProfile(profileData)) {
            console.log(`Skipping fine ${fine.id} - invalid profile data`);
            continue;
          }
          
          const violationDate = new Date(fine.violation_date);
          const today = new Date();
          const daysOverdue = Math.floor((today.getTime() - violationDate.getTime()) / (1000 * 60 * 60 * 24));
          
          // Safely access customer data after validating with type guard
          allObligations.push({
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
    } catch (error) {
      console.error('Error processing traffic fine obligations:', error);
      if (!fetchError) fetchError = 'Failed to load traffic fine obligations';
    }
    
    // 3. Fetch legal cases with customer data in a single optimized query
    try {
      const { data: legalCases, error: casesError } = await supabase
        .from('legal_cases')
        .select(`
          id, 
          amount_owed, 
          created_at, 
          customer_id, 
          priority, 
          status,
          profiles:customer_id (
            id, 
            full_name
          )
        `)
        .in('status', ['pending_reminder', 'in_legal_process', 'escalated'])
        .order('created_at', { ascending: false });
      
      if (casesError) {
        console.error('Error fetching legal cases with JOIN:', casesError);
        toast.error('Failed to load legal cases data');
        throw new Error(casesError.message);
      }
      
      console.log(`Fetched ${legalCases?.length || 0} legal cases with JOIN`);
      
      if (legalCases) {
        for (const legalCase of legalCases) {
          // Make sure profiles exists
          if (!legalCase.profiles) {
            console.log(`Skipping legal case ${legalCase.id} - missing profile data`);
            continue;
          }
          
          // Type guard to ensure we have proper profile data
          const profileData = legalCase.profiles;
          
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
          allObligations.push({
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
    } catch (error) {
      console.error('Error processing legal case obligations:', error);
      if (!fetchError) fetchError = 'Failed to load legal case obligations';
    }
    
    console.log(`Total obligations fetched: ${allObligations.length}`);
    
    return {
      obligations: allObligations,
      error: fetchError
    };
  } catch (error) {
    console.error('Unexpected error fetching all obligations:', error);
    return {
      obligations: [],
      error: 'Failed to load legal obligations. Please try again.'
    };
  }
};
