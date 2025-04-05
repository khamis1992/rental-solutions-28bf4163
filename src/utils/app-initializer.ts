
import { setupInvoiceTemplatesTable } from "./setupInvoiceTemplates";
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { getSystemServicesStatus } from './service-availability';

// Initialize services check status flag
let servicesChecked = false;

export const initializeApp = async () => {
  // Set up database tables and other requirements first (critical path)
  await setupInvoiceTemplatesTable();
  
  // Run service checks in the background (non-critical path)
  if (!servicesChecked) {
    // Use setTimeout to move this work off the main thread 
    setTimeout(async () => {
      try {
        console.log("Checking system services availability in background...");
        const servicesStatus = await getSystemServicesStatus();
        
        // Only show notifications for critical service failures
        if (!servicesStatus.agreementImport) {
          console.warn("Agreement import function unavailable");
          toast.error("Agreement import function unavailable. Some features may not work properly.", {
            duration: 6000,
            id: "agreement-import-error", // Prevent duplicate toasts
          });
        }
        
        if (!servicesStatus.customerImport) {
          console.warn("Customer import function unavailable");
          toast.error("Customer import function unavailable. Some features may not work properly.", {
            duration: 6000,
            id: "customer-import-error", // Prevent duplicate toasts
          });
        }
        
        console.log("System services status:", servicesStatus);
        servicesChecked = true;
      } catch (err) {
        console.error("Failed to check system services:", err);
        toast.error("System service check failed. Some features may be limited.", {
          duration: 6000,
        });
      }
    }, 2000); // Delay services check by 2 seconds to prioritize UI rendering
  }
  
  // Check for any environment configuration issues
  if (!supabase.functions) {
    console.error("Supabase functions client is not properly initialized");
    toast.error("System configuration error: Edge functions not available", {
      duration: 6000,
    });
  }
};

export default initializeApp;
