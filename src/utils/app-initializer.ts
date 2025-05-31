import { setupInvoiceTemplatesTable } from "./setupInvoiceTemplates";
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { getSystemServicesStatus } from './service-availability';
import { registerPaymentEventHandlers } from '@/events/payment-handlers';

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

const REQUIRED_ENV_VARS = {
  VITE_SUPABASE_URL: 'Supabase URL',
  VITE_SUPABASE_ANON_KEY: 'Supabase anonymous key',
  VITE_API_URL: 'API URL',
  VITE_APP_ENV: 'Application environment',
} as const;

const checkEnvironmentConfig = () => {
  const issues: string[] = [];

  // Check required environment variables
  Object.entries(REQUIRED_ENV_VARS).forEach(([key, description]) => {
    if (!import.meta.env[key]) {
      issues.push(`${description} (${key}) not configured`);
    }
  });

  // Validate Supabase configuration
  if (!supabase.functions) {
    issues.push("Edge functions not available");
  }

  // Validate API URL format
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl && !apiUrl.startsWith('http')) {
    issues.push("API URL must start with http:// or https://");
  }

  // Validate environment value
  const appEnv = import.meta.env.VITE_APP_ENV;
  if (appEnv && !['development', 'staging', 'production'].includes(appEnv)) {
    issues.push("Invalid application environment value");
  }

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

    // Check environment configuration
    const configIssues = checkEnvironmentConfig();
    if (configIssues.length > 0) {
      const message = `Configuration issues found: ${configIssues.join(", ")}`;
      console.error(message);
      
      // In development, show detailed error
      if (import.meta.env.DEV) {
        throw new Error(message);
      }
      
      // In production, show user-friendly message
      toast.error("Application configuration is incomplete. Please contact support.", {
        duration: 6000,
        id: "config-error",
      });
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
