
import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle, Check, Loader2, Search } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTrafficFines } from '@/hooks/use-traffic-fines';
import { formatLicensePlate } from '@/utils/format-utils';

const validationSchema = z.object({
  licensePlate: z.string()
    .min(1, 'License plate is required')
    .transform(val => formatLicensePlate(val)), // Standardize format
});

type ValidationFormValues = z.infer<typeof validationSchema>;

const TrafficFineValidation: React.FC = () => {
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const { trafficFines, isLoading: finesLoading } = useTrafficFines();
  
  const form = useForm<ValidationFormValues>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      licensePlate: '',
    },
  });

  const onSubmit = async (data: ValidationFormValues) => {
    setIsValidating(true);
    setValidationResult(null);
    
    try {
      // Standardize license plate format for consistent matching
      const standardizedLicensePlate = formatLicensePlate(data.licensePlate);
      
      if (!standardizedLicensePlate) {
        toast.error('Invalid license plate format');
        return;
      }
      
      console.log(`Validating license plate: ${standardizedLicensePlate} (original: ${data.licensePlate})`);
      
      // Check if the license plate exists in the vehicles table
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select('id, license_plate, make, model')
        .ilike('license_plate', standardizedLicensePlate)
        .maybeSingle();
      
      // Find traffic fines for this license plate with case-insensitive matching
      const relevantFines = trafficFines?.filter(fine => 
        formatLicensePlate(fine.licensePlate || '') === standardizedLicensePlate
      ) || [];
      
      console.log(`Found ${relevantFines.length} fines for license plate ${standardizedLicensePlate}`);
      
      // Calculate some stats
      const totalAmount = relevantFines.reduce((sum, fine) => sum + fine.fineAmount, 0);
      const pendingAmount = relevantFines
        .filter(fine => fine.paymentStatus === 'pending')
        .reduce((sum, fine) => sum + fine.fineAmount, 0);
      
      // Create a validation record
      const validationData = {
        license_plate: standardizedLicensePlate,
        validation_date: new Date().toISOString(),
        validation_source: 'manual',
        result: {
          fines_found: relevantFines.length,
          total_amount: totalAmount,
          pending_amount: pendingAmount,
          vehicle_found: vehicleData ? true : false,
          vehicle_info: vehicleData ? {
            id: vehicleData.id,
            license_plate: vehicleData.license_plate,
            make: vehicleData.make,
            model: vehicleData.model
          } : null,
          fines: relevantFines.map(fine => ({
            id: fine.id,
            violation_number: fine.violationNumber,
            violation_date: fine.violationDate,
            amount: fine.fineAmount,
            status: fine.paymentStatus
          }))
        },
        status: 'completed'
      };
        
      const { error: validationError } = await supabase
        .from('traffic_fine_validations')
        .insert(validationData as any);
        
      if (validationError) {
        console.error('Error recording validation:', validationError);
        toast.error('Error recording validation result');
      }
      
      // Set the result for display
      setValidationResult({
        licensePlate: standardizedLicensePlate,
        finesCount: relevantFines.length,
        totalAmount,
        pendingAmount,
        vehicleFound: vehicleData ? true : false,
        vehicleInfo: vehicleData || undefined,
        fines: relevantFines
      });
      
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
          <CardDescription>
            Check if a vehicle has any pending traffic fines
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent>
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 md:col-span-6">
                  <FormField
                    control={form.control}
                    name="licensePlate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>License Plate</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter license plate" 
                            {...field} 
                            disabled={isValidating}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-12 md:col-span-6 md:flex md:items-end">
                  <Button 
                    type="submit" 
                    disabled={isValidating} 
                    className="w-full"
                  >
                    {isValidating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Validating...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Validate
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </form>
        </Form>
        <CardFooter className="flex flex-col items-start">
          {validationResult && (
            <div className="w-full">
              <Alert 
                variant={validationResult.finesCount > 0 ? "destructive" : "default"}
                className={validationResult.finesCount > 0 ? "mb-4" : ""}
              >
                {validationResult.finesCount > 0 ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                <AlertTitle>
                  {validationResult.finesCount > 0 
                    ? `${validationResult.finesCount} Traffic Fine(s) Found` 
                    : 'No Traffic Fines Found'}
                </AlertTitle>
                <AlertDescription>
                  {validationResult.finesCount > 0 
                    ? `Total amount: $${validationResult.totalAmount.toFixed(2)}, Pending amount: $${validationResult.pendingAmount.toFixed(2)}`
                    : `No traffic fines found for license plate ${validationResult.licensePlate}`}
                </AlertDescription>
              </Alert>

              {/* Vehicle Information */}
              {validationResult.vehicleFound && (
                <Alert variant="warning" className="mb-4">
                  <AlertTitle>Vehicle Found in System</AlertTitle>
                  <AlertDescription>
                    {validationResult.vehicleInfo?.make} {validationResult.vehicleInfo?.model} 
                    (License: {validationResult.vehicleInfo?.license_plate})
                  </AlertDescription>
                </Alert>
              )}
              
              {!validationResult.vehicleFound && (
                <Alert variant="warning" className="mb-4">
                  <AlertTitle>Vehicle Not Found</AlertTitle>
                  <AlertDescription>
                    No vehicle with license plate {validationResult.licensePlate} was found in the system.
                  </AlertDescription>
                </Alert>
              )}

              {validationResult.finesCount > 0 && (
                <div className="mt-4 border rounded-md p-4">
                  <h3 className="font-semibold mb-2">Fine Details</h3>
                  <div className="space-y-2">
                    {validationResult.fines.map((fine: any) => (
                      <div key={fine.id} className="p-2 border rounded flex justify-between items-center">
                        <div>
                          <p className="font-medium">{fine.violationNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(fine.violationDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${fine.fineAmount.toFixed(2)}</p>
                          <p className={`text-sm ${
                            fine.paymentStatus === 'paid' 
                              ? 'text-green-600' 
                              : fine.paymentStatus === 'disputed' 
                                ? 'text-amber-600' 
                                : 'text-red-600'
                          }`}>
                            {fine.paymentStatus.charAt(0).toUpperCase() + fine.paymentStatus.slice(1)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default TrafficFineValidation;
