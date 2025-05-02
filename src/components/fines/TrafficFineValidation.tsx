
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { TrafficFineStatusType } from '@/hooks/use-traffic-fines';
import { validateTrafficFineWithToast } from '@/utils/validation/traffic-fine-validation';
import { useTrafficFinesValidation } from '@/hooks/use-traffic-fines-validation';
import { useErrorNotification } from '@/hooks/use-error-notification';
import SingleValidationForm from './validation/SingleValidationForm';
import BatchValidationForm from './validation/BatchValidationForm';
import ValidationResult from './validation/ValidationResult';
import ValidationHistory from './validation/ValidationHistory';

const TrafficFineValidation = () => {
  const [licensePlate, setLicensePlate] = useState('');
  const [batchInput, setBatchInput] = useState('');
  const [showBatchInput, setShowBatchInput] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    fines_found: number;
    total_amount: number;
    pending_amount: number;
    fines: {
      id: string;
      violation_number: string;
      violation_date: Date;
      amount: number;
      status: TrafficFineStatusType;
    }[];
  } | null>(null);

  const { 
    validateTrafficFine, 
    batchValidateTrafficFines,
    validationHistory 
  } = useTrafficFinesValidation();
  
  const errorNotification = useErrorNotification();

  const handleValidateLicensePlate = async () => {
    // Validate license plate
    if (!validateTrafficFineWithToast({
      licensePlate
    })) {
      return;
    }
    
    setValidating(true);
    try {
      // Call validation function from our hook
      const result = await validateTrafficFine(licensePlate);
      
      // Process results for display
      const validationData = {
        fines_found: result.hasFine ? 1 : 0,
        total_amount: 0, // This would come from the validation response in a real system
        pending_amount: 0, // This would come from the validation response in a real system
        fines: result.hasFine ? [{
          id: result.validationId || 'unknown',
          violation_number: 'From validation system',
          violation_date: result.validationDate,
          amount: 0, // This would come from the validation response in a real system
          status: 'pending' as TrafficFineStatusType
        }] : []
      };
      
      setValidationResult(validationData);
      
      // Show result notification
      if (validationData.fines_found > 0) {
        toast.warning(`Found ${validationData.fines_found} traffic ${validationData.fines_found > 1 ? 'fines' : 'fine'} for ${licensePlate}`);
      } else {
        toast.success(`No traffic fines found for ${licensePlate}`);
      }
      
    } catch (error) {
      console.error('Error validating license plate:', error);
      errorNotification.showError('Validation Failed', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        id: 'license-validation-error'
      });
      setValidationResult(null);
    } finally {
      setValidating(false);
    }
  };
  
  const handleValidateBatch = async () => {
    if (!batchInput.trim()) {
      toast.error('Please enter license plates');
      return;
    }
    
    // Parse input to get array of plates
    const plates = batchInput.trim().split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    if (plates.length === 0) {
      toast.error('No valid license plates found');
      return;
    }
    
    if (plates.length > 20) {
      errorNotification.showError('Too many plates', {
        description: 'Please limit batch validation to 20 plates at a time to prevent system overload.',
        id: 'batch-size-error'
      });
      return;
    }
    
    setValidating(true);
    
    try {
      const batchResult = await batchValidateTrafficFines(plates);
      
      // Results are handled directly in the hook through toast notifications
      
      // Reset UI state after batch processing
      if (batchResult.errors.length === 0) {
        // If successful, clear the input
        setBatchInput('');
        setShowBatchInput(false);
      }
    } catch (error) {
      errorNotification.showError('Batch Validation Failed', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        id: 'batch-validation-error'
      });
    } finally {
      setValidating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Traffic Fine Validation</CardTitle>
        <CardDescription>
          Check if a vehicle has any pending traffic fines
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {showBatchInput ? (
          <BatchValidationForm
            batchInput={batchInput}
            setBatchInput={setBatchInput}
            validating={validating}
            onValidate={handleValidateBatch}
            onHideBatchInput={() => setShowBatchInput(false)}
          />
        ) : (
          <SingleValidationForm
            licensePlate={licensePlate}
            setLicensePlate={setLicensePlate}
            validating={validating}
            onValidate={handleValidateLicensePlate}
            onShowBatchInput={() => setShowBatchInput(true)}
          />
        )}

        {validationResult && (
          <ValidationResult 
            result={validationResult} 
            licensePlate={licensePlate} 
          />
        )}
        
        {validationHistory && validationHistory.length > 0 && (
          <ValidationHistory history={validationHistory} />
        )}
      </CardContent>
    </Card>
  );
};

export default TrafficFineValidation;
