
import React, { useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, AlertTriangle, Car, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Define the form schema with Zod for validation
const fineFormSchema = z.object({
  violationNumber: z.string().min(3, { message: "Violation number must be at least 3 characters" }),
  licensePlate: z.string().min(2, { message: "License plate is required" }),
  violationDate: z.date({ required_error: "Violation date is required" }),
  fineAmount: z.coerce.number().positive({ message: "Fine amount must be positive" }),
  violationCharge: z.string().min(3, { message: "Violation charge is required" }),
  paymentStatus: z.enum(['pending', 'paid', 'disputed']),
  location: z.string().optional(),
});

type FineFormValues = z.infer<typeof fineFormSchema>;

interface TrafficFineEntryProps {
  onFineSaved?: () => void;
}

const TrafficFineEntry = ({ onFineSaved }: TrafficFineEntryProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableVehicles, setAvailableVehicles] = useState<{ license_plate: string; id: string }[]>([]);
  const [licensePlateInput, setLicensePlateInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Initialize the form
  const form = useForm<FineFormValues>({
    resolver: zodResolver(fineFormSchema),
    defaultValues: {
      violationNumber: '',
      licensePlate: '',
      violationDate: new Date(),
      fineAmount: undefined,
      violationCharge: '',
      paymentStatus: 'pending',
      location: '',
    },
  });
  
  // Handle license plate search
  const handleLicensePlateChange = async (value: string) => {
    setLicensePlateInput(value);
    form.setValue('licensePlate', value);
    
    if (value.length >= 2) {
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select('license_plate, id')
          .ilike('license_plate', `%${value}%`)
          .limit(5);
          
        if (error) throw error;
        
        setAvailableVehicles(data || []);
        setShowSuggestions(data && data.length > 0);
      } catch (error) {
        console.error('Error fetching vehicles:', error);
      }
    } else {
      setShowSuggestions(false);
    }
  };
  
  // Handle form submission
  const onSubmit = async (values: FineFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Find vehicle ID based on license plate
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select('id')
        .eq('license_plate', values.licensePlate)
        .single();
      
      if (vehicleError && vehicleError.code !== 'PGRST116') {
        throw new Error(`Error finding vehicle: ${vehicleError.message}`);
      }
      
      const vehicleId = vehicleData?.id;
      
      // Insert the traffic fine
      const { data, error } = await supabase
        .from('traffic_fines')
        .insert([
          {
            violation_number: values.violationNumber,
            license_plate: values.licensePlate,
            violation_date: values.violationDate.toISOString(),
            fine_amount: values.fineAmount,
            violation_charge: values.violationCharge,
            payment_status: values.paymentStatus,
            fine_location: values.location || null,
            vehicle_id: vehicleId || null,
            entry_type: 'manual',
          }
        ])
        .select()
        .single();
        
      if (error) {
        throw new Error(`Error saving traffic fine: ${error.message}`);
      }
      
      toast.success('Traffic fine recorded successfully', {
        description: `Violation #${values.violationNumber} has been added.`
      });
      
      // Reset form
      form.reset();
      
      // Call callback if provided
      if (onFineSaved) {
        onFineSaved();
      }
    } catch (error) {
      console.error('Error saving traffic fine:', error);
      toast.error('Failed to save traffic fine', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          Record New Traffic Fine
        </CardTitle>
        <CardDescription>
          Enter the details of the traffic violation to record it in the system
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
                    <FormLabel>Violation Number</FormLabel>
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
                  <FormItem className="relative">
                    <FormLabel>License Plate</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter license plate" 
                        value={licensePlateInput}
                        onChange={(e) => handleLicensePlateChange(e.target.value)}
                      />
                    </FormControl>
                    {showSuggestions && (
                      <div className="absolute z-10 w-full bg-white dark:bg-gray-900 border rounded-md shadow-lg mt-1">
                        {availableVehicles.map((vehicle) => (
                          <div 
                            key={vehicle.id} 
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer flex items-center"
                            onClick={() => {
                              setLicensePlateInput(vehicle.license_plate);
                              form.setValue('licensePlate', vehicle.license_plate);
                              setShowSuggestions(false);
                            }}
                          >
                            <Car className="h-4 w-4 mr-2 text-muted-foreground" />
                            {vehicle.license_plate}
                          </div>
                        ))}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="violationDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Violation Date</FormLabel>
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
                    <FormLabel>Fine Amount (QAR)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter fine amount" 
                        {...field} 
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
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
                  <FormItem className="col-span-1 md:col-span-2">
                    <FormLabel>Violation Charge</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter violation charge" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem className="col-span-1 md:col-span-2">
                    <FormLabel>Location (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter location of violation" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="paymentStatus"
                render={({ field }) => (
                  <FormItem className="col-span-1 md:col-span-2">
                    <FormLabel>Payment Status</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-6"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="pending" />
                          </FormControl>
                          <FormLabel className="font-normal flex items-center">
                            <X className="h-4 w-4 mr-1 text-red-500" /> Pending
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="paid" />
                          </FormControl>
                          <FormLabel className="font-normal flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1 text-green-500" /> Paid
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="disputed" />
                          </FormControl>
                          <FormLabel className="font-normal flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-1 text-amber-500" /> Disputed
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <CardFooter className="flex justify-end gap-2 px-0">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onFineSaved ? onFineSaved() : form.reset()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Traffic Fine"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default TrafficFineEntry;
