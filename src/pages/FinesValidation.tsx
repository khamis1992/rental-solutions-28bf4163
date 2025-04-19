
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTrafficFinesValidation, ValidationResult } from '@/hooks/use-traffic-fines-validation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Check, Loader2, Search } from 'lucide-react';
import { TrafficFineValidationResult } from '@/components/fines/TrafficFineValidationResult';
import { TrafficFineValidationHistory } from '@/components/fines/TrafficFineValidationHistory';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Define validation schema
const validationFormSchema = z.object({
  licensePlate: z.string().min(1, { message: "License plate is required" }),
});

type ValidationFormValues = z.infer<typeof validationFormSchema>;

const FinesValidation = () => {
  const [activeTab, setActiveTab] = useState("validate");
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const { validateTrafficFine, isValidating } = useTrafficFinesValidation();

  // Initialize form
  const form = useForm<ValidationFormValues>({
    resolver: zodResolver(validationFormSchema),
    defaultValues: {
      licensePlate: "",
    }
  });

  const onSubmit = async (data: ValidationFormValues) => {
    try {
      const result = await validateTrafficFine.mutateAsync(data.licensePlate);
      setValidationResult(result);
    } catch (error) {
      console.error("Validation error:", error);
      // Error is handled by the mutation
    }
  };

  return (
    <PageContainer>
      <SectionHeader
        title="Traffic Fines Validation"
        description="Validate traffic fines against the MOI Qatar system"
        icon={AlertTriangle}
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="validate" className="flex items-center">
            <Search className="h-4 w-4 mr-2" />
            Validate Fines
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Validation History
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="validate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Validate Traffic Fine</CardTitle>
              <CardDescription>
                Check if a traffic fine exists in the MOI Qatar system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* License Plate */}
                    <FormField
                      control={form.control}
                      name="licensePlate"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>License Plate *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter license plate number"
                              disabled={isValidating}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Enter the vehicle's license plate to validate
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex items-end">
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
                </form>
              </Form>
              
              {/* Show validation result */}
              {validationResult && (
                <div className="mt-8">
                  <TrafficFineValidationResult result={validationResult} />
                </div>
              )}
              
              <Alert className="mt-8">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Important Note</AlertTitle>
                <AlertDescription>
                  This is a simulation of the validation process. In a production environment, this would connect to the 
                  MOI Qatar system and perform a real validation. Currently, the validation results are randomly generated.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="space-y-6">
          <TrafficFineValidationHistory />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default FinesValidation;
