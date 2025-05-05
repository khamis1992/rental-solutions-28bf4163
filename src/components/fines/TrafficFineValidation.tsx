
import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle, Check, Loader2, Search, UserCheck } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useTrafficFines } from '@/hooks/use-traffic-fines';

const validationSchema = z.object({
  licensePlate: z.string().min(1, 'License plate is required'),
});

type ValidationFormValues = z.infer<typeof validationSchema>;
type TrafficFineStatusType = 'paid' | 'pending' | 'disputed';

const TrafficFineValidation: React.FC = () => {
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [assigningFine, setAssigningFine] = useState<string | null>(null);
  const { trafficFines, assignToCustomer } = useTrafficFines();
  
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
      const relevantFines = trafficFines?.filter(fine => 
        fine.licensePlate?.toLowerCase() === data.licensePlate.toLowerCase()
      ) || [];
      
      const totalAmount = relevantFines.reduce((sum, fine) => sum + fine.fineAmount, 0);
      const pendingAmount = relevantFines
        .filter(fine => fine.paymentStatus === 'pending')
        .reduce((sum, fine) => sum + fine.fineAmount, 0);
      
      // Use type assertion to bypass TypeScript checking since we know the structure is correct
      const { error: validationError } = await supabase
        .from('traffic_fine_validations' as any)
        .insert([{
          license_plate: data.licensePlate,
          validation_date: new Date().toISOString(),
          validation_source: 'manual',
          result: {
            fines_found: relevantFines.length,
            total_amount: totalAmount,
            pending_amount: pendingAmount,
            fines: relevantFines.map(fine => ({
              id: fine.id,
              violation_number: fine.violationNumber,
              violation_date: fine.violationDate,
              amount: fine.fineAmount,
              status: fine.paymentStatus
            }))
          },
          status: 'completed'
        }] as any);
        
      if (validationError) {
        console.error('Error recording validation:', validationError);
        toast.error('Error recording validation result');
      }
      
      setValidationResult({
        licensePlate: data.licensePlate,
        finesCount: relevantFines.length,
        totalAmount,
        pendingAmount,
        fines: relevantFines
      });
      
    } catch (error) {
      console.error('Validation error:', error);
      toast.error('Failed to validate license plate');
    } finally {
      setIsValidating(false);
    }
  };

  const handleAssignToCustomer = async (id: string) => {
    if (!id) {
      toast.error("Invalid fine ID");
      return;
    }

    try {
      setAssigningFine(id);
      await assignToCustomer.mutateAsync({ id });
      toast.success("Fine assigned to customer successfully");
      
      if (validationResult && validationResult.fines) {
        setValidationResult({
          ...validationResult,
          fines: validationResult.fines.map((fine: any) => {
            if (fine.id === id) {
              return { ...fine, isAssigned: true };
            }
            return fine;
          })
        });
      }
    } catch (error) {
      console.error("Error assigning fine to customer:", error);
      toast.error("Failed to assign fine to customer", {
        description: error instanceof Error ? error.message : "An unexpected error occurred"
      });
    } finally {
      setAssigningFine(null);
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
                    ? `Total amount: QAR ${validationResult.totalAmount.toFixed(2)}, Pending amount: QAR ${validationResult.pendingAmount.toFixed(2)}`
                    : `No traffic fines found for license plate ${validationResult.licensePlate}`}
                </AlertDescription>
              </Alert>

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
                        <div className="flex flex-col items-end">
                          <p className="font-medium">QAR {fine.fineAmount.toFixed(2)}</p>
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
                        <div className="ml-4">
                          {!fine.customerId && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAssignToCustomer(fine.id)}
                              disabled={assigningFine === fine.id}
                              className="flex items-center"
                            >
                              {assigningFine === fine.id ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Assigning...
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-3 w-3 mr-1" />
                                  Assign
                                </>
                              )}
                            </Button>
                          )}
                          {fine.customerId && (
                            <div className="text-xs text-green-600 flex items-center">
                              <UserCheck className="h-3 w-3 mr-1" />
                              Assigned
                            </div>
                          )}
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
