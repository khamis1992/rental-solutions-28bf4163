
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { findVehicleByLicensePlate, updateVehicleStatus } from '@/utils/vehicle-update';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { VehicleStatus } from '@/types/vehicle';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CarFront, Loader2, Search } from 'lucide-react';

interface VehicleSearchFormValues {
  licensePlate: string;
}

interface StatusUpdateFormValues {
  status: VehicleStatus;
}

// Define a proper type for the vehicle data
interface VehicleData {
  id: string;
  make: string;
  model: string;
  year?: number;
  color?: string | null;
  license_plate: string;
  status: VehicleStatus;
  vehicle_types?: {
    id: string;
    name: string;
  } | null;
}

const VehicleStatusUpdate = () => {
  const [step, setStep] = useState<'search' | 'update'>('search');
  const [isLoading, setIsLoading] = useState(false);
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);

  // Form for searching vehicles
  const searchForm = useForm<VehicleSearchFormValues>({
    defaultValues: {
      licensePlate: '',
    },
  });

  // Form for updating status
  const updateForm = useForm<StatusUpdateFormValues>({
    defaultValues: {
      status: 'available',
    },
  });

  const handleSearch = async (data: VehicleSearchFormValues) => {
    try {
      setIsLoading(true);
      
      const result = await findVehicleByLicensePlate(data.licensePlate);
      
      if (result.success) {
        setVehicle(result.data);
        updateForm.setValue('status', result.data.status);
        setStep('update');
        toast.success('Vehicle found', {
          description: `${result.data.make} ${result.data.model} (${result.data.license_plate})`
        });
      } else {
        toast.error('Vehicle not found', {
          description: result.message
        });
      }
    } catch (error) {
      toast.error('Error searching for vehicle', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (data: StatusUpdateFormValues) => {
    if (!vehicle || !vehicle.id) {
      toast.error('No vehicle selected');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const result = await updateVehicleStatus(vehicle.id, data.status);
      
      if (result.success) {
        toast.success('Vehicle status updated successfully');
        // Reset back to search step
        setStep('search');
        setVehicle(null);
        searchForm.reset();
      } else {
        toast.error('Failed to update vehicle status', {
          description: result.message
        });
      }
    } catch (error) {
      toast.error('Error updating vehicle status', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const backToSearch = () => {
    setStep('search');
    setVehicle(null);
  };

  return (
    <Card>
      {step === 'search' ? (
        <>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Find Vehicle
            </CardTitle>
            <CardDescription>Enter license plate to find vehicle</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...searchForm}>
              <form onSubmit={searchForm.handleSubmit(handleSearch)} className="space-y-4">
                <FormField
                  control={searchForm.control}
                  name="licensePlate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Plate</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Enter license plate" 
                          autoComplete="off"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || !searchForm.watch('licensePlate')}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    'Search'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </>
      ) : (
        <>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CarFront className="h-5 w-5 mr-2" />
              Update Vehicle Status
            </CardTitle>
            <CardDescription>
              {vehicle?.make} {vehicle?.model} ({vehicle?.license_plate})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Current Status:</p>
                <Badge variant={vehicle?.status === 'stolen' ? 'destructive' : 'outline'}>
                  {vehicle?.status?.charAt(0).toUpperCase() + vehicle?.status?.slice(1)}
                </Badge>
              </div>
              
              <Form {...updateForm}>
                <form onSubmit={updateForm.handleSubmit(handleStatusUpdate)} className="space-y-4">
                  <FormField
                    control={updateForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Status</FormLabel>
                        <Select
                          disabled={isLoading}
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="rented">Rented</SelectItem>
                            <SelectItem value="reserved">Reserved</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="stolen">Stolen</SelectItem>
                            <SelectItem value="retired">Retired</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={backToSearch}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isLoading || updateForm.watch('status') === vehicle?.status}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        'Update Status'
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </CardContent>
        </>
      )}
    </Card>
  );
};

export default VehicleStatusUpdate;
