
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchIcon, AlertCircle, CheckCircle, Loader2, Info, AlertTriangle, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { TrafficFineStatusType } from '@/hooks/use-traffic-fines';
import { validateTrafficFineWithToast } from '@/utils/validation/traffic-fine-validation';
import { useTrafficFinesValidation } from '@/hooks/use-traffic-fines-validation';
import { useErrorNotification } from '@/hooks/use-error-notification';

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

  const validateLicensePlate = async () => {
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
  
  const validateBatchLicensePlates = async () => {
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
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="batchInput">Batch License Plates</Label>
              <Button
                variant="ghost" 
                size="sm"
                onClick={() => setShowBatchInput(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <textarea
              id="batchInput"
              placeholder="Enter each license plate on a new line"
              value={batchInput}
              onChange={(e) => setBatchInput(e.target.value)}
              className="flex h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={validating}
            />
            <p className="text-xs text-muted-foreground">
              Enter up to 20 license plates, one per line
            </p>
            <Button 
              onClick={validateBatchLicensePlates} 
              disabled={validating || !batchInput.trim()}
              className="w-full"
            >
              {validating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validating Batch...
                </>
              ) : (
                <>
                  <SearchIcon className="mr-2 h-4 w-4" />
                  Validate All Plates
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col space-y-2">
            <Label htmlFor="licensePlate">License Plate</Label>
            <div className="flex space-x-2">
              <Input
                id="licensePlate"
                placeholder="Enter license plate"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                className="flex-grow"
                disabled={validating}
              />
              <Button 
                onClick={validateLicensePlate} 
                disabled={validating || !licensePlate.trim()}
                className="w-36"
              >
                {validating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <SearchIcon className="mr-2 h-4 w-4" />
                    Validate
                  </>
                )}
              </Button>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                Enter the vehicle's license plate to check for any traffic fines
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowBatchInput(true)}
              >
                Batch Validate
              </Button>
            </div>
          </div>
        )}

        {validationResult && (
          <Alert 
            variant={validationResult.fines_found > 0 ? "destructive" : "default"}
            className="mt-6"
          >
            {validationResult.fines_found > 0 ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            <AlertTitle>Validation Results</AlertTitle>
            <AlertDescription>
              {validationResult.fines_found > 0 ? (
                <div className="space-y-2">
                  <p>
                    Found {validationResult.fines_found} traffic {validationResult.fines_found > 1 ? 'fines' : 'fine'} for license plate {licensePlate}
                  </p>
                  <p>
                    Total amount: QAR {validationResult.total_amount}
                  </p>
                  <p>
                    Pending amount: QAR {validationResult.pending_amount}
                  </p>
                  
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold mb-2">Fine Details</h4>
                    <div className="space-y-2">
                      {validationResult.fines.map((fine, index) => (
                        <div key={index} className="border p-2 rounded-md text-sm">
                          <div className="flex justify-between">
                            <span>Violation #{fine.violation_number || index+1}</span>
                            <span className={fine.status === 'paid' ? 'text-green-500' : 'text-red-500'}>
                              {fine.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Date: {fine.violation_date.toLocaleDateString()}</span>
                            <span>Amount: QAR {fine.amount}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p>No traffic fines found for license plate {licensePlate}</p>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {validationHistory && validationHistory.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-2">Recent Validations</h4>
            <div className="border rounded-md overflow-hidden">
              <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2">License Plate</th>
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validationHistory.slice(0, 5).map((item, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/50'}>
                        <td className="p-2">{item.licensePlate}</td>
                        <td className="p-2">{item.validationDate.toLocaleString()}</td>
                        <td className="p-2">
                          {item.hasFine ? (
                            <span className="flex items-center text-destructive">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Fine found
                            </span>
                          ) : (
                            <span className="flex items-center text-green-600">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              No fine
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrafficFineValidation;
