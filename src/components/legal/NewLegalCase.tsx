
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Loader2, Save, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Define schema for form validation
const newCaseSchema = z.object({
  title: z.string().min(1, { message: 'Case title is required' }),
  description: z.string().min(1, { message: 'Case description is required' }),
  customer_id: z.string().uuid({ message: 'Customer ID must be a valid UUID' }),
  customer_name: z.string().min(1, { message: 'Customer name is required' }),
  case_type: z.enum(['contract_dispute', 'traffic_violation', 'insurance_claim', 'customer_complaint', 'other'], {
    required_error: 'Please select a case type',
  }),
  hearing_date: z.date().optional(),
  court_location: z.string().optional(),
  amount_claimed: z.number().min(0).optional(),
  status: z.enum(['pending', 'active', 'closed', 'settled'], {
    required_error: 'Please select a status',
  }).default('pending'),
});

type NewCaseFormValues = z.infer<typeof newCaseSchema>;

const NewLegalCase = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [customers, setCustomers] = React.useState<Array<{id: string, full_name: string}>>([]);
  const [loading, setLoading] = React.useState(true);

  // Initialize form with default values
  const form = useForm<NewCaseFormValues>({
    resolver: zodResolver(newCaseSchema),
    defaultValues: {
      title: '',
      description: '',
      customer_id: '',
      customer_name: '',
      case_type: 'contract_dispute',
      status: 'pending',
      amount_claimed: 0,
    },
  });

  // Fetch customers for dropdown
  React.useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name')
          .order('full_name');
          
        if (error) {
          throw error;
        }
        
        setCustomers(data || []);
      } catch (error) {
        console.error('Error fetching customers:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load customer data",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchCustomers();
  }, [toast]);

  // Handle customer selection
  const handleCustomerChange = (customerId: string) => {
    const selectedCustomer = customers.find(c => c.id === customerId);
    if (selectedCustomer) {
      form.setValue('customer_id', customerId);
      form.setValue('customer_name', selectedCustomer.full_name);
    }
  };

  // Submit the form
  const onSubmit = async (values: NewCaseFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Transform the form values to match database structure
      const caseData = {
        title: values.title,
        description: values.description,
        customer_id: values.customer_id,
        customer_name: values.customer_name,
        case_type: values.case_type,
        hearing_date: values.hearing_date ? values.hearing_date.toISOString() : null,
        court_location: values.court_location || null,
        amount_claimed: values.amount_claimed || 0,
        status: values.status,
      };
      
      // Insert new case into the database
      const { data, error } = await supabase
        .from('legal_cases')
        .insert(caseData)
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      toast({
        title: "Success",
        description: "Legal case created successfully",
      });
      
      // Navigate back to the case management
      navigate('/legal');
    } catch (error) {
      console.error('Error creating legal case:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create legal case: " + (error instanceof Error ? error.message : "Unknown error"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Create New Legal Case</CardTitle>
        <CardDescription>
          Enter the details to open a new legal case
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Case Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter case title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="case_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Case Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select case type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="contract_dispute">Contract Dispute</SelectItem>
                        <SelectItem value="traffic_violation">Traffic Violation</SelectItem>
                        <SelectItem value="insurance_claim">Insurance Claim</SelectItem>
                        <SelectItem value="customer_complaint">Customer Complaint</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Case Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Provide details about the case"
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
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
                    onValueChange={(value) => handleCustomerChange(value)} 
                    defaultValue={field.value}
                    disabled={loading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={loading ? "Loading customers..." : "Select customer"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                        <SelectItem value="settled">Settled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="amount_claimed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount Claimed</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="hearing_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Hearing Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
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
                    <FormDescription>
                      The scheduled date for the hearing (optional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="court_location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Court Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter court location (optional)" {...field} />
                    </FormControl>
                    <FormDescription>
                      Where the case will be heard (optional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/legal')}
              disabled={isSubmitting}
            >
              <X className="mr-2 h-4 w-4" /> Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Case
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default NewLegalCase;
