
import { supabase } from '@/lib/supabase';
import { generatePaymentSchedule } from './payment-schedule';

/**
 * Helper function to check and create payment schedules for active agreements
 */
export const checkAndCreateMissingPaymentSchedules = async (): Promise<{ 
  success: boolean; 
  generatedCount: number;
  message?: string;
  error?: any 
}> => {
  try {
    console.log('Checking for missing payment schedules');
    
    // Find active agreements without payment records
    const { data: activeAgreements, error: agreementsError } = await supabase
      .from('leases')
      .select('id, rent_amount, start_date, rent_due_day')
      .eq('status', 'active')
      .is('payment_status', null);
    
    if (agreementsError) {
      console.error('Error fetching active agreements:', agreementsError);
      return { 
        success: false, 
        generatedCount: 0,
        message: 'Error fetching agreements', 
        error: agreementsError 
      };
    }
    
    if (!activeAgreements || activeAgreements.length === 0) {
      console.log('No agreements require payment schedule generation');
      return { success: true, generatedCount: 0, message: 'No payments needed to be generated' };
    }
    
    console.log(`Found ${activeAgreements.length} agreements that might need payment schedules`);
    
    let generatedCount = 0;
    let failedCount = 0;
    
    // Process each agreement with a small delay between them to avoid overwhelming the database
    for (const agreement of activeAgreements) {
      try {
        // Generate payment schedule
        const result = await generatePaymentSchedule(agreement);
        if (result.success) {
          generatedCount++;
        } else {
          failedCount++;
          console.error(`Failed to generate payment schedule for agreement ${agreement.id}: ${result.message}`);
        }
        
        // Add a small delay between operations
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (err) {
        failedCount++;
        console.error(`Error processing agreement ${agreement.id}:`, err);
      }
    }
    
    return { 
      success: true, 
      generatedCount,
      message: `Generated ${generatedCount} payment schedules${failedCount > 0 ? `, ${failedCount} failed` : ''}` 
    };
  } catch (err) {
    console.error('Unexpected error in checkAndCreateMissingPaymentSchedules:', err);
    return { 
      success: false, 
      generatedCount: 0,
      message: `Failed to generate payments: ${err instanceof Error ? err.message : String(err)}`,
      error: err 
    };
  }
};
