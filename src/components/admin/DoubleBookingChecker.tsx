
import React, { useState } from 'react';
import { Ban, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auditAndFixDoubleBookedVehicles } from '@/utils/agreement-conflicts';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface DoubleBookingCheckerProps {
  onChecked?: () => void;
}

export const DoubleBookingChecker: React.FC<DoubleBookingCheckerProps> = ({ onChecked }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    vehiclesFixed?: number;
    agreementsCancelled?: number;
  } | null>(null);

  const handleCheck = async () => {
    setIsChecking(true);
    try {
      const checkResult = await auditAndFixDoubleBookedVehicles();
      setResult(checkResult);
      if (onChecked) {
        onChecked();
      }
    } catch (error) {
      console.error("Error checking double bookings:", error);
      setResult({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vehicle Double-Booking Checker</CardTitle>
        <CardDescription>
          Check for vehicles assigned to multiple active agreements and resolve conflicts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm">
          Running this utility will detect any vehicles that are currently assigned to multiple active 
          agreements. For each double-booked vehicle, older agreements will be marked as "Cancelled" 
          and only the newest agreement will remain active.
        </p>
        
        {result && (
          <Alert 
            variant={result.success ? "default" : "destructive"}
            className="my-4"
          >
            {result.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <Ban className="h-4 w-4" />
            )}
            <AlertTitle>
              {result.success ? "Check Complete" : "Error"}
            </AlertTitle>
            <AlertDescription>
              {result.message}
              
              {result.success && result.vehiclesFixed !== undefined && (
                <div className="mt-2 text-sm">
                  <p>Vehicles fixed: {result.vehiclesFixed}</p>
                  <p>Agreements cancelled: {result.agreementsCancelled}</p>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleCheck}
          disabled={isChecking}
        >
          {isChecking ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <Ban className="h-4 w-4 mr-2" />
              Check & Fix Double Bookings
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
