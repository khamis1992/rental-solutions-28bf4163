import { setupInvoiceTemplatesTable } from "./setupInvoiceTemplates";
import { supabase, testAuthConnection } from '@/lib/supabase';
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

  // Supabase configuration is optional for this application
  // if (!import.meta.env.VITE_SUPABASE_URL) {
  //   issues.push("Supabase URL not configured");
  // }

  // if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
  //   issues.push("Supabase anonymous key not configured");
  // }

  return issues;
};



export const getSystemStatus = () => systemStatus;

export const initializeApp = async () => {
  try {
    // Initialize PDF fonts first
    console.log("Initializing PDF fonts...");
    try {
      await configurePdfMakeFonts();
      console.log("PDF fonts initialized successfully");
    } catch (error) {
      console.warn("PDF font initialization failed:", error);
      // Don't fail the entire app initialization for font issues
    }

    // Register event handlers
    registerPaymentEventHandlers();

    // Set up database tables
    console.log("Setting up database tables...");
    try {
      const invoiceTablesSetup = await setupInvoiceTemplatesTable();
      if (invoiceTablesSetup) {
        console.log("Invoice templates table setup completed successfully");
      } else {
        console.warn("Invoice templates table setup failed - continuing without this feature");
      }
    } catch (error) {
      console.warn("Failed to set up invoice templates table:", error);
      // Continue app initialization even if this fails
    }

    // Test authentication service
    console.log("Testing authentication service...");
    try {
      const authTest = await testAuthConnection();
      if (authTest.isHealthy) {
        console.log("✅ Authentication service is working correctly");
      } else {
        console.warn("⚠️ Authentication service test failed:", authTest.error);
        toast.warning("Authentication service may be limited", {
          description: "Login functionality may not work properly. Please check your connection.",
          duration: 6000,
          id: "auth-warning",
        });
      }
    } catch (error) {
      console.error("❌ Authentication service test failed:", error);
      toast.error("Authentication service unavailable", {
        description: "Login functionality may not work. Please refresh the page or contact support.",
        duration: 8000,
        id: "auth-error",
      });
    }

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
      console.log("🔍 Checking system services availability...");

      try {
        const servicesStatus = await getSystemServicesStatus();
        systemStatus = servicesStatus;
        servicesChecked = true;

        // Log overall system status
        console.log("📊 System services status:", systemStatus);
        
        const availableServices = Object.values(servicesStatus).filter(Boolean).length;
        const totalServices = Object.keys(servicesStatus).length;
        
        if (availableServices === 0) {
          console.log("ℹ️ Core features available - advanced import functions require additional configuration");
        } else if (availableServices < totalServices) {
          console.log(`ℹ️ ${availableServices}/${totalServices} advanced services available`);
        } else {
          console.log("✅ All services operational");
        }
        
        // Log cache statistics
        const cacheStats = cacheService.getStats();
        console.log("📈 Cache service stats:", cacheStats);
      } catch (error) {
        console.log("ℹ️ System service check completed with limited functionality:", error instanceof Error ? error.message : String(error));
        // Don't show error toasts for expected service limitations
        systemStatus = { agreementImport: false, customerImport: false };
        servicesChecked = true;
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
