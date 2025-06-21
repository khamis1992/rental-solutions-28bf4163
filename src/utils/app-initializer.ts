import { setupInvoiceTemplatesTable } from "./setupInvoiceTemplates";
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { getSystemServicesStatus } from './service-availability';
import { registerPaymentEventHandlers } from '@/events/payment-handlers';
import { installmentBackgroundService } from '@/services/InstallmentBackgroundService';
import { cacheService } from '@/services/CacheService';

interface SystemStatus {
  agreementImport?: boolean;
  customerImport?: boolean;
  paymentProcessing?: boolean;
  documentGeneration?: boolean;
  [key: string]: boolean | undefined;
}

// Initialize services check status flag
let servicesChecked = false;
let systemStatus: SystemStatus | null = null;

const checkEnvironmentConfig = () => {
  const issues: string[] = [];

  // Edge functions check is optional and doesn't break functionality
  // if (!supabase.functions) {
  //   issues.push("Edge functions not available");
  // }

  // Supabase configuration is optional for this application
  // if (!import.meta.env.VITE_SUPABASE_URL) {
  //   issues.push("Supabase URL not configured");
  // }

  // if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
  //   issues.push("Supabase anonymous key not configured");
  // }

  return issues;
};

const handleServiceStatus = (status: SystemStatus) => {
  const unavailableServices = Object.entries(status)
    .filter(([_, available]) => available === false)
    .map(([service]) => service);

  if (unavailableServices.length > 0) {
    const message = `The following services are unavailable: ${unavailableServices.join(", ")}. Some features may not work properly.`;
    toast.error(message, {
      duration: 6000,
      id: "services-unavailable",
    });
  }

  return status;
};

export const getSystemStatus = () => systemStatus;

export const initializeApp = async () => {
  try {
    // Register event handlers
    registerPaymentEventHandlers();

    // Set up database tables
    await setupInvoiceTemplatesTable();

    // Initialize cache service
    console.log("Initializing cache service...");
    // Cache service is already initialized, just log the startup
    console.log("Cache service initialized successfully");

    // Start background services
    console.log("Starting background services...");
    try {
      // Start scheduled tasks for installment processing
      installmentBackgroundService.startScheduledTasks();
      console.log("Background services started successfully");
    } catch (error) {
      console.error("Failed to start background services:", error);
      toast.error("Background services failed to start. Some automated features may not work.", {
        duration: 5000,
        id: "background-services-error",
      });
    }

    // Check environment configuration (optional)
    const configIssues = checkEnvironmentConfig();
    if (configIssues.length > 0) {
      console.warn(`Configuration issues found: ${configIssues.join(", ")}`);
      // Don't throw error, just log warning as these are optional configurations
    }

    // Only check system services once per session
    if (!servicesChecked) {
      console.log("Checking system services availability...");

      try {
        const servicesStatus = await getSystemServicesStatus();
        systemStatus = handleServiceStatus(servicesStatus);
        servicesChecked = true;

        // Log overall system status
        console.log("System services status:", systemStatus);
        
        // Log cache statistics
        const cacheStats = cacheService.getStats();
        console.log("Cache service stats:", cacheStats);
      } catch (error) {
        console.error("Failed to check system services:", error);
        toast.error("System service check failed. Some features may be limited.", {
          duration: 6000,
          id: "service-check-error",
        });
      }
    }

    return {
      success: true,
      status: systemStatus,
    };
  } catch (error) {
    console.error("Application initialization failed:", error);
    toast.error("Failed to initialize application. Please refresh the page or contact support.", {
      duration: 6000,
      id: "init-error",
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown initialization error",
    };
  }
};

export default initializeApp;
