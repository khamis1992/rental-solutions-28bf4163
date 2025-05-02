import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchIcon, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { TrafficFineStatusType } from '@/hooks/use-traffic-fines';
import { validateTrafficFineWithToast } from '@/utils/validation/traffic-fine-validation';

const TrafficFineValidation = () => {
  const [licensePlate, setLicensePlate] = useState('');
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

  const validateLicensePlate = async () => {
    // Validate license plate
    if (!validateTrafficFineWithToast({
      licensePlate
    })) {
      return;
    }
    
    setValidating(true);
    try {
      // Call the local validation endpoint
      const validationDate = new Date().toISOString();
      
      // For demonstration, we'll just query the database
      const { data: fines, error } = await supabase
        .from('traffic_fines')
        .select('*')
        .eq('license_plate', licensePlate)
        .order('violation_date', { ascending: false });
      
      if (error) {
        throw new Error(`Error fetching fines: ${error.message}`);
      }
      
      // Process results
      const validationData = {
        fines_found: fines?.length || 0,
        total_amount: fines?.reduce((sum, f) => sum + (f.fine_amount || 0), 0) || 0,
        pending_amount: fines?.filter(f => f.payment_status === 'pending')
          .reduce((sum, f) => sum + (f.fine_amount || 0), 0) || 0,
        fines: (fines || []).map(f => ({
          id: f.id,
          violation_number: f.violation_number || '',
          violation_date: new Date(f.violation_date),
          amount: f.fine_amount || 0,
          status: f.payment_status as TrafficFineStatusType
        }))
      };
      
      setValidationResult(validationData);
      
      // Log validation in the validation history table
      await supabase
        .from('traffic_fine_validations')
        .insert({
          license_plate: licensePlate,
          validation_date: validationDate,
          validation_source: 'local_database',
          result: validationData,
          status: 'completed'
        });
      
      // Show result notification
      if (validationData.fines_found > 0) {
        toast.warning(`Found ${validationData.fines_found} traffic ${validationData.fines_found > 1 ? 'fines' : 'fine'} for ${licensePlate}`, {
          description: `Total amount: QAR ${validationData.total_amount}`
        });
      } else {
        toast.success(`No traffic fines found for ${licensePlate}`);
      }
      
    } catch (error) {
      console.error('Error validating license plate:', error);
      toast.error('Failed to validate license plate', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
      setValidationResult(null);
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
        <div className="flex flex-col space-y-2">
          <Label htmlFor="licensePlate">License Plate</Label>
          <div className="flex space-x-2">
            <Input
              id="licensePlate"
              placeholder="Enter license plate"
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value)}
              className="flex-grow"
            />
            <Button 
              onClick={validateLicensePlate} 
              disabled={validating || !licensePlate}
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
          <p className="text-xs text-muted-foreground">
            Enter the vehicle's license plate to check for any traffic fines
          </p>
        </div>

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
        
        {/* Add more detailed information or actions if needed */}
      </CardContent>
    </Card>
  );
};

export default TrafficFineValidation;
