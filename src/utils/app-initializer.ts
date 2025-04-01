
import { setupInvoiceTemplatesTable } from "./setupInvoiceTemplates";
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export const initializeApp = async () => {
  // Set up database tables and other requirements
  await setupInvoiceTemplatesTable();
  
  // Enable the process-agreement-imports function
  console.log("Checking import processing functions...");
  try {
    const agreementCheck = await supabase.functions.invoke('process-agreement-imports', {
      body: { test: true },
    });
    
    const customerCheck = await supabase.functions.invoke('process-customer-imports', {
      body: { test: true },
    });
    
    if (agreementCheck.error) {
      console.warn("Error testing agreement import function:", agreementCheck.error);
      toast.error("Agreement import function unavailable. Some features may not work properly.");
    } else {
      console.log("Agreement import function is available:", agreementCheck.data);
    }
    
    if (customerCheck.error) {
      console.warn("Error testing customer import function:", customerCheck.error);
      toast.error("Customer import function unavailable. Some features may not work properly.");
    } else {
      console.log("Customer import function is available:", customerCheck.data);
    }
  } catch (err) {
    console.warn("Failed to test import functions:", err);
  }
  
  // Add other initialization as needed
};

export default initializeApp;
