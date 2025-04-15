
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { hasData } from '@/utils/database-type-helpers';

const TrafficFineValidation = () => {
  const [licensePlate, setLicensePlate] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<any>(null);
  const [vehicle, setVehicle] = useState<any>(null);
  
  const handleValidate = async () => {
    if (!licensePlate.trim()) {
      toast.error('Please enter a license plate number');
      return;
    }
    
    setIsValidating(true);
    setValidationResults(null);
    setVehicle(null);
    
    try {
      // First, check if the vehicle exists in our system
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select('id, license_plate, make, model')
        .eq('license_plate', licensePlate)
        .single();
      
      if (vehicleError && vehicleError.code !== 'PGRST116') {
        console.error('Error checking vehicle:', vehicleError);
        toast.error('Error validating license plate');
        setIsValidating(false);
        return;
      }
      
      // Simulate API call to traffic authority for validation
      // In a real implementation, this would be an actual API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockFines = [
        {
          id: '1',
          violation_number: 'V-1234',
          violation_date: '2023-12-10T10:30:00Z',
          fine_amount: 500,
          payment_status: 'pending',
          location: 'Main St, Doha'
        },
        {
          id: '2',
          violation_number: 'V-5678',
          violation_date: '2024-01-15T14:45:00Z',
          fine_amount: 750,
          payment_status: 'pending',
          location: 'Airport Road, Doha'
        }
      ];
      
      const totalAmount = mockFines.reduce((sum, fine) => sum + fine.fine_amount, 0);
      
      const results = {
        fines_found: mockFines.length,
        total_amount: totalAmount,
        pending_amount: totalAmount,
        vehicle_found: !!vehicleData,
        vehicle_info: vehicleData || { id: null, license_plate: licensePlate, make: 'Unknown', model: 'Unknown' },
        fines: mockFines
      };
      
      setValidationResults(results);
      
      if (vehicleData) {
        setVehicle({
          id: vehicleData.id,
          license_plate: vehicleData.license_plate,
          make: vehicleData.make,
          model: vehicleData.model
        });
      }
      
      // Record the validation in the database
      const validationRecord = {
        license_plate: licensePlate,
        validation_date: new Date().toISOString(),
        validation_source: 'mock_traffic_authority',
        result: results,
        status: 'completed'
      };
      
      // Use type assertion to bypass type checks
      const { error: insertError } = await supabase
        .from('traffic_fine_validations')
        .insert(validationRecord as any);
      
      if (insertError) {
        console.error('Error recording validation:', insertError);
      }
      
      toast.success('License plate validated successfully');
    } catch (error) {
      console.error('Validation error:', error);
      toast.error('Failed to validate license plate');
    } finally {
      setIsValidating(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Traffic Fine Validation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Enter vehicle license plate"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
              />
              <Button 
                onClick={handleValidate} 
                disabled={isValidating || !licensePlate.trim()}
              >
                {isValidating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Validate
              </Button>
            </div>
            
            {isValidating && (
              <div className="flex items-center justify-center p-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Validating license plate...</span>
              </div>
            )}
            
            {validationResults && (
              <div className="space-y-4 mt-4">
                <Alert variant={validationResults.fines_found > 0 ? 'destructive' : 'default'}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>
                    {validationResults.fines_found === 0 
                      ? 'No traffic fines found' 
                      : `${validationResults.fines_found} Traffic ${validationResults.fines_found === 1 ? 'fine' : 'fines'} found`}
                  </AlertTitle>
                  <AlertDescription>
                    {validationResults.fines_found === 0 
                      ? 'This license plate has no pending traffic fines.' 
                      : `Total amount: QAR ${validationResults.total_amount.toLocaleString()}`}
                  </AlertDescription>
                </Alert>
                
                {vehicle && (
                  <div className="p-4 rounded-md border">
                    <div className="font-medium mb-2">Vehicle Information</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>License Plate:</div>
                      <div>{vehicle.license_plate}</div>
                      <div>Make:</div>
                      <div>{vehicle.make}</div>
                      <div>Model:</div>
                      <div>{vehicle.model}</div>
                    </div>
                  </div>
                )}
                
                {validationResults.fines_found > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">Fine Details</h3>
                    <div className="space-y-3">
                      {validationResults.fines.map((fine: any) => (
                        <div key={fine.id} className="p-3 border rounded-md">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{`Violation #${fine.violation_number}`}</div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(fine.violation_date).toLocaleDateString()}
                              </div>
                              <div className="text-sm mt-1">{fine.location}</div>
                            </div>
                            <div>
                              <div className="font-semibold text-right">
                                QAR {fine.fine_amount.toLocaleString()}
                              </div>
                              <Badge className="mt-1" variant={
                                fine.payment_status === 'paid' ? 'default' : 'destructive'
                              }>
                                {fine.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrafficFineValidation;
