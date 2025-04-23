
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LegalCaseType, LegalCaseStatus, CasePriority } from '@/types/legal-case';
import { useLegalCases } from '@/hooks/legal/useLegalCases';
import { CustomerInfo } from '@/types/customer';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CustomerSelector from '@/components/customers/CustomerSelector';

const formSchema = z.object({
  customer_id: z.string().min(1, "Customer is required"),
  case_type: z.nativeEnum(LegalCaseType),
  status: z.nativeEnum(LegalCaseStatus).optional().nullable(),
  priority: z.nativeEnum(CasePriority).optional().nullable(),
  amount_owed: z.number().nonnegative().optional(),
  assigned_to: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

const NewLegalCase = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createLegalCase, caseTypes, caseStatuses, casePriorities } = useLegalCases();
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerInfo | null>(null);
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer_id: '',
      case_type: LegalCaseType.PAYMENT_DEFAULT,
      status: LegalCaseStatus.ACTIVE,
      priority: CasePriority.MEDIUM,
      amount_owed: 0,
      assigned_to: null,
      description: null,
    },
  });

  const handleCustomerSelect = (customer: CustomerInfo) => {
    setSelectedCustomer(customer);
    form.setValue('customer_id', customer.id);
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      await createLegalCase({
        ...data,
        amount_owed: data.amount_owed || 0,
      });
      navigate('/legal');
    } catch (error) {
      console.error('Error creating legal case:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="customer_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <FormControl>
                      <CustomerSelector 
                        onCustomerSelect={handleCustomerSelect}
                        selectedCustomer={selectedCustomer}
                        inputClassName="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                          {caseTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </SelectItem>
                          ))}
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
                        defaultValue={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {caseStatuses.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status.replace(/\b\w/g, l => l.toUpperCase())}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {casePriorities.map((priority) => (
                            <SelectItem key={priority} value={priority}>
                              {priority.replace(/\b\w/g, l => l.toUpperCase())}
                            </SelectItem>
                          ))}
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
                  name="amount_owed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount Owed</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assigned_to"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigned To</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} />
                      </FormControl>
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        value={field.value || ''} 
                        rows={4} 
                        placeholder="Enter case description and details..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" type="button" onClick={() => navigate('/legal')}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Legal Case'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default NewLegalCase;
