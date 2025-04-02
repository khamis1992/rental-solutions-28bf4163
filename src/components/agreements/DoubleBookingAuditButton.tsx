
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Shield, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { auditAndFixDoubleBookedVehicles } from '@/utils/agreement-conflicts';

interface DoubleBookingAuditButtonProps {
  onCheckComplete?: () => void;
  className?: string;
}

export function DoubleBookingAuditButton({ onCheckComplete, className }: DoubleBookingAuditButtonProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    vehiclesFixed?: number;
    agreementsCancelled?: number;
  } | null>(null);

  const handleAuditAndFix = async () => {
    setIsChecking(true);
    try {
      const checkResult = await auditAndFixDoubleBookedVehicles();
      setResult(checkResult);
      
      if (checkResult.success) {
        if (checkResult.vehiclesFixed && checkResult.vehiclesFixed > 0) {
          toast.success(checkResult.message || `Fixed ${checkResult.vehiclesFixed} double-booked vehicles`);
        } else {
          toast.info("No double-booked vehicles found");
        }
      } else {
        toast.error(checkResult.message || "Failed to check for double bookings");
      }
      
      if (onCheckComplete) {
        onCheckComplete();
      }
    } catch (error) {
      console.error("Error in double booking audit:", error);
      toast.error("Failed to run double-booking check");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleAuditAndFix}
      disabled={isChecking}
      className={className}
    >
      {isChecking ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Running check...
        </>
      ) : (
        <>
          <Shield className="mr-2 h-4 w-4" />
          Fix Double-Bookings
        </>
      )}
    </Button>
  );
}
