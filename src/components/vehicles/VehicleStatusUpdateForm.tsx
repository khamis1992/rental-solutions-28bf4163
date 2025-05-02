
import React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CarFront, Loader2 } from 'lucide-react';
import { VehicleStatus } from '@/types/vehicle';
import { updateVehicleStatus } from '@/utils/vehicle-update';

interface StatusUpdateFormValues {
  status: VehicleStatus;
}

interface VehicleStatusUpdateFormProps {
  vehicle: {
    id: string;
    make: string;
    model: string;
    license_plate: string;
    status: VehicleStatus;
  };
  onStatusUpdated: () => void;
  onCancel: () => void;
}

export const VehicleStatusUpdateForm = ({ 
  vehicle, 
  onStatusUpdated,
  onCancel
}: VehicleStatusUpdateFormProps) => {
  const [isLoading, setIsLoading] = React.useState(false);
  
  // Form for updating status
  const updateForm = useForm<StatusUpdateFormValues>({
    defaultValues: {
      status: vehicle.status,
    },
  });

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
        onStatusUpdated();
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

  return (
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
                  onClick={onCancel}
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
  );
};
