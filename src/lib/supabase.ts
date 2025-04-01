import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
