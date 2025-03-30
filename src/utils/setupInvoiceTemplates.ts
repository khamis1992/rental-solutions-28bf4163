
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
      // If the RPC function doesn't exist, we'll try to create the table directly
      if (createError.message.includes('does not exist')) {
        console.log("Creating invoice_templates table directly");
        
        // Try direct SQL (only works with function permission or connection from server)
        const { error: directError } = await supabase.query(`
          CREATE TABLE IF NOT EXISTS public.invoice_templates (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            description TEXT,
            content TEXT NOT NULL,
            category TEXT NOT NULL,
            is_default BOOLEAN DEFAULT false,
            variables JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
          
          -- Ensure RLS is enabled
          ALTER TABLE public.invoice_templates ENABLE ROW LEVEL SECURITY;
          
          -- Create policy for authenticated users
          CREATE POLICY "Allow full access to authenticated users" 
            ON public.invoice_templates 
            USING (auth.role() = 'authenticated')
            WITH CHECK (auth.role() = 'authenticated');
        `);
        
        if (directError) {
          console.error("Failed to create invoice_templates table:", directError);
          toast.error("Could not set up invoice templates. Please check your database permissions.");
          return false;
        }
      } else {
        console.error("Error creating invoice templates table:", createError);
        toast.error("Could not set up invoice templates. Please check your database permissions.");
        return false;
      }
    }
    
    console.log("Successfully created invoice templates table");
    return true;
  } catch (error) {
    console.error("Error setting up invoice templates:", error);
    return false;
  }
};
