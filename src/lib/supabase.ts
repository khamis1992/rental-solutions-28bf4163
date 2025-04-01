
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const checkAndGenerateMonthlyPayments = async (): Promise<{ success: boolean; message?: string; error?: any }> => {
  try {
    console.log('Checking for monthly payments to generate');
    
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    // Find active agreements that might need payments generated
    const { data: activeAgreements, error: agreementsError } = await supabase
      .from('leases')
      .select('id, rent_amount, start_date, rent_due_day')
      .in('status', ['active', 'pending_payment'])
      .lte('start_date', lastDayOfMonth.toISOString())
      .is('payment_status', null);
    
    if (agreementsError) {
      console.error('Error fetching active agreements:', agreementsError);
      return { success: false, message: 'Error fetching agreements', error: agreementsError };
    }
    
    if (!activeAgreements || activeAgreements.length === 0) {
      console.log('No agreements require payment generation');
      return { success: true, message: 'No payments needed to be generated' };
    }
    
    console.log(`Found ${activeAgreements.length} agreements that might need payments generated`);
    
    let generatedCount = 0;
    
    // For each agreement, check if we need to generate a payment for current month
    for (const agreement of activeAgreements) {
      // Check if payment already exists for this month
      const { data: existingPayments, error: paymentsError } = await supabase
        .from('unified_payments')
        .select('id')
        .eq('lease_id', agreement.id)
        .gte('payment_date', firstDayOfMonth.toISOString())
        .lt('payment_date', lastDayOfMonth.toISOString());
        
      if (paymentsError) {
        console.error(`Error checking existing payments for agreement ${agreement.id}:`, paymentsError);
        continue;
      }
      
      if (existingPayments && existingPayments.length > 0) {
        console.log(`Payment already exists for agreement ${agreement.id} this month`);
        continue;
      }
      
      // No payment exists for this month, generate one
      const dueDay = agreement.rent_due_day || 1;
      const dueDate = new Date(today.getFullYear(), today.getMonth(), dueDay);
      
      // If due date is in the past for this month, set status to overdue
      const paymentStatus = dueDate < today ? 'overdue' : 'pending';
      const daysOverdue = dueDate < today ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      
      const { data: newPayment, error: createError } = await supabase
        .from('unified_payments')
        .insert({
          lease_id: agreement.id,
          amount: agreement.rent_amount,
          description: `Monthly Rent - ${today.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
          type: 'Income',
          status: paymentStatus,
          payment_date: null,
          due_date: dueDate.toISOString(),
          days_overdue: daysOverdue
        })
        .select()
        .single();
        
      if (createError) {
        console.error(`Error creating payment for agreement ${agreement.id}:`, createError);
        continue;
      }
      
      generatedCount++;
      console.log(`Generated payment for agreement ${agreement.id}`);
    }
    
    return { 
      success: true, 
      message: `Successfully generated ${generatedCount} monthly payments` 
    };
  } catch (err) {
    console.error('Unexpected error in checkAndGenerateMonthlyPayments:', err);
    return { 
      success: false, 
      message: `Failed to generate payments: ${err.message}`,
      error: err 
    };
  }
};

export const fixImportedAgreementDates = async (importId: string): Promise<{ success: boolean; message?: string; error?: any }> => {
  try {
    console.log(`Fixing dates for import: ${importId}`);
    
    // Update the import record status to "fixing"
    await supabase
      .from('agreement_imports')
      .update({ 
        status: 'fixing',
        updated_at: new Date().toISOString() 
      })
      .eq('id', importId);
    
    // Call the RPC function to fix the dates
    const { data, error } = await supabase.rpc('fix_agreement_import_dates', {
      p_import_id: importId
    });
    
    if (error) {
      console.error('Error fixing agreement dates:', error);
      
      // Update import status back to its original state
      await supabase
        .from('agreement_imports')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString() 
        })
        .eq('id', importId);
        
      return { 
        success: false, 
        message: `Failed to fix date formats: ${error.message}`,
        error 
      };
    }
    
    // Update the import status back to "completed"
    await supabase
      .from('agreement_imports')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString() 
      })
      .eq('id', importId);
    
    return { 
      success: true, 
      message: `Successfully fixed date formats for ${data?.fixed_count || 0} agreements` 
    };
  } catch (err) {
    console.error('Unexpected error in fixImportedAgreementDates:', err);
    
    // Update import status back to its original state
    await supabase
      .from('agreement_imports')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString() 
      })
      .eq('id', importId);
      
    return { 
      success: false, 
      message: `Unexpected error: ${err.message}`,
      error: err 
    };
  }
};

export const revertAgreementImport = async (
  importId: string, 
  reason: string = 'User-initiated revert'
): Promise<{ success: boolean; message?: string; error?: any }> => {
  try {
    console.log(`Reverting import: ${importId}, reason: ${reason}`);
    
    // Update the import record status to "reverting"
    await supabase
      .from('agreement_imports')
      .update({ 
        status: 'reverting',
        updated_at: new Date().toISOString() 
      })
      .eq('id', importId);
    
    // Call the RPC function to revert the import
    const { data, error } = await supabase.rpc('revert_agreement_import', {
      p_import_id: importId,
      p_reason: reason
    });
    
    if (error) {
      console.error('Error reverting import:', error);
      
      // Update import status back to its original state
      await supabase
        .from('agreement_imports')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString() 
        })
        .eq('id', importId);
        
      return { 
        success: false, 
        message: `Failed to revert import: ${error.message}`,
        error 
      };
    }
    
    // Update the import status to "reverted"
    await supabase
      .from('agreement_imports')
      .update({ 
        status: 'reverted',
        updated_at: new Date().toISOString() 
      })
      .eq('id', importId);
    
    return { 
      success: true, 
      message: `Successfully reverted import. ${data?.deleted_count || 0} agreements removed.` 
    };
  } catch (err) {
    console.error('Unexpected error in revertAgreementImport:', err);
    
    // Update import status back to its original state
    await supabase
      .from('agreement_imports')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString() 
      })
      .eq('id', importId);
      
    return { 
      success: false, 
      message: `Unexpected error: ${err.message}`,
      error: err 
    };
  }
};
