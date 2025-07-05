import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const setupInvoiceTemplatesTable = async (): Promise<boolean> => {
  try {
    // Check if the table exists by trying to query it
    const { data: tableExists, error: checkError } = await supabase
      .from('invoice_templates')
      .select('id')
      .limit(1);
    
    // If we can query the table successfully, it exists
    if (!checkError) {
      console.log("Invoice templates table already exists");
      return true;
    }
    
    // If the error is about the table not existing, try to create it
    // But only if we have permission to call RPC functions
    if (checkError && checkError.message?.includes('does not exist')) {
      console.log("Invoice templates table doesn't exist, attempting to create...");
      
      try {
        const { error: createError } = await supabase.rpc('create_invoice_templates_table');
        
        if (createError) {
          // If RPC function doesn't exist or we don't have permission, log but don't fail
          if (createError.message?.includes('function') || 
              createError.message?.includes('permission') ||
              createError.message?.includes('API key')) {
            console.log("ℹ️ Invoice templates feature unavailable - requires additional database permissions");
            return false; // Return false but don't throw
          }
          
          console.error("Error creating invoice templates table:", createError);
          return false;
        }
        
        console.log("Successfully created invoice templates table");
        return true;
      } catch (rpcError) {
        console.log("ℹ️ Invoice templates feature unavailable - RPC functions not accessible");
        return false; // Don't fail the app, just log the info
      }
    }
    
    // For permission/API key errors, show info message instead of warning
    if (checkError?.message?.includes('API key') || 
        checkError?.message?.includes('permission') ||
        checkError?.message?.includes('access')) {
      console.log("ℹ️ Invoice templates feature unavailable - insufficient database permissions");
      return false;
    }
    
    // For other unexpected errors, log them as warnings
    console.warn("Could not verify invoice templates table:", checkError?.message);
    return false;
    
  } catch (error) {
    console.log("ℹ️ Invoice templates setup skipped - feature not available in current environment");
    // Don't throw the error, just return false to indicate it failed
    return false;
  }
};

