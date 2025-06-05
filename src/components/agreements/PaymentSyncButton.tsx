
import { Button } from "@/components/ui/button";
import { usePaymentSync } from "@/hooks/payment/use-payment-sync";
import { paymentSyncService } from "@/services/PaymentSyncService";
import { RefreshCw, Settings, Zap, Info } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface PaymentSyncButtonProps {
  agreementId: string;
  variant?: "sync" | "fix";
  className?: string;
}

export function PaymentSyncButton({ 
  agreementId, 
  variant = "sync",
  className = ""
}: PaymentSyncButtonProps) {
  const [isFixing, setIsFixing] = useState(false);
  const [isDebugging, setIsDebugging] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  
  const { 
    fixDuplicatePayments,
    syncPaymentSchedule,
    isPending 
  } = usePaymentSync();

  // Handle deep fix using our dedicated service
  const handleDeepFix = async () => {
    setIsFixing(true);
    try {
      toast.info("Running comprehensive payment synchronization...");
      const result = await paymentSyncService.fixAgreementPaymentSync(agreementId);
      
      if (result.success) {
        const { data } = result;
        if (data) {
          toast.success(`Payment sync completed! Created ${data.scheduleItems} schedule items and ${data.unifiedPaymentsCreated} payment records.`);
        } else {
          toast.success("Payment sync completed successfully!");
        }
      } else {
        const errorMessage = result.error instanceof Error ? result.error.message : 'Unknown error';
        toast.error(`Payment sync encountered issues: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Error fixing payment sync:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Error fixing payment synchronization: ${errorMessage}`);
    } finally {
      setIsFixing(false);
    }
  };

  // Check payment sync status
  const handleCheckStatus = async () => {
    setIsChecking(true);
    try {
      const result = await paymentSyncService.getPaymentSyncStatus(agreementId);
      if (result.success) {
        const { data } = result;
        console.log('Payment sync status:', data);
        toast.info(`Schedule items: ${data.scheduleTables.payment_schedules}, Unified payments: ${data.scheduleTables.unified_payments}`);
      }
    } catch (error) {
      console.error("Error checking sync status:", error);
      toast.error("Failed to check sync status");
    } finally {
      setIsChecking(false);
    }
  };
  
  // Handle sync which just synchronizes with existing data
  const handleSync = async () => {
    try {
      await syncPaymentSchedule.mutateAsync(agreementId);
    } catch (error) {
      console.error("Error syncing payments:", error);
    }
  };
  
  // Debug mode - fix duplicates with error handling
  const handleFixDuplicates = async () => {
    setIsDebugging(true);
    try {
      toast.info("Checking for duplicate payment records...");
      await fixDuplicatePayments.mutateAsync(agreementId);
    } catch (error) {
      console.error("Error fixing duplicates:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('fix_duplicate_payments')) {
        toast.warning("Duplicate payment fix function not available. Please contact support.");
      } else {
        toast.error(`Error fixing duplicates: ${errorMessage}`);
      }
    } finally {
      setIsDebugging(false);
    }
  };
  
  if (variant === "fix") {
    return (
      <div className="flex gap-1">
        <Button
          size="sm"
          variant="outline"
          onClick={handleDeepFix}
          disabled={isFixing}
          className={className}
        >
          <Zap className={`h-4 w-4 mr-1 ${isFixing ? "animate-pulse" : ""}`} />
          {isFixing ? "Fixing..." : "Fix Sync"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCheckStatus}
          disabled={isChecking}
          className={className}
        >
          <Info className={`h-4 w-4 ${isChecking ? "animate-pulse" : ""}`} />
        </Button>
      </div>
    );
  }
  
  return (
    <div className="flex gap-1">
      <Button
        size="sm"
        variant="outline"
        onClick={handleSync}
        disabled={isPending.sync}
        className={className}
      >
        <RefreshCw className={`h-4 w-4 mr-1 ${isPending.sync ? "animate-spin" : ""}`} />
        {isPending.sync ? "Syncing..." : "Sync"}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleFixDuplicates}
        disabled={isDebugging}
        className={className}
      >
        <Settings className={`h-4 w-4 ${isDebugging ? "animate-spin" : ""}`} />
      </Button>
    </div>
  );
}
