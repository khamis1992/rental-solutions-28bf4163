import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Agreement, LeaseStatus, PaymentStatus } from '@/types/agreement';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { useCustomers } from '@/hooks/use-customers';
import { useVehicles } from '@/hooks/use-vehicles';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

// Create a schema for agreement validation
const agreementSchema = z.object({
  agreement_number: z.string().min(1, 'Agreement number is required'),
  customer_id: z.string().min(1, 'Customer is required'),
  vehicle_id: z.string().min(1, 'Vehicle is required'),
  status: z.string().min(1, 'Status is required'),
  start_date: z.date({
    required_error: "Start date is required",
  }),
  end_date: z.date({
    required_error: "End date is required",
  }),
  rent_amount: z.coerce.number().min(0, 'Rent amount must be a positive number'),
  total_amount: z.coerce.number().min(0, 'Total amount must be a positive number'),
  notes: z.string().optional(),
  rent_due_day: z.coerce.number().min(1, 'Due day must be between 1-31').max(31, 'Due day must be between 1-31').optional(),
  daily_late_fee: z.coerce.number().min(0, 'Late fee must be a positive number').optional(),
  security_deposit_amount: z.coerce.number().min(0, 'Security deposit must be a positive number').optional(),
  security_deposit_refunded: z.boolean().optional(),
  security_deposit_refund_date: z.date().optional().nullable(),
  security_deposit_notes: z.string().optional(),
  payment_schedule_type: z.enum(['monthly', 'custom']).optional(),
  terms_accepted: z.boolean().default(false),
});

type AgreementFormSchema = z.infer<typeof agreementSchema>;

interface AgreementFormProps {
  agreement: Agreement;
  onSubmit: (formData: Agreement) => Promise<void>;
  isSubmitting: boolean;
  mode: string;
}

const AgreementForm: React.FC<AgreementFormProps> = ({
  agreement,
  onSubmit,
  isSubmitting,
  mode
}) => {
  const [activeTab, setActiveTab] = useState('general');
  const { customers, isLoading: isLoadingCustomers } = useCustomers();
  const { useList: useVehiclesList } = useVehicles();
  const { data: vehicles = [], isLoading: isLoadingVehicles } = useVehiclesList({ status: 'available' });
  
  // Prepare default values from the agreement
  const defaultValues: Partial<AgreementFormSchema> = {
    agreement_number: agreement?.agreement_number || '',
    customer_id: agreement?.customer_id || '',
    vehicle_id: agreement?.vehicle_id || '',
    status: agreement?.status || 'pending',
    start_date: agreement?.start_date ? new Date(agreement.start_date) : new Date(),
    end_date: agreement?.end_date ? new Date(agreement.end_date) : new Date(),
    rent_amount: agreement?.rent_amount || 0,
    total_amount: agreement?.total_amount || 0,
    notes: agreement?.notes || '',
    rent_due_day: agreement?.rent_due_day || 1,
    daily_late_fee: agreement?.daily_late_fee || 0,
    security_deposit_amount: agreement?.security_deposit_amount || agreement?.deposit_amount || 0,
    security_deposit_refunded: agreement?.security_deposit_refunded || false,
    security_deposit_refund_date: agreement?.security_deposit_refund_date ? new Date(agreement.security_deposit_refund_date) : null,
    security_deposit_notes: agreement?.security_deposit_notes || '',
    payment_schedule_type: agreement?.payment_schedule_type || 'monthly',
    terms_accepted: agreement?.terms_accepted || false,
  };

  const form = useForm<AgreementFormSchema>({
    resolver: zodResolver(agreementSchema),
    defaultValues,
    mode: 'onChange'
  });

  // Update form when agreement changes
  useEffect(() => {
    if (agreement) {
      form.reset({
        agreement_number: agreement.agreement_number || '',
        customer_id: agreement.customer_id || '',
        vehicle_id: agreement.vehicle_id || '',
        status: agreement.status || 'pending',
        start_date: agreement.start_date ? new Date(agreement.start_date) : new Date(),
        end_date: agreement.end_date ? new Date(agreement.end_date) : new Date(),
        rent_amount: agreement.rent_amount || 0,
        total_amount: agreement.total_amount || 0,
        notes: agreement.notes || '',
        rent_due_day: agreement.rent_due_day || 1,
        daily_late_fee: agreement.daily_late_fee || 0,
        security_deposit_amount: agreement.security_deposit_amount || agreement.deposit_amount || 0,
        security_deposit_refunded: agreement.security_deposit_refunded || false,
        security_deposit_refund_date: agreement.security_deposit_refund_date ? new Date(agreement.security_deposit_refund_date) : null,
        security_deposit_notes: agreement.security_deposit_notes || '',
        payment_schedule_type: agreement.payment_schedule_type || 'monthly',
        terms_accepted: agreement.terms_accepted || false,
      });
    }
  }, [agreement, form]);

  // Calculate total amount when rent amount changes
  useEffect(() => {
    const rentAmount = form.watch('rent_amount');
    const startDate = form.watch('start_date');
    const endDate = form.watch('end_date');
    
    if (rentAmount && startDate && endDate) {
      // Calculate months between dates (simplified)
      const months = Math.ceil((endDate.getTime() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000));
      const totalAmount = rentAmount * Math.max(1, months);
      form.setValue('total_amount', totalAmount);
    }
  }, [form.watch('rent_amount'), form.watch('start_date'), form.watch('end_date'), form]);

  const handleFormSubmit = async (data: AgreementFormSchema) => {
    try {
      // Combine form data with existing agreement data
      const formData: Agreement = {
        ...agreement,
        ...data,
        // Convert dates to ISO strings for API
        start_date: data.start_date.toISOString(),
        end_date: data.end_date.toISOString(),
        security_deposit_refund_date: data.security_deposit_refund_date ? data.security_deposit_refund_date.toISOString() : undefined,
      };
      
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="general">General Information</TabsTrigger>
            <TabsTrigger value="payment">Payment Details</TabsTrigger>
            <TabsTrigger value="terms">Terms & Conditions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Agreement Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="agreement_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agreement Number</FormLabel>
                        <FormControl>
                          <Input placeholder="AGR-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="pending_payment">Pending Payment</SelectItem>
                            <SelectItem value="pending_deposit">Pending Deposit</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="terminated">Terminated</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="customer_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select customer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingCustomers ? (
                              <SelectItem value="loading">Loading...</SelectItem>
                            ) : (
                              customers?.map((customer) => (
                                <SelectItem key={customer.id} value={customer.id}>
                                  {customer.full_name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="vehicle_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehicle</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select vehicle" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingVehicles ? (
                              <SelectItem value="loading">Loading...</SelectItem>
                            ) : (
                              vehicles?.map((vehicle) => (
                                <SelectItem key={vehicle.id} value={vehicle.id}>
                                  {vehicle.make} {vehicle.model} ({vehicle.license_plate})
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
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
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                              disabled={(date) => date < form.watch('start_date')}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
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
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
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
                    name="total_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Contract Amount</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} readOnly />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="rent_due_day"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rent Due Day (1-31)</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} max={31} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="daily_late_fee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Daily Late Fee</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <Separator className="my-4" />
                
                <h3 className="text-lg font-medium">Security Deposit</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="security_deposit_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Security Deposit Amount</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="security_deposit_refunded"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Deposit Refunded</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  {form.watch('security_deposit_refunded') && (
                    <FormField
                      control={form.control}
                      name="security_deposit_refund_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Refund Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value || undefined}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <FormField
                    control={form.control}
                    name="security_deposit_notes"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Security Deposit Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Notes about security deposit" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <Separator className="my-4" />
                
                <FormField
                  control={form.control}
                  name="payment_schedule_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Schedule Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment schedule type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="terms">
            <Card>
              <CardHeader>
                <CardTitle>Terms & Conditions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-md border text-sm">
                  <h3 className="font-medium mb-2">Agreement Terms</h3>
                  <p className="mb-2">
                    This Rental Agreement ("Agreement") is made and entered into between the Lessor and Lessee identified above.
                    The Lessor agrees to rent to Lessee and Lessee agrees to rent from Lessor the vehicle described above
                    subject to the following terms and conditions:
                  </p>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Lessee shall pay the rental fee as specified in this Agreement.</li>
                    <li>Lessee shall maintain the vehicle in good condition and return it in the same condition as received.</li>
                    <li>Lessee shall be responsible for all damages to the vehicle during the rental period.</li>
                    <li>Lessee shall not use the vehicle for illegal purposes or in violation of any laws.</li>
                    <li>Lessee shall not sublet or loan the vehicle to any other person without Lessor's written consent.</li>
                    <li>Lessor may terminate this Agreement at any time if Lessee breaches any term of this Agreement.</li>
                    <li>Lessee shall pay a late fee as specified in this Agreement for any late payments.</li>
                    <li>The security deposit shall be refunded to Lessee upon return of the vehicle in good condition.</li>
                  </ol>
                </div>
                
                <FormField
                  control={form.control}
                  name="terms_accepted"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          I accept the terms and conditions of this agreement
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => window.history.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !form.formState.isValid}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'edit' ? 'Update Agreement' : 'Create Agreement'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AgreementForm;
