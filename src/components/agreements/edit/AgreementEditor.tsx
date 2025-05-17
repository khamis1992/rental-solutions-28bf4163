
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useAgreementService } from '@/hooks/services/useAgreementService';
import { LeaseStatus } from '@/types/lease-types';
import { Loader2 } from 'lucide-react';
import VehicleSelector from '../selectors/VehicleSelector';
import CustomerSelector from '../selectors/CustomerSelector';
import PaymentScheduleEditor from '../payments/PaymentScheduleEditor';
import AgreementTermsEditor from '../terms/AgreementTermsEditor';

// Define the validation schema
const agreementSchema = z.object({
  agreement_number: z.string().optional(),
  agreement_type: z.string().min(1, "Agreement type is required"),
  status: z.string().min(1, "Status is required"),
  customer_id: z.string().min(1, "Customer is required"),
  vehicle_id: z.string().min(1, "Vehicle is required"),
  start_date: z.date(),
  end_date: z.date(),
  total_amount: z.number().min(0, "Amount must be a positive number"),
  rent_amount: z.number().min(0, "Rent amount must be a positive number").optional(),
  payment_frequency: z.string().optional(),
  payment_day: z.number().min(1).max(31).optional(),
  notes: z.string().optional(),
  daily_late_fee: z.number().min(0).optional(),
  deposit_amount: z.number().min(0).optional(),
  terms_accepted: z.boolean().optional(),
  additional_drivers: z.array(z.string()).optional(),
});

const AgreementEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  
  const agreementService = useAgreementService();
  
  // Initialize form with default values
  const form = useForm<z.infer<typeof agreementSchema>>({
    resolver: zodResolver(agreementSchema),
    defaultValues: {
      agreement_number: '',
      agreement_type: 'rental',
      status: 'draft',
      customer_id: '',
      vehicle_id: '',
      start_date: new Date(),
      end_date: new Date(new Date().setDate(new Date().getDate() + 30)),
      total_amount: 0,
      rent_amount: 0,
      payment_frequency: 'monthly',
      payment_day: 1,
      notes: '',
      daily_late_fee: 0,
      deposit_amount: 0,
      terms_accepted: false,
      additional_drivers: [],
    },
  });
  
  // Load agreement data if editing
  useEffect(() => {
    const loadAgreement = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const agreement = await agreementService.getAgreementDetails(id);
        if (agreement) {
          // Format dates properly
          const startDate = agreement.start_date ? new Date(agreement.start_date) : new Date();
          const endDate = agreement.end_date ? new Date(agreement.end_date) : new Date();
          
          form.reset({
            agreement_number: agreement.agreement_number || '',
            agreement_type: agreement.agreement_type || 'rental',
            status: agreement.status || 'draft',
            customer_id: agreement.customer_id || '',
            vehicle_id: agreement.vehicle_id || '',
            start_date: startDate,
            end_date: endDate,
            total_amount: agreement.total_amount || 0,
            rent_amount: agreement.rent_amount || 0,
            payment_frequency: agreement.payment_frequency || 'monthly',
            payment_day: agreement.payment_day || 1,
            notes: agreement.notes || '',
            daily_late_fee: agreement.daily_late_fee || 0,
            deposit_amount: agreement.deposit_amount || 0,
            terms_accepted: agreement.terms_accepted || false,
            additional_drivers: agreement.additional_drivers || [],
          });
        }
      } catch (error) {
        console.error("Error loading agreement:", error);
        toast({
          title: "Error",
          description: "Failed to load agreement details",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAgreement();
  }, [id, agreementService, form, toast]);
  
  // Handle form submission
  const handleSubmitForm = async (formData: z.infer<typeof agreementSchema>) => {
    setIsLoading(true);
    try {
      const data = {
        ...formData,
        total_amount: formData.total_amount || 0,
        status: formData.status as LeaseStatus,
      };
      
      let result;
      if (id) {
        // Update existing agreement
        result = await agreementService.updateAgreement({
          id,
          data
        });      } else {
        // Create new agreement
        result = await agreementService.save(data);
      }
      
      if (result) {
        toast({
          title: "Success",
          description: id ? "Agreement updated successfully" : "Agreement created successfully",
        });
        navigate(`/agreements/${result.id || id}`);
      } else {
        throw new Error("Failed to save agreement");
      }
    } catch (error) {
      console.error("Error saving agreement:", error);
      toast({
        title: "Error",
        description: "Failed to save agreement",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Calculate total amount based on rent and duration
  const calculateTotalAmount = () => {
    const startDate = form.getValues('start_date');
    const endDate = form.getValues('end_date');
    const rentAmount = form.getValues('rent_amount') || 0;
    
    if (!startDate || !endDate || rentAmount <= 0) return;
    
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalAmount = days * (rentAmount / 30); // Approximate monthly to daily rate
    
    form.setValue('total_amount', parseFloat(totalAmount.toFixed(2)));
  };
  
  // Update total when dates or rent amount changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'start_date' || name === 'end_date' || name === 'rent_amount') {
        calculateTotalAmount();
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);
  
  if (isLoading && !form.formState.isSubmitting) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{id ? "Edit Agreement" : "Create New Agreement"}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="details">Agreement Details</TabsTrigger>
              <TabsTrigger value="payments">Payment Schedule</TabsTrigger>
              <TabsTrigger value="terms">Terms & Conditions</TabsTrigger>
            </TabsList>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmitForm)} className="space-y-6">
                <TabsContent value="details" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="agreement_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Agreement Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Auto-generated if left empty" {...field} />
                          </FormControl>
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
                                <SelectValue placeholder="Select agreement type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="rental">Rental</SelectItem>
                              <SelectItem value="lease">Lease</SelectItem>
                              <SelectItem value="finance">Finance</SelectItem>
                              <SelectItem value="subscription">Subscription</SelectItem>
                            </SelectContent>
                          </Select>
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
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
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
                          <FormControl>
                            <CustomerSelector 
                              value={field.value} 
                              onChange={field.onChange}
                            />
                          </FormControl>
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
                          <FormControl>
                            <VehicleSelector 
                              value={field.value} 
                              onChange={field.onChange}
                            />
                          </FormControl>
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
                          <FormControl>
                            <DatePicker
                              date={field.value}
                              setDate={field.onChange}
                            />
                          </FormControl>
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
                          <FormControl>
                            <DatePicker
                              date={field.value}
                              setDate={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="rent_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monthly Rent Amount</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0.00" 
                              {...field}
                              onChange={(e) => {
                                field.onChange(parseFloat(e.target.value) || 0);
                              }}
                            />
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
                          <FormLabel>Total Amount</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0.00" 
                              {...field}
                              onChange={(e) => {
                                field.onChange(parseFloat(e.target.value) || 0);
                              }}
                            />
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
                          <FormLabel>Security Deposit</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0.00" 
                              {...field}
                              onChange={(e) => {
                                field.onChange(parseFloat(e.target.value) || 0);
                              }}
                            />
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
                            <Input 
                              type="number" 
                              placeholder="0.00" 
                              {...field}
                              onChange={(e) => {
                                field.onChange(parseFloat(e.target.value) || 0);
                              }}
                            />
                          </FormControl>
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
                </TabsContent>
                
                <TabsContent value="payments">
                  <PaymentScheduleEditor 
                    agreementId={id}
                    startDate={form.getValues('start_date')}
                    endDate={form.getValues('end_date')}
                    rentAmount={form.getValues('rent_amount')}
                    paymentFrequency={form.getValues('payment_frequency')}
                    paymentDay={form.getValues('payment_day')}
                    onFrequencyChange={(value) => form.setValue('payment_frequency', value)}
                    onPaymentDayChange={(value) => form.setValue('payment_day', value)}
                  />
                </TabsContent>
                
                <TabsContent value="terms">
                  <AgreementTermsEditor 
                    termsAccepted={form.getValues('terms_accepted')}
                    onTermsAcceptedChange={(value) => form.setValue('terms_accepted', value)}
                    additionalDrivers={form.getValues('additional_drivers')}
                    onAdditionalDriversChange={(value) => form.setValue('additional_drivers', value)}
                  />
                </TabsContent>
                
                <div className="flex justify-end space-x-4 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate('/agreements')}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {id ? "Update Agreement" : "Create Agreement"}
                  </Button>
                </div>
              </form>
            </Form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgreementEditor;
