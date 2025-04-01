
import { setupInvoiceTemplatesTable } from "./setupInvoiceTemplates";
import { supabase } from '@/lib/supabase';

export const initializeApp = async () => {
  // Set up database tables and other requirements
  await setupInvoiceTemplatesTable();
  
  // Enable the process-agreement-imports function
  console.log("Enabling agreement import processing function...");
  try {
    const { error } = await supabase.functions.invoke('process-agreement-imports', {
      body: { test: true },
    });
    
    if (error) {
      console.warn("Error testing agreement import function:", error);
    } else {
      console.log("Agreement import function is available");
    }
  } catch (err) {
    console.warn("Failed to test agreement import function:", err);
  }
  
  // Add other initialization as needed
};

export default initializeApp;
