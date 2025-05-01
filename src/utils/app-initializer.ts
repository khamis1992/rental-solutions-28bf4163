
import { setupInvoiceTemplatesTable } from "./setupInvoiceTemplates";
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { getSystemServicesStatus } from './service-availability';
import errorService from '@/services/error/ErrorService';
import { configureErrorLogger } from '@/utils/error-logger';

// Initialize services check status flag
let servicesChecked = false;

export default async function initializeApp() {
  try {
    // Set up database tables and other requirements
    await setupInvoiceTemplatesTable();
    
    // Only check system services once per session
    if (!servicesChecked) {
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
    }
    
    // Check for any environment configuration issues
    if (!supabase.functions) {
      console.error("Supabase functions client is not properly initialized");
      toast.error("System configuration error: Edge functions not available", {
        duration: 6000,
      });
    }
    
    // Configure error logging
    configureErrorLogger({
      enableConsoleLogging: process.env.NODE_ENV !== 'production',
      logLevel: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
      includeTimestamp: true,
      includeStack: true
    });

    // Add global error handler for uncaught exceptions
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled Promise Rejection:', event.reason);
        errorService.handleError(event.reason, {
          context: 'Unhandled Promise',
          severity: 'error',
          category: 'unknown',
          code: 'UNHANDLED_PROMISE'
        });
        // Prevent default handling
        event.preventDefault();
      });
      
      window.addEventListener('error', (event) => {
        console.error('Uncaught Error:', event.error);
        errorService.handleError(event.error || event.message, {
          context: 'Uncaught Error',
          severity: 'error',
          category: 'unknown',
          code: 'UNCAUGHT_ERROR'
        });
        // Prevent default handling
        event.preventDefault();
        return true;
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error initializing app:", error);
    return false;
  }
}
