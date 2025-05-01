
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const setupInvoiceTemplatesTable = async (): Promise<boolean> => {
  try {
    // Check if the table exists
    const { data: tableExists, error: checkError } = await supabase
      .from('invoice_templates')
      .select('id')
      .limit(1);
    
    // If we can query the table, it exists
    if (!checkError) {
      console.log("Invoice templates table already exists");
      return true;
    }
    
    // Create the table
    const { error: createError } = await supabase.rpc('create_invoice_templates_table');
    
    if (createError) {
      console.error("Error creating invoice templates table:", createError);
      toast.error("Could not set up invoice templates. Please check your database permissions.");
      return false;
    }
    
    console.log("Successfully created invoice templates table");
    return true;
  } catch (error) {
    console.error("Error setting up invoice templates:", error);
    return false;
  }
};
