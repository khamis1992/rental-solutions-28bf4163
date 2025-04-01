
import { setupInvoiceTemplatesTable } from "./setupInvoiceTemplates";
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { getSystemServicesStatus } from './service-availability';

export const initializeApp = async () => {
  // Set up database tables and other requirements
  await setupInvoiceTemplatesTable();
  
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
  } catch (err) {
    console.error("Failed to check system services:", err);
    toast.error("System service check failed. Some features may be limited.", {
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
};

export default initializeApp;
