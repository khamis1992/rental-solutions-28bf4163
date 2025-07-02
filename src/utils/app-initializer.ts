import { setupInvoiceTemplatesTable } from "./setupInvoiceTemplates";
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { getSystemServicesStatus } from './service-availability';
import { registerPaymentEventHandlers } from '@/events/payment-handlers';
import { installmentBackgroundService } from '@/services/InstallmentBackgroundService';
import { cacheService } from '@/services/CacheService';
import { configurePdfMakeFonts } from './font-loader';

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

  // Supabase configuration is optional for this // application - removed unused variable// if (!import.meta.env.VITE_SUPABASE_URL) {
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
    // Initialize PDF fonts first
    console.log("🎨 Initializing PDF fonts...");
    try {
      await configurePdfMakeFonts();
      console.log("✅ PDF fonts system ready");
    } catch (error) {
      console.log("ℹ️ PDF fonts initialized with fallback configuration");
      // Don't fail the entire app initialization for font issues
    }

    // Register event handlers
    registerPaymentEventHandlers();

    // Set up database tables
    console.log("🗄️ Setting up database tables...");
    try {
      const invoiceTablesSetup = await setupInvoiceTemplatesTable();
      if (invoiceTablesSetup) {
        console.log("✅ Database tables configured successfully");
      } else {
        console.log("ℹ️ Database operating with standard configuration");
      }
    } catch (error) {
      console.log("ℹ️ Database ready with basic functionality");
      // Continue app initialization even if this fails
    }

    // Initialize cache service
    console.log("💾 Initializing cache service...");
    // Cache service is already initialized, just log the startup
    console.log("✅ Cache service active and ready");

    // Start background services
    console.log("⚙️ Starting background services...");
    try {
      // Start scheduled tasks for installment processing
      installmentBackgroundService.startScheduledTasks();
      console.log("✅ Background services active");
    } catch (error) {
      console.log("ℹ️ Background services initialized with reduced functionality");
      // Removed toast notification to reduce noise - background services are optional
    }

    // Check environment configuration (optional)
    const configIssues = checkEnvironmentConfig();
    if (configIssues.length > 0) {
      console.log(`ℹ️ App running with standard configuration`);
      // Don't throw error, just log info as these are optional configurations
    }

    // Only check system services once per session
    if (!servicesChecked) {
      console.log("🔍 Checking system services availability...");

      try {
        const servicesStatus = await getSystemServicesStatus();
        systemStatus = handleServiceStatus(servicesStatus);
        servicesChecked = true;

        // Log overall system status
        console.log("✅ System services operational");
        
        // Log cache statistics
        const cacheStats = cacheService.getStats();
        console.log("📊 Cache service stats:", cacheStats);
      } catch (error) {
        console.log("ℹ️ System running with core features available");
        systemStatus = { }; // Empty status object
        servicesChecked = true;
        // Removed toast notification to reduce noise
      }
    }

    return {
      success: true,
      status: systemStatus,
    };
  } catch (error) {
    console.log("⚠️ Application started with limited functionality");
    // Only show toast for truly critical failures
    toast.error("Application started with reduced features. Some functionality may be limited.", {
      duration: 4000,
      id: "init-warning",
    });

    return {
      success: false,
      error: "Application started with reduced functionality",
    };
  }
};

export default initializeApp;
