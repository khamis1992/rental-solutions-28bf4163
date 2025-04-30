
import { setupInvoiceTemplatesTable } from "./setupInvoiceTemplates";
import { enhancedSupabase as supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';
import { getSystemServicesStatus } from './service-availability';

// Initialize services check status flag
let servicesChecked = false;

// Check if running in Cypress context
const isCypress = typeof window !== 'undefined' && (window as any).Cypress;

export const initializeApp = async () => {
  // Set up database tables and other requirements
  await setupInvoiceTemplatesTable();
  
  // Only check system services once per session AND skip if in Cypress test
  if (!servicesChecked && !isCypress) {
    // Check system services status
    console.log("Checking system services availability...");
    
    try {
      const servicesStatus = await getSystemServicesStatus();
      
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
      
      // Log overall system status
      console.log("System services status:", servicesStatus);
      
      // Mark services as checked
      servicesChecked = true;
    } catch (err) {
      console.error("Failed to check system services:", err);
      toast.error("System service check failed. Some features may be limited.", {
        duration: 6000,
      });
    }
  } else if (isCypress) {
      console.log("Skipping system service check in Cypress environment.");
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
