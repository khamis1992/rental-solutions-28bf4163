
import React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, Search } from 'lucide-react';
import { VehicleData } from '@/types/vehicle';
import { findVehicleByLicensePlate } from '@/utils/vehicle-update';

interface VehicleSearchFormValues {
  licensePlate: string;
}

interface VehicleStatusSearchProps {
  onVehicleFound: (vehicle: VehicleData) => void;
}

export const VehicleStatusSearch = ({ onVehicleFound }: VehicleStatusSearchProps) => {
  const [isLoading, setIsLoading] = React.useState(false);
  
  // Form for searching vehicles
  const searchForm = useForm<VehicleSearchFormValues>({
    defaultValues: {
      licensePlate: '',
    },
  });

  const handleSearch = async (data: VehicleSearchFormValues) => {
    try {
      setIsLoading(true);
      
      const result = await findVehicleByLicensePlate(data.licensePlate);
      
      if (result.success) {
        onVehicleFound(result.data);
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

  return (
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
  );
};
