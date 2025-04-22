
import { createClient } from '@supabase/supabase-js';
import { checkAndUpdateConflictingAgreements } from '@/utils/agreement-status-checker';

// Initialize Supabase client (using public anon key which is designed to be public)
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Cache for query results
const queryCache = new Map<string, { data: any; timestamp: number; }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Execute a query with caching
 * @param cacheKey - Unique key for caching the query result
 * @param queryFn - Function that executes the Supabase query
 * @returns The query result
 */
export const executeQuery = async <T>(cacheKey: string, queryFn: () => Promise<{ data: T; error: any; }>) => {
  // Check if we have a cached result
  const cachedResult = queryCache.get(cacheKey);
  if (cachedResult && (Date.now() - cachedResult.timestamp < CACHE_TTL)) {
    return { data: cachedResult.data, error: null };
  }

  // Execute the query
  const result = await queryFn();
  
  // Cache the result if there's no error
  if (!result.error && result.data) {
    queryCache.set(cacheKey, { data: result.data, timestamp: Date.now() });
  }

  return result;
};

/**
 * Clear cache entries by key prefix
 * @param keyPrefix - Prefix of cache keys to clear
 */
export const clearCacheByPrefix = (keyPrefix: string) => {
  for (const key of queryCache.keys()) {
    if (key.startsWith(keyPrefix)) {
      queryCache.delete(key);
    }
  }
};

/**
 * Generate monthly payment entries for leases
 */
export const checkAndGenerateMonthlyPayments = async () => {
  try {
    console.log("Running monthly payment generation check");
    
    // Check and fix any overlapping agreements
    const agreementCheckResult = await checkAndUpdateConflictingAgreements();
    
    if (!agreementCheckResult.success) {
      return {
        success: false,
        message: `Failed to check agreements: ${agreementCheckResult.message}`,
        generatedCount: 0
      };
    }
    
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().split('T')[0]; 
    
    console.log(`Looking for agreements needing payments on ${formattedDate}`);
    
    // Find active leases that require payment generation
    const { data: leases, error: leaseError } = await supabase
      .from('leases')
      .select(`
        id, 
        agreement_number,
        rent_amount, 
        status,
        start_date,
        end_date,
        next_payment_date,
        payment_frequency
      `)
      .eq('status', 'active')
      .is('rent_amount', 'not.null')
      .lte('next_payment_date', formattedDate);
      
    if (leaseError) {
      console.error('Error fetching leases for payment generation:', leaseError);
      return { 
        success: false, 
        message: `Database error fetching leases: ${leaseError.message}`,
        generatedCount: 0
      };
    }
    
    if (!leases || leases.length === 0) {
      console.log("No leases requiring payment generation today");
      return { success: true, message: "No payments due for generation", generatedCount: 0 };
    }
    
    console.log(`Found ${leases.length} leases requiring payment generation`);
    
    let generatedCount = 0;
    
    // Process each eligible lease
    for (const lease of leases) {
      try {
        console.log(`Processing payments for lease ${lease.agreement_number}`);
        
        // Determine payment frequency in days
        let daysToAdd = 30; // Default monthly
        
        if (lease.payment_frequency === 'weekly') {
          daysToAdd = 7;
        } else if (lease.payment_frequency === 'biweekly') {
          daysToAdd = 14;
        } else if (lease.payment_frequency === 'monthly') {
          daysToAdd = 30;
        } else if (lease.payment_frequency === 'quarterly') {
          daysToAdd = 90;
        }
        
        // Calculate next payment date
        const nextPaymentDate = new Date(lease.next_payment_date);
        nextPaymentDate.setDate(nextPaymentDate.getDate() + daysToAdd);
        
        // Insert payment record
        const { data: paymentData, error: paymentError } = await supabase
          .from('unified_payments')
          .insert({
            lease_id: lease.id,
            amount: lease.rent_amount,
            due_date: lease.next_payment_date,
            status: 'pending',
            type: 'Income',
            description: `Rental payment - ${lease.agreement_number}`
          })
          .select();
        
        if (paymentError) {
          console.error(`Failed to generate payment for lease ${lease.id}:`, paymentError);
          continue;
        }
        
        // Update lease next payment date
        const { error: updateError } = await supabase
          .from('leases')
          .update({
            next_payment_date: nextPaymentDate.toISOString().split('T')[0]
          })
          .eq('id', lease.id);
          
        if (updateError) {
          console.error(`Failed to update next payment date for lease ${lease.id}:`, updateError);
          continue;
        }
        
        generatedCount++;
        console.log(`Successfully generated payment for lease ${lease.agreement_number}`);
        
      } catch (err) {
        console.error(`Error processing lease ${lease.id}:`, err);
      }
    }
    
    console.log(`Payment generation complete. Generated ${generatedCount} payments`);
    
    return { 
      success: true,
      message: `Generated ${generatedCount} payments`,
      generatedCount
    };
    
  } catch (error) {
    console.error('Error in checkAndGenerateMonthlyPayments:', error);
    return { 
      success: false,
      message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
      generatedCount: 0
    };
  }
};

// Add the missing functions needed in other files
export const manuallyRunPaymentMaintenance = async (leaseId: string) => {
  try {
    console.log('Running manual payment maintenance job for lease:', leaseId);
    // In a real implementation, this would run maintenance just for the specified lease
    // For now, we'll run the general maintenance job
    const result = await checkAndGenerateMonthlyPayments();
    return result;
  } catch (error) {
    console.error('Error running payment maintenance job:', error);
    return {
      success: false, 
      message: `Error in maintenance job: ${error instanceof Error ? error.message : String(error)}`,
      generatedCount: 0
    };
  }
};

export const fixAgreementPayments = async (leaseId: string) => {
  if (!leaseId) {
    console.error('No lease ID provided for fixing payments');
    return { success: false, message: 'No lease ID provided' };
  }

  try {
    console.log(`Fixing payments for agreement ${leaseId}`);
    
    const { data, error } = await supabase
      .from('unified_payments')
      .select('id, due_date, original_due_date')
      .eq('lease_id', leaseId)
      .order('due_date', { ascending: true });
    
    if (error) {
      console.error('Error fetching payments:', error);
      return { success: false, message: `Database error: ${error.message}` };
    }
    
    if (!data || data.length === 0) {
      return { success: true, message: 'No payments to fix' };
    }
    
    // Analyze and fix the payments
    const seen = new Map<string, string[]>();
    const fixedPayments = [];
    
    for (const payment of data) {
      const dueDate = payment.due_date;
      if (!dueDate) continue;
      
      const month = dueDate.substring(0, 7); // YYYY-MM format
      
      if (seen.has(month)) {
        seen.get(month)!.push(payment.id);
      } else {
        seen.set(month, [payment.id]);
      }
    }
    
    // Fix duplicate payments by deduplicating them
    for (const [month, paymentIds] of seen.entries()) {
      if (paymentIds.length > 1) {
        // Keep only the first payment for this month
        const [keepId, ...duplicateIds] = paymentIds;
        
        for (const dupId of duplicateIds) {
          const { error: deleteError } = await supabase
            .from('unified_payments')
            .delete()
            .eq('id', dupId);
          
          if (!deleteError) {
            fixedPayments.push(dupId);
          } else {
            console.error(`Failed to delete duplicate payment ${dupId}:`, deleteError);
          }
        }
      }
    }
    
    return { 
      success: true, 
      message: `Fixed ${fixedPayments.length} duplicate payments` 
    };
    
  } catch (error) {
    console.error('Error fixing agreement payments:', error);
    return { 
      success: false, 
      message: `Error fixing payments: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
};

// Add function for payment schedule maintenance
export const runPaymentScheduleMaintenanceJob = async () => {
  try {
    const result = await checkAndGenerateMonthlyPayments();
    return result;
  } catch (error) {
    console.error('Error in payment schedule maintenance job:', error);
    return { 
      success: false, 
      message: `Error in maintenance job: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
};
