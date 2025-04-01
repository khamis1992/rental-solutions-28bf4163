
import { setupInvoiceTemplatesTable } from "./setupInvoiceTemplates";
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export const initializeApp = async () => {
  // Set up database tables and other requirements
  await setupInvoiceTemplatesTable();
  
  // Check and enable import processing functions
  console.log("Checking import processing functions...");
  
  try {
    // Test agreement import function
    const agreementCheck = await supabase.functions.invoke('process-agreement-imports', {
      body: { test: true },
    });
    
    if (agreementCheck.error) {
      console.warn("Error testing agreement import function:", agreementCheck.error);
      toast.error("Agreement import function unavailable. Some features may not work properly.", {
        duration: 6000,
        id: "agreement-import-error", // Prevent duplicate toasts
      });
    } else {
      console.log("Agreement import function is available:", agreementCheck.data);
    }
    
    // Test customer import function with retry mechanism
    let customerCheck;
    let retryCount = 0;
    const maxRetries = 2;
    
    while (retryCount <= maxRetries) {
      try {
        customerCheck = await supabase.functions.invoke('process-customer-imports', {
          body: { test: true },
        });
        
        if (!customerCheck.error) {
          console.log("Customer import function is available:", customerCheck.data);
          break; // Success, exit retry loop
        }
        
        console.warn(`Customer import function check failed (attempt ${retryCount + 1}/${maxRetries + 1}):`, customerCheck.error);
        retryCount++;
        
        if (retryCount <= maxRetries) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      } catch (err) {
        console.error(`Error during customer import function check (attempt ${retryCount + 1}/${maxRetries + 1}):`, err);
        retryCount++;
        
        if (retryCount <= maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
    }
    
    // If all retries failed, show error message
    if (retryCount > maxRetries) {
      toast.error("Customer import function unavailable. Some features may not work properly.", {
        duration: 6000,
        id: "customer-import-error", // Prevent duplicate toasts
        description: "Please check your network connection or contact support if the issue persists."
      });
    }
  } catch (err) {
    console.error("Failed to test import functions:", err);
    toast.error("Failed to initialize import functions. Some system features may be limited.", {
      duration: 6000,
    });
  }
  
  // Check for any environment configuration issues
  if (!supabase.functions) {
    console.error("Supabase functions client is not properly initialized");
    toast.error("System configuration error: Edge functions not available", {
      duration: 6000,
    });
  }
  
  // Add other initialization as needed
};

export default initializeApp;
