
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { logOperation } from "@/utils/monitoring-utils";

export const setupInvoiceTemplatesTable = async (): Promise<boolean> => {
  try {
    // Check if the table exists
    const { data: tableExists, error: checkError } = await supabase
      .from('invoice_templates')
      .select('id')
      .limit(1);
    
    // If we can query the table, it exists
    if (!checkError) {
      logOperation('invoiceTemplates.setup', 'success', 
        {}, 'Invoice templates table already exists');
      return true;
    }
    
    // Create the table
    const { error: createError } = await supabase.rpc('create_invoice_templates_table');
    
    if (createError) {
      logOperation('invoiceTemplates.setup', 'error', 
        { error: createError.message }, 'Error creating invoice templates table');
      toast.error("Could not set up invoice templates. Please check your database permissions.");
      return false;
    }
    
    logOperation('invoiceTemplates.setup', 'success', 
      {}, 'Successfully created invoice templates table');
    return true;
  } catch (error) {
    logOperation('invoiceTemplates.setup', 'error', 
      { error: error instanceof Error ? error.message : String(error) }, 
      'Error setting up invoice templates');
    return false;
  }
};
