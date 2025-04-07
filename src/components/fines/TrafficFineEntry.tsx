
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, Loader2, SaveIcon } from 'lucide-react';
import { useTrafficFines } from '@/hooks/use-traffic-fines';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';

interface TrafficFineEntryProps {
  onFineSaved?: () => void;
}

const trafficFineSchema = z.object({
  violationNumber: z.string().min(1, { message: 'Violation number is required' }),
  licensePlate: z.string().min(1, { message: 'License plate is required' }),
  violationDate: z.date({
    required_error: 'Violation date is required',
  }),
  fineAmount: z.coerce.number().min(1, { message: 'Fine amount must be greater than 0' }),
  violationCharge: z.string().min(1, { message: 'Violation charge is required' }),
  location: z.string().optional(),
  violationDescription: z.string().optional()
});

type TrafficFineFormValues = z.infer<typeof trafficFineSchema>;

export default function TrafficFineEntry({ onFineSaved }: TrafficFineEntryProps) {
  const { addTrafficFine } = useTrafficFines();
  
  const form = useForm<TrafficFineFormValues>({
    resolver: zodResolver(trafficFineSchema),
    defaultValues: {
      violationNumber: '',
      licensePlate: '',
      violationDate: new Date(),
      fineAmount: 0,
      violationCharge: '',
      location: '',
      violationDescription: ''
    },
  });

  const onSubmit = async (data: TrafficFineFormValues) => {
    try {
      await addTrafficFine.mutateAsync({
        violationNumber: data.violationNumber,
        licensePlate: data.licensePlate,
        violationDate: data.violationDate,
        fineAmount: data.fineAmount,
        violationCharge: data.violationCharge,
        location: data.location,
      });
      
      form.reset();
      
      if (onFineSaved) {
        onFineSaved();
      }
    } catch (error) {
      console.error('Error adding traffic fine:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record New Traffic Fine</CardTitle>
        <CardDescription>
          Enter details of a new traffic fine to record in the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="violationNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Violation Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter violation number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="licensePlate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>License Plate *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter license plate" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter the vehicle's license plate
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="violationDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Violation Date *</FormLabel>
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
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
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
                name="fineAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fine Amount (QAR) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter fine amount"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="violationCharge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Violation Type *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter violation type"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      E.g. Speeding, Parking, Red Light
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter violation location"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Where did the violation occur?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="violationDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter any additional details about the violation"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit"
              className="w-full sm:w-auto"
              disabled={addTrafficFine.isPending}
            >
              {addTrafficFine.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Saving...
                </>
              ) : (
                <>
                  <SaveIcon className="mr-2 h-4 w-4" /> 
                  Save Traffic Fine
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
