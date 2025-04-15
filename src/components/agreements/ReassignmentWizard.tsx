import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { hasData } from '@/utils/database-type-helpers';
import { 
  fetchAgreementWithCustomer, 
  fetchVehicle, 
  updatePaymentsLeaseId,
  processResponseData 
} from './ReassignmentHelper';
import { Loader2 } from 'lucide-react';

type ReassignmentStep = 'confirmation' | 'processing' | 'complete';

interface ReassignmentWizardProps {
  sourceAgreementId: string;
  targetAgreementId: string;
  onComplete: () => void;
}

export function ReassignmentWizard({
  sourceAgreementId,
  targetAgreementId,
  onComplete
}: ReassignmentWizardProps) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [step, setStep] = useState<ReassignmentStep>('confirmation');
  const [sourceAgreement, setSourceAgreement] = useState<any>(null);
  const [targetAgreement, setTargetAgreement] = useState<any>(null);
  const [vehicle, setVehicle] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch source agreement using our helper
        const sourceData = await fetchAgreementWithCustomer(sourceAgreementId);
        setSourceAgreement(sourceData);
        
        if (sourceData && sourceData.vehicle_id) {
          const vehicleData = await fetchVehicle(sourceData.vehicle_id);
          setVehicle(vehicleData);
        }

        // Fetch target agreement using our helper
        const targetData = await fetchAgreementWithCustomer(targetAgreementId);
        setTargetAgreement(targetData);
      } catch (err) {
        console.error('Error in ReassignmentWizard:', err);
        setError('Failed to load agreement data');
        toast.error('Failed to load agreement data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [sourceAgreementId, targetAgreementId]);

  const handleConfirm = async () => {
    if (!sourceAgreement || !targetAgreement) {
      toast.error('Missing agreement data');
      return;
    }

    setStep('processing');
    setIsProcessing(true);

    try {
      // Step 1: Update payments to point to the new lease
      const paymentsUpdated = await updatePaymentsLeaseId(
        sourceAgreementId, 
        targetAgreementId
      );
      
      if (!paymentsUpdated) {
        throw new Error('Failed to update payments');
      }

      // Step 2: Mark the original agreement as cancelled
      const { error: updateError } = await supabase
        .from('leases')
        .update({ status: 'cancelled' })
        .eq('id', sourceAgreementId);

      if (updateError) {
        throw new Error('Failed to update source agreement status');
      }

      toast.success('Vehicle reassignment completed successfully');
      setStep('complete');
    } catch (err) {
      console.error('Error during reassignment:', err);
      toast.error('Failed to complete reassignment');
      setError('Failed to complete reassignment');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardContent className="pt-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2">Loading agreement data...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
        </CardContent>
        <CardFooter>
          <Button onClick={onComplete}>Close</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>
          {step === 'confirmation' && "Confirm Vehicle Reassignment"}
          {step === 'processing' && "Processing Reassignment"}
          {step === 'complete' && "Reassignment Complete"}
        </CardTitle>
        <CardDescription>
          {step === 'confirmation' && "Please review and confirm the vehicle reassignment details"}
          {step === 'processing' && "Please wait while we process the reassignment"}
          {step === 'complete' && "The vehicle has been reassigned successfully"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {step === 'confirmation' && sourceAgreement && targetAgreement && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2">Source Agreement</h3>
                <p><span className="font-medium">Agreement #:</span> {sourceAgreement.agreement_number}</p>
                <p><span className="font-medium">Customer:</span> {sourceAgreement.profiles?.full_name || 'N/A'}</p>
                {vehicle && (
                  <p><span className="font-medium">Vehicle:</span> {vehicle.make} {vehicle.model} ({vehicle.license_plate})</p>
                )}
              </div>
              
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2">Target Agreement</h3>
                <p><span className="font-medium">Agreement #:</span> {targetAgreement.agreement_number}</p>
                <p><span className="font-medium">Customer:</span> {targetAgreement.profiles?.full_name || 'N/A'}</p>
              </div>
            </div>
            
            <div className="bg-muted p-4 rounded-md">
              <p className="font-medium text-amber-600">Warning: This action will:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Move all payments from the source agreement to the target agreement</li>
                <li>Mark the source agreement as cancelled</li>
                <li>This operation cannot be undone</li>
              </ul>
            </div>
          </>
        )}
        
        {step === 'processing' && (
          <div className="text-center py-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="mt-2">Processing reassignment...</p>
          </div>
        )}
        
        {step === 'complete' && (
          <div className="bg-green-50 border border-green-200 p-4 rounded-md">
            <p className="text-green-800">The vehicle has been successfully reassigned from agreement {sourceAgreement?.agreement_number} to {targetAgreement?.agreement_number}.</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-end gap-2">
        {step === 'confirmation' && (
          <>
            <Button variant="outline" onClick={onComplete}>Cancel</Button>
            <Button 
              onClick={handleConfirm} 
              disabled={isProcessing || !sourceAgreement || !targetAgreement}
              variant="default"
            >
              Confirm Reassignment
            </Button>
          </>
        )}
        
        {(step === 'processing' || step === 'complete') && (
          <Button onClick={onComplete} disabled={isProcessing}>
            {step === 'complete' ? 'Close' : 'Cancel'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
