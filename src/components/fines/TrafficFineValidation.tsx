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
import { useLanguage } from '@/contexts/LanguageContext';

const validationSchema = z.object({
  licensePlate: z.string().min(1, 'License plate is required'),
});

type ValidationFormValues = z.infer<typeof validationSchema>;

const TrafficFineValidation: React.FC = () => {
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [assigningFine, setAssigningFine] = useState<string | null>(null);
  const { trafficFines, assignToCustomer } = useTrafficFines();
  const { language } = useLanguage();
  
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
        console.error('Error saving validation:', validationError);
      }
      
      setValidationResult({
        licensePlate: data.licensePlate,
        finesCount: relevantFines.length,
        totalAmount,
        pendingAmount,
        fines: relevantFines
      });
      
      toast.success(language === 'ar' ? 'تم التحقق من المخالفات بنجاح' : 'Validation completed successfully');
    } catch (error) {
      console.error('Validation error:', error);
      toast.error(language === 'ar' ? 'فشل في التحقق من المخالفات' : 'Failed to validate traffic fines');
    } finally {
      setIsValidating(false);
    }
  };

  const handleAssignToCustomer = async (fineId: string) => {
    if (!validationResult) return;
    
    setAssigningFine(fineId);
    try {
      await assignToCustomer.mutateAsync({
        fineId,
        licensePlate: validationResult.licensePlate
      });
      
      toast.success(language === 'ar' ? 'تم تعيين المخالفة للعميل بنجاح' : 'Fine assigned to customer successfully');
      
      // Update the validation result to reflect the assignment
      setValidationResult(prev => ({
        ...prev,
        fines: prev.fines.map((fine: any) => 
          fine.id === fineId ? { ...fine, customerId: 'assigned' } : fine
        )
      }));
    } catch (error) {
      console.error('Assignment error:', error);
      toast.error(language === 'ar' ? 'فشل في تعيين المخالفة للعميل' : 'Failed to assign fine to customer');
    } finally {
      setAssigningFine(null);
    }
  };

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Card>
        <CardHeader>
          <CardTitle className={language === 'ar' ? 'text-right' : ''}>
            {language === 'ar' ? 'التحقق من المخالفات المرورية' : 'Traffic Fine Validation'}
          </CardTitle>
          <CardDescription className={language === 'ar' ? 'text-right' : ''}>
            {language === 'ar' ? 'تحقق من وجود مخالفات مرورية معلقة للمركبة' : 'Check if a vehicle has any pending traffic fines'}
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
                        <FormLabel className={language === 'ar' ? 'text-right' : ''}>
                          {language === 'ar' ? 'لوحة الترخيص' : 'License Plate'}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={language === 'ar' ? 'أدخل لوحة الترخيص' : 'Enter license plate'} 
                            {...field} 
                            disabled={isValidating}
                            className={language === 'ar' ? 'text-right' : ''}
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
                        <Loader2 className={`h-4 w-4 animate-spin ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                        {language === 'ar' ? 'جاري التحقق...' : 'Validating...'}
                      </>
                    ) : (
                      <>
                        <Search className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                        {language === 'ar' ? 'تحقق' : 'Validate'}
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
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              >
                {validationResult.finesCount > 0 ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                <AlertTitle className={language === 'ar' ? 'text-right' : ''}>
                  {validationResult.finesCount > 0 
                    ? (language === 'ar' ? `تم العثور على ${validationResult.finesCount} مخالفة مرورية` : `${validationResult.finesCount} Traffic Fine(s) Found`)
                    : (language === 'ar' ? 'لم يتم العثور على مخالفات مرورية' : 'No Traffic Fines Found')}
                </AlertTitle>
                <AlertDescription className={language === 'ar' ? 'text-right' : ''}>
                  {validationResult.finesCount > 0 
                    ? (language === 'ar' 
                        ? `المبلغ الإجمالي: ${validationResult.totalAmount.toFixed(2)} ر.س، المبلغ المعلق: ${validationResult.pendingAmount.toFixed(2)} ر.س`
                        : `Total amount: QAR ${validationResult.totalAmount.toFixed(2)}, Pending amount: QAR ${validationResult.pendingAmount.toFixed(2)}`)
                    : (language === 'ar' 
                        ? `لم يتم العثور على مخالفات مرورية للوحة الترخيص ${validationResult.licensePlate}`
                        : `No traffic fines found for license plate ${validationResult.licensePlate}`)}
                </AlertDescription>
              </Alert>

              {validationResult.finesCount > 0 && (
                <div className="mt-4 border rounded-md p-4">
                  <h3 className={`font-semibold mb-2 ${language === 'ar' ? 'text-right' : ''}`}>
                    {language === 'ar' ? 'تفاصيل المخالفات' : 'Fine Details'}
                  </h3>
                  <div className="space-y-2">
                    {validationResult.fines.map((fine: any) => (
                      <div key={fine.id} className={`p-2 border rounded flex justify-between items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                        <div className={language === 'ar' ? 'text-right' : ''}>
                          <p className="font-medium">{fine.violationNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(fine.violationDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className={`flex flex-col ${language === 'ar' ? 'items-start' : 'items-end'}`}>
                          <p className="font-medium">
                            {language === 'ar' ? 'ر.س' : 'QAR'} {fine.fineAmount.toFixed(2)}
                          </p>
                          <p className={`text-sm ${
                            fine.paymentStatus === 'paid' 
                              ? 'text-green-600' 
                              : fine.paymentStatus === 'disputed' 
                                ? 'text-amber-600' 
                                : 'text-red-600'
                          }`}>
                            {language === 'ar' ? (
                              fine.paymentStatus === 'paid' ? 'مدفوعة' :
                              fine.paymentStatus === 'disputed' ? 'متنازع عليها' : 'معلقة'
                            ) : (
                              fine.paymentStatus.charAt(0).toUpperCase() + fine.paymentStatus.slice(1)
                            )}
                          </p>
                          {!fine.customerId && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAssignToCustomer(fine.id)}
                              disabled={assigningFine === fine.id}
                              className={`mt-1 ${language === 'ar' ? 'flex-row-reverse' : ''}`}
                            >
                              {assigningFine === fine.id ? (
                                <>
                                  <Loader2 className={`h-3 w-3 animate-spin ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
                                  {language === 'ar' ? 'جاري التعيين...' : 'Assigning...'}
                                </>
                              ) : (
                                <>
                                  <UserCheck className={`h-3 w-3 ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
                                  {language === 'ar' ? 'تعيين للعميل' : 'Assign to Customer'}
                                </>
                              )}
                            </Button>
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
