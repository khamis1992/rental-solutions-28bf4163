
import { setupInvoiceTemplatesTable } from "./setupInvoiceTemplates";
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { getSystemServicesStatus } from './service-availability';
import { logOperation } from '@/utils/monitoring-utils';

// Initialize services check status flag
let servicesChecked = false;

export const initializeApp = async () => {
  // Set up database tables and other requirements
  await setupInvoiceTemplatesTable();
  
  // Only check system services once per session
  if (!servicesChecked) {
    // Check system services status
    logOperation(
      'appInitializer.initializeApp', 
      'success', 
      {},
      'Checking system services availability'
    );
    
    try {
      const servicesStatus = await getSystemServicesStatus();
      
      if (!servicesStatus.agreementImport) {
        logOperation(
          'appInitializer.initializeApp', 
          'warning', 
          { service: 'agreementImport' },
          'Agreement import function unavailable'
        );
        toast.error("Agreement import function unavailable. Some features may not work properly.", {
          duration: 6000,
          id: "agreement-import-error", // Prevent duplicate toasts
        });
      }
      
      if (!servicesStatus.customerImport) {
        logOperation(
          'appInitializer.initializeApp', 
          'warning', 
          { service: 'customerImport' },
          'Customer import function unavailable'
        );
        toast.error("Customer import function unavailable. Some features may not work properly.", {
          duration: 6000,
          id: "customer-import-error", // Prevent duplicate toasts
        });
      }
      
      // Log overall system status
      logOperation(
        'appInitializer.initializeApp', 
        'success', 
        { servicesStatus },
        'System services status'
      );
      
      // Mark services as checked
      servicesChecked = true;
    } catch (err) {
      logOperation(
        'appInitializer.initializeApp', 
        'error', 
        { error: err instanceof Error ? err.message : String(err) },
        'Failed to check system services'
      );
      toast.error("System service check failed. Some features may be limited.", {
        duration: 6000,
      });
    }
  }
  
  // Check for any environment configuration issues
  if (!supabase.functions) {
    logOperation(
      'appInitializer.initializeApp', 
      'error', 
      {},
      'Supabase functions client is not properly initialized'
    );
    toast.error("System configuration error: Edge functions not available", {
      duration: 6000,
    });
  }
};

export default initializeApp;
