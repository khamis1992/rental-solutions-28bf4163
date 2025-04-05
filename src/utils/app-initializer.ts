
import { setupInvoiceTemplatesTable } from "./setupInvoiceTemplates";
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { ensureAllMonthlyPayments } from '@/lib/payment-utils';

// We'll use a global flag to track service checks
let servicesChecked = false;
let initPromise: Promise<void> | null = null;

/**
 * Initialize critical app components (minimal setup for fast initial load)
 */
export const initializeAppCore = async (): Promise<void> => {
  // Set up essential database tables only
  await setupInvoiceTemplatesTable();
};

/**
 * Initialize non-critical app components (can run after initial render)
 * This function can be called after the app is displayed to the user
 */
export const initializeAppBackground = async (): Promise<void> => {
  if (!servicesChecked) {
    console.log("Checking system services availability...");
    
    try {
      // Check system services in background
      const { getSystemServicesStatus } = await import('./service-availability');
      const servicesStatus = await getSystemServicesStatus();
      
      const showServiceError = (service: string) => {
        console.warn(`${service} function unavailable`);
        toast.error(`${service} function unavailable. Some features may not work properly.`, {
          duration: 6000,
          id: `${service.toLowerCase()}-import-error`, // Prevent duplicate toasts
        });
      };
      
      if (!servicesStatus.agreementImport) {
        showServiceError("Agreement import");
      }
      
      if (!servicesStatus.customerImport) {
        showServiceError("Customer import");
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
  }
  
  // Check for any environment configuration issues
  if (!supabase.functions) {
    console.error("Supabase functions client is not properly initialized");
    toast.error("System configuration error: Edge functions not available", {
      duration: 6000,
    });
  }
};

/**
 * Main initialization function that manages the initialization process
 * Returns a promise that resolves when core initialization is complete
 */
export const initializeApp = async (): Promise<void> => {
  if (!initPromise) {
    initPromise = (async () => {
      // Initialize core features first (blocking)
      await initializeAppCore();
      
      // Initialize background features after a short delay
      setTimeout(() => {
        initializeAppBackground().catch(err => {
          console.error("Background initialization error:", err);
        });
      }, 2000);
    })();
  }
  
  return initPromise;
};

export default initializeApp;
