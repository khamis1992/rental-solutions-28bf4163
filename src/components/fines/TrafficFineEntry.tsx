
import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useTrafficFines } from "@/hooks/use-traffic-fines";
import { useVehicles } from "@/hooks/use-vehicles";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define validation schema
const trafficFineSchema = z.object({
  violationNumber: z.string().optional(),
  licensePlate: z.string().min(1, { message: "License plate is required" }),
  violationDate: z.date({
    required_error: "Violation date is required",
  }),
  fineAmount: z.coerce.number({
    required_error: "Fine amount is required",
    invalid_type_error: "Fine amount must be a number",
  }).min(0, { message: "Fine amount must be non-negative" }),
  violationCharge: z.string().min(1, { message: "Violation charge is required" }),
  location: z.string().optional(),
  paymentStatus: z.string().default("pending"),
  notes: z.string().optional(),
  serialNumber: z.string().optional(),
});

type TrafficFineFormValues = z.infer<typeof trafficFineSchema>;

interface TrafficFineEntryProps {
  onFineSaved: () => void;
}

const TrafficFineEntry: React.FC<TrafficFineEntryProps> = ({ onFineSaved }) => {
  const { toast } = useToast();
  const { addTrafficFine } = useTrafficFines();
  const { useList: useVehiclesList } = useVehicles();
  const { data: vehicles, isLoading: isLoadingVehicles } = useVehiclesList();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize form with default values
  const form = useForm<TrafficFineFormValues>({
    resolver: zodResolver(trafficFineSchema),
    defaultValues: {
      violationNumber: "",
      licensePlate: "",
      violationDate: new Date(),
      fineAmount: 0,
      violationCharge: "",
      location: "",
      paymentStatus: "pending",
      notes: "",
      serialNumber: "",
    },
  });
  
  const onSubmit = async (data: TrafficFineFormValues) => {
    setIsSubmitting(true);
    try {
      // Find vehicle ID based on license plate
      const vehicle = vehicles?.find(v => v.license_plate === data.licensePlate);
      
      await addTrafficFine.mutateAsync({
        violationNumber: data.violationNumber || undefined,
        licensePlate: data.licensePlate,
        violationDate: data.violationDate,
        fineAmount: data.fineAmount,
        violationCharge: data.violationCharge,
        location: data.location || undefined,
        paymentStatus: data.paymentStatus as any,
        notes: data.notes || undefined,
        serialNumber: data.serialNumber || undefined,
        vehicleId: vehicle?.id,
      });
      
      toast({
        title: "Fine recorded successfully",
        description: "The traffic fine has been added to the system.",
      });
      
      form.reset();
      onFineSaved();
    } catch (error) {
      console.error("Failed to create traffic fine:", error);
      toast({
        title: "Error",
        description: "Failed to record the traffic fine. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* License Plate */}
              <FormField
                control={form.control}
                name="licensePlate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>License Plate *</FormLabel>
                    <Select
                      disabled={isSubmitting || isLoadingVehicles}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a license plate" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vehicles?.map(vehicle => (
                          <SelectItem 
                            key={vehicle.id} 
                            value={vehicle.license_plate || ''}
                          >
                            {vehicle.license_plate} ({vehicle.make} {vehicle.model})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Violation Date */}
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
                            disabled={isSubmitting}
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
              
              {/* Fine Amount */}
              <FormField
                control={form.control}
                name="fineAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fine Amount *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0.00"
                        type="number"
                        step="0.01"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Violation Charge */}
              <FormField
                control={form.control}
                name="violationCharge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Violation Charge *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter violation charge"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Violation Number */}
              <FormField
                control={form.control}
                name="violationNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Violation Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter violation number"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Location */}
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter location"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Serial Number */}
              <FormField
                control={form.control}
                name="serialNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serial Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter serial number"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Payment Status */}
              <FormField
                control={form.control}
                name="paymentStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Status</FormLabel>
                    <Select
                      disabled={isSubmitting}
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
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="disputed">Disputed</SelectItem>
                        <SelectItem value="waived">Waived</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter any additional notes"
                      className="min-h-32"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onFineSaved}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Fine"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default TrafficFineEntry;
