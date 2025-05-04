
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Check, AlertCircle, Plus, History } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ValidationHistory } from './validation/ValidationHistory';
import { useTrafficFinesValidation } from '@/hooks/use-traffic-fines-validation';
import { ValidationResultType } from './validation/types';

const validationSchema = z.object({
  licensePlate: z.string().min(3, "License plate is required")
});

type ValidationFormValues = z.infer<typeof validationSchema>;

export function TrafficFineValidation() {
  const [showHistory, setShowHistory] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResultType | null>(null);
  const { validateLicensePlate, isValidating, validationHistory, loadValidationHistory } = useTrafficFinesValidation();
  
  const form = useForm<ValidationFormValues>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      licensePlate: '',
    },
  });
  
  useEffect(() => {
    loadValidationHistory();
  }, []);
  
  const onSubmit = async (data: ValidationFormValues) => {
    try {
      const result = await validateLicensePlate(data.licensePlate);
      
      // Set the validation result with required properties
      setValidationResult({
        isValid: true,
        message: result.hasFine ? 'Traffic fine found' : 'No traffic fines found',
        licensePlate: data.licensePlate,
        validationDate: result.validationDate || new Date(),
        validationSource: result.validationSource || 'manual',
        hasFine: result.hasFine || false,
        details: result.details,
        validationId: result.validationId
      });
      
      toast.success('Validation completed');
    } catch (error) {
      console.error('Validation error:', error);
      toast.error('Failed to validate license plate');
      
      // Set error validation result
      setValidationResult({
        isValid: false,
        message: 'Validation failed',
        licensePlate: data.licensePlate,
        validationDate: new Date(),
        validationSource: 'manual',
        hasFine: false,
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  };
  
  const toggleHistory = () => {
    setShowHistory(!showHistory);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Traffic Fine Validation</CardTitle>
            <CardDescription>Check if a vehicle has any traffic fines</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={toggleHistory}>
            {showHistory ? <Plus className="h-4 w-4 mr-1" /> : <History className="h-4 w-4 mr-1" />}
            {showHistory ? 'New Validation' : 'View History'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!showHistory ? (
          <div className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="licensePlate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Plate</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter license plate" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isValidating}>
                  {isValidating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                      Validating
                    </>
                  ) : 'Validate'}
                </Button>
              </form>
            </Form>
            
            {validationResult && (
              <Alert variant={validationResult.isValid ? "default" : "destructive"} className="mt-4">
                {validationResult.hasFine ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                <AlertTitle>
                  {validationResult.hasFine ? "Traffic Fine Detected" : "No Traffic Fine"}
                </AlertTitle>
                <AlertDescription>
                  {validationResult.details || validationResult.message}
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <ValidationHistory validationHistory={validationHistory} />
        )}
      </CardContent>
    </Card>
  );
}
