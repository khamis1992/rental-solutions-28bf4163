
import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Calendar, Loader2 } from 'lucide-react';
import { useTrafficFines, TrafficFine } from '@/hooks/use-traffic-fines';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { formatLicensePlate, isValidLicensePlate } from '@/utils/format-utils';
import { 
  DialogContent, 
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle 
} from '@/components/ui/dialog';

// Define the schema for traffic fine entry form
const trafficFineSchema = z.object({
  violationNumber: z.string().min(1, 'Violation number is required'),
  licensePlate: z.string()
    .min(1, 'License plate is required')
    .transform(val => formatLicensePlate(val)) // Standardize format during validation
    .refine(val => isValidLicensePlate(val), { message: 'Invalid license plate format' }),
  violationDate: z.date({
    required_error: 'Violation date is required',
  }),
  fineAmount: z.coerce.number().min(0, 'Fine amount must be a positive number'),
  violationCharge: z.string().optional(),
  location: z.string().optional(),
  paymentStatus: z.enum(['pending', 'paid', 'disputed']).default('pending'),
});

type TrafficFineFormData = z.infer<typeof trafficFineSchema>;

interface TrafficFineEditDialogProps {
  trafficFine: TrafficFine | null;
  onSave: () => void;
  onCancel: () => void;
}

const TrafficFineEditDialog: React.FC<TrafficFineEditDialogProps> = ({ 
  trafficFine,
  onSave,
  onCancel
}) => {
  const { updateTrafficFine, validateLicensePlate } = useTrafficFines();
  const [validatingPlate, setValidatingPlate] = useState(false);
  const [plateValidationResult, setPlateValidationResult] = useState<{
    isValid: boolean;
    message: string;
    vehicle?: any;
  } | null>(null);

  const form = useForm<TrafficFineFormData>({
    resolver: zodResolver(trafficFineSchema),
    defaultValues: {
      violationNumber: trafficFine?.violationNumber || '',
      licensePlate: trafficFine?.licensePlate || '',
      violationDate: trafficFine?.violationDate ? new Date(trafficFine.violationDate) : new Date(),
      fineAmount: trafficFine?.fineAmount || 0,
      violationCharge: trafficFine?.violationCharge || '',
      location: trafficFine?.location || '',
      paymentStatus: (trafficFine?.paymentStatus as 'pending' | 'paid' | 'disputed') || 'pending',
    },
  });

  // Update form values when trafficFine changes
  useEffect(() => {
    if (trafficFine) {
      form.reset({
        violationNumber: trafficFine.violationNumber || '',
        licensePlate: trafficFine.licensePlate || '',
        violationDate: trafficFine.violationDate ? new Date(trafficFine.violationDate) : new Date(),
        fineAmount: trafficFine.fineAmount || 0,
        violationCharge: trafficFine.violationCharge || '',
        location: trafficFine.location || '',
        paymentStatus: (trafficFine.paymentStatus as 'pending' | 'paid' | 'disputed') || 'pending',
      });

      // Validate the license plate automatically if it exists
      if (trafficFine.licensePlate) {
        handleValidateLicensePlate(trafficFine.licensePlate);
      }
    }
  }, [trafficFine, form]);

  const licensePlateValue = form.watch('licensePlate');

  // Handle license plate validation
  const handleValidateLicensePlate = async (plateValue?: string) => {
    const plate = plateValue || form.getValues('licensePlate');
    if (!plate) return;
    
    setValidatingPlate(true);
    setPlateValidationResult(null);
    
    try {
      const result = await validateLicensePlate(plate);
      setPlateValidationResult(result);
    } catch (error) {
      console.error('Error validating license plate:', error);
      toast.error('Failed to validate license plate');
    } finally {
      setValidatingPlate(false);
    }
  };

  // Handle license plate input blur
  const handleLicensePlateBlur = () => {
    if (licensePlateValue) {
      handleValidateLicensePlate();
    }
  };

  const onSubmit = async (data: TrafficFineFormData) => {
    if (!trafficFine?.id) {
      toast.error("No fine ID found for update");
      return;
    }

    try {
      await updateTrafficFine.mutate({
        id: trafficFine.id,
        violationNumber: data.violationNumber,
        licensePlate: data.licensePlate,
        violationDate: data.violationDate,
        fineAmount: data.fineAmount,
        violationCharge: data.violationCharge || '',
        location: data.location || '',
        paymentStatus: data.paymentStatus
      }, {
        onSuccess: () => {
          toast.success("Traffic fine updated successfully");
          setPlateValidationResult(null);
          onSave();
        }
      });
    } catch (error) {
      toast.error("Failed to update traffic fine", {
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    }
  };

  return (
    <DialogContent className="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>Edit Traffic Fine</DialogTitle>
        <DialogDescription>
          Update the details of the traffic fine
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="violationNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Violation Number</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., TF-12345" />
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
                  <div className="flex gap-2">
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="e.g., ABC123" 
                        onBlur={handleLicensePlateBlur}
                      />
                    </FormControl>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => handleValidateLicensePlate()}
                      disabled={!licensePlateValue || validatingPlate}
                    >
                      {validatingPlate ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Validate'
                      )}
                    </Button>
                  </div>
                  {plateValidationResult && (
                    <Alert 
                      variant={plateValidationResult.isValid ? "default" : "destructive"} 
                      className="mt-2"
                    >
                      <AlertTitle>
                        {plateValidationResult.isValid ? 'Valid License Plate' : 'Invalid License Plate'}
                      </AlertTitle>
                      <AlertDescription>
                        {plateValidationResult.message}
                        {plateValidationResult.isValid && plateValidationResult.vehicle && (
                          <div className="mt-1">
                            Vehicle: {plateValidationResult.vehicle.make} {plateValidationResult.vehicle.model}
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                  <FormDescription>
                    License plate is required to match the fine to a vehicle
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <Calendar className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
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
                  <FormLabel>Fine Amount</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0" 
                      step="0.01" 
                      {...field} 
                      placeholder="0.00" 
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
              name="violationCharge"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Violation Charge</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Speeding" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="disputed">Disputed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Enter violation location details" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="ml-2"
              disabled={updateTrafficFine.isPending}
            >
              {updateTrafficFine.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Traffic Fine'
              )}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export default TrafficFineEditDialog;
