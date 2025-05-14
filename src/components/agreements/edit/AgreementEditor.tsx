import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Agreement } from '@/types/agreement';
import { CustomerInfo } from '@/types/customer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { Checkbox } from '@/components/ui/checkbox';
import { useAgreementService } from '@/hooks/services/useAgreementService';
import { AgreementStatus } from '@/types/agreement-types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingButton } from '@/components/ui/loading-button';

interface AgreementEditorProps {
  agreement: Agreement;
  id: string;
  userId: string;
  vehicleData: any;
  customerData?: CustomerInfo;
}

// Define the form schema using zod
const formSchema = z.object({
  status: z.string(),
  start_date: z.date(),
  end_date: z.date(),
  rent_amount: z.coerce.number().min(0, "Rent amount must be positive"),
  deposit_amount: z.coerce.number().min(0, "Deposit amount must be positive").optional(),
  payment_frequency: z.string().optional(),
  payment_day: z.coerce.number().min(1).max(31).optional(),
  notes: z.string().optional(),
  terms_accepted: z.boolean().optional(),
  daily_late_fee: z.coerce.number().min(0).optional(),
  agreement_type: z.string().optional(),
  agreement_number: z.string().optional(),
});

const AgreementEditor = ({
  agreement,
  id,
  userId,
  vehicleData,
  customerData
}: AgreementEditorProps) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("basic");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateAgreement } = useAgreementService();

  // Initialize the form with agreement data
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: agreement.status || 'active',
      start_date: agreement.start_date ? new Date(agreement.start_date) : new Date(),
      end_date: agreement.end_date ? new Date(agreement.end_date) : new Date(),
      rent_amount: agreement.rent_amount || 0,
      deposit_amount: agreement.deposit_amount || 0,
      payment_frequency: agreement.payment_frequency || 'monthly',
      payment_day: agreement.payment_day || 1,
      notes: agreement.notes || '',
      terms_accepted: agreement.terms_accepted || false,
      daily_late_fee: agreement.daily_late_fee || 120,
      agreement_type: agreement.agreement_type || 'standard',
      agreement_number: agreement.agreement_number || '',
    },
  });

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      // Prepare the data for update
      const updatedAgreement = {
        ...agreement,
        ...values,
        updated_at: new Date().toISOString(),
      };

      // Update the agreement
      await updateAgreement({
        id,
        data: updatedAgreement,
      });

      toast.success("Agreement updated successfully");
      navigate(`/agreements/${id}`);
    } catch (error) {
      console.error("Error updating agreement:", error);
      toast.error("Failed to update agreement");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate total amount when rent amount or dates change
  useEffect(() => {
    const startDate = form.watch('start_date');
    const endDate = form.watch('end_date');
    const rentAmount = form.watch('rent_amount');

    if (startDate && endDate && rentAmount) {
      // Calculate months between dates
      const start = new Date(startDate);
      const end = new Date(endDate);
      const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      
      // Update total amount field if it exists
      if (months > 0) {
        const totalAmount = months * rentAmount;
        // We don't set this directly in the form as it might not be part of the form schema
        // This would typically update a display value or be saved separately
      }
    }
  }, [form.watch('start_date'), form.watch('end_date'), form.watch('rent_amount')]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Agreement {agreement.agreement_number}</CardTitle>
          <CardDescription>
            Update the details of this rental agreement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Information</TabsTrigger>
              <TabsTrigger value="payment">Payment Details</TabsTrigger>
              <TabsTrigger value="terms">Terms & Conditions</TabsTrigger>
            </TabsList>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-6">
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                              <SelectItem value="expired">Expired</SelectItem>
                              <SelectItem value="draft">Draft</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="agreement_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Agreement Type</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="standard">Standard</SelectItem>
                              <SelectItem value="corporate">Corporate</SelectItem>
                              <SelectItem value="special">Special</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="start_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Start Date</FormLabel>
                          <DatePicker
                            date={field.value}
                            setDate={field.onChange}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="end_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>End Date</FormLabel>
                          <DatePicker
                            date={field.value}
                            setDate={field.onChange}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="agreement_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agreement Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Agreement number" {...field} />
                        </FormControl>
                        <FormDescription>
                          A unique identifier for this agreement
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Additional notes about this agreement" 
                            className="min-h-[100px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="payment" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="rent_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monthly Rent Amount</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="deposit_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Deposit Amount</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="payment_frequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Frequency</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="quarterly">Quarterly</SelectItem>
                              <SelectItem value="biannual">Bi-Annual</SelectItem>
                              <SelectItem value="annual">Annual</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="payment_day"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Day</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={1} 
                              max={31} 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Day of the month when payment is due
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="daily_late_fee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Daily Late Fee</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormDescription>
                          Amount charged per day for late payments
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="terms" className="space-y-4">
                  <Alert>
                    <AlertDescription>
                      These terms and conditions will be included in the agreement document.
                    </AlertDescription>
                  </Alert>

                  <div className="border rounded-md p-4 bg-muted/50">
                    <h3 className="font-medium mb-2">Standard Terms</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      The tenant agrees to pay rent on time and maintain the property in good condition.
                      Late payments will incur fees as specified in the agreement.
                    </p>
                    
                    <h3 className="font-medium mb-2">Damage Policy</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      The tenant is responsible for any damages beyond normal wear and tear.
                      The security deposit may be used to cover such damages.
                    </p>
                    
                    <h3 className="font-medium mb-2">Termination</h3>
                    <p className="text-sm text-muted-foreground">
                      Early termination of this agreement may result in penalties as outlined in the contract.
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="terms_accepted"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Terms and conditions accepted
                          </FormLabel>
                          <FormDescription>
                            Confirm that the customer has accepted the terms and conditions
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <Separator className="my-4" />

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(`/agreements/${id}`)}
                  >
                    Cancel
                  </Button>
                  
                  <LoadingButton
                    type="submit"
                    isLoading={isSubmitting}
                    loadingText="Saving..."
                  >
                    Save Changes
                  </LoadingButton>
                </div>
              </form>
            </Form>
          </Tabs>
        </CardContent>
        <CardFooter className="bg-muted/50 flex justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Last updated: {agreement.updated_at ? format(new Date(agreement.updated_at), 'PPpp') : 'Never'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              Customer: {customerData?.full_name || agreement.customers?.full_name || 'Unknown'}
            </p>
            <p className="text-sm text-muted-foreground">
              Vehicle: {vehicleData?.make} {vehicleData?.model} ({vehicleData?.license_plate || 'Unknown'})
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AgreementEditor;
