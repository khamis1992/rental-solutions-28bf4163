
import React, { useState } from 'react';
import { updateVehicleStatus, findVehicleByLicensePlate, updateVehicleInfo } from '@/utils/vehicle-update';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VehicleStatus } from '@/types/vehicle';
import { toast } from 'sonner';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const VehicleStatusUpdate = () => {
  const [vehicleId, setVehicleId] = useState<string>('');
  const [licensePlate, setLicensePlate] = useState<string>('');
  const [status, setStatus] = useState<VehicleStatus>('available');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [lookupMode, setLookupMode] = useState<boolean>(true);

  const handleVehicleLookup = async () => {
    if (!licensePlate.trim()) {
      toast.error('Please enter a license plate number');
      return;
    }
    
    setIsLoading(true);
    setResult(null);
    
    try {
      const response = await findVehicleByLicensePlate(licensePlate);
      
      if (response.success && response.id) {
        setVehicleId(response.id);
        setLookupMode(false);
        toast.success('Vehicle found', {
          description: `Vehicle ID: ${response.id}`,
        });
      } else {
        setResult({
          success: false,
          message: response.message
        });
        toast.error('Vehicle lookup failed', {
          description: response.message,
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'An unknown error occurred'
      });
      toast.error('Vehicle lookup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!vehicleId) {
      toast.error('Vehicle ID is required');
      return;
    }
    
    setIsLoading(true);
    setResult(null);
    
    try {
      const response = await updateVehicleStatus(vehicleId, status);
      
      setResult({
        success: response.success,
        message: response.message
      });
      
      if (response.success) {
        toast.success('Vehicle status updated', {
          description: `Status updated to: ${status}`,
        });
      } else {
        toast.error('Status update failed', {
          description: response.message,
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'An unknown error occurred'
      });
      toast.error('Status update failed');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setVehicleId('');
    setLicensePlate('');
    setStatus('available');
    setResult(null);
    setLookupMode(true);
  };

  const handleDirectIdInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVehicleId(e.target.value);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Vehicle Status Update</CardTitle>
        <CardDescription>
          {lookupMode 
            ? 'Look up a vehicle by license plate or enter ID directly' 
            : 'Update vehicle status'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {lookupMode ? (
          <>
            <div className="space-y-2">
              <label htmlFor="license-plate" className="text-sm font-medium">
                License Plate
              </label>
              <Input
                id="license-plate"
                placeholder="Enter license plate"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="vehicle-id" className="text-sm font-medium">
                Vehicle ID (UUID)
              </label>
              <Input
                id="vehicle-id"
                placeholder="Enter vehicle ID directly (optional)"
                value={vehicleId}
                onChange={handleDirectIdInput}
              />
              <p className="text-xs text-muted-foreground">
                If you already know the vehicle ID, you can enter it directly
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <label htmlFor="vehicle-id-display" className="text-sm font-medium">
                Vehicle ID
              </label>
              <Input
                id="vehicle-id-display"
                value={vehicleId}
                readOnly
                className="bg-muted"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium">
                Select Status
              </label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as VehicleStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="rented">Rented</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="police_station">Police Station</SelectItem>
                  <SelectItem value="accident">Accident</SelectItem>
                  <SelectItem value="stolen">Stolen</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
        
        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            {result.success ? (
              <Check className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>
              {result.success ? "Success" : "Error"}
            </AlertTitle>
            <AlertDescription>
              {result.message}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={resetForm}
        >
          Reset
        </Button>
        
        {lookupMode ? (
          <Button
            onClick={vehicleId ? () => setLookupMode(false) : handleVehicleLookup}
            disabled={isLoading || (!vehicleId && !licensePlate)}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {vehicleId ? "Continue" : "Find Vehicle"}
          </Button>
        ) : (
          <Button
            onClick={handleStatusUpdate}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Status
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default VehicleStatusUpdate;
