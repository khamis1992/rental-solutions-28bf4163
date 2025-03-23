
import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { agreementSchema } from "@/lib/validation-schemas/agreement";

// Interface for the form props
interface AgreementFormProps {
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
  initialData?: any;
}

// Custom form schema based on the agreement schema
const formSchema = z.object({
  agreement_number: z.string().min(1, "Agreement number is required"),
  start_date: z.date(),
  end_date: z.date(),
  customer_id: z.string().min(1, "Customer is required"),
  vehicle_id: z.string().min(1, "Vehicle is required"),
  status: z.enum(["draft", "active", "pending", "expired", "cancelled", "closed"]),
  rent_amount: z.number().positive("Rent amount must be positive"),
  deposit_amount: z.number().nonnegative("Deposit amount must be non-negative"),
  total_amount: z.number().positive("Total amount must be positive"),
  daily_late_fee: z.number().nonnegative("Daily late fee must be non-negative"),
  agreement_duration: z.string().optional(),
  notes: z.string().optional(),
  terms_accepted: z.boolean().default(false),
});

const AgreementForm = ({
  onSubmit,
  isSubmitting,
  initialData,
}: AgreementFormProps) => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [durationMonths, setDurationMonths] = useState<number>(12);

  // Generate a unique agreement number
  const generateAgreementNumber = () => {
    const prefix = "AGR";
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    return `${prefix}-${timestamp}-${random}`;
  };

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      agreement_number: generateAgreementNumber(),
      start_date: new Date(),
      end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      status: "draft" as const,
      rent_amount: 0,
      deposit_amount: 0,
      total_amount: 0,
      daily_late_fee: 120, // Default daily late fee
      agreement_duration: "12 months",
      notes: "",
      terms_accepted: false,
    },
  });

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("role", "customer");

        if (error) {
          throw error;
        }

        setCustomers(data || []);
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };

    fetchCustomers();
  }, []);

  // Fetch vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const { data, error } = await supabase
          .from("vehicles")
          .select("*")
          .eq("status", "available");

        if (error) {
          throw error;
        }

        setVehicles(data || []);
      } catch (error) {
        console.error("Error fetching vehicles:", error);
      }
    };

    fetchVehicles();
  }, []);

  // Handle customer selection
  const handleCustomerChange = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", customerId)
        .single();

      if (error) {
        throw error;
      }

      setSelectedCustomer(data);
      
      // Auto-fill customer fields in template (if needed)
      // This data will be used in the final form submission
    } catch (error) {
      console.error("Error fetching customer details:", error);
    }
  };

  // Handle vehicle selection
  const handleVehicleChange = async (vehicleId: string) => {
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("id", vehicleId)
        .single();

      if (error) {
        throw error;
      }

      setSelectedVehicle(data);
      
      // Auto-fill vehicle fields and suggested rent amount
      form.setValue("rent_amount", data.rent_amount || 0);
      calculateTotalAmount(data.rent_amount || 0, form.getValues("deposit_amount"));
    } catch (error) {
      console.error("Error fetching vehicle details:", error);
    }
  };

  // Update end date based on start date and duration
  const updateEndDate = (startDate: Date, months: number) => {
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + months);
    form.setValue("end_date", endDate);
    form.setValue("agreement_duration", `${months} months`);
    
    // Recalculate total amount
    calculateTotalAmount(form.getValues("rent_amount"), form.getValues("deposit_amount"));
  };

  // Calculate total amount
  const calculateTotalAmount = (rentAmount: number, depositAmount: number) => {
    const months = durationMonths || 12;
    const total = (rentAmount * months) + depositAmount;
    form.setValue("total_amount", total);
  };

  // Handle form submission
  const handleFormSubmit = (data: z.infer<typeof formSchema>) => {
    // Prepare final data for submission
    const finalData = {
      ...data,
      customer_data: selectedCustomer,
      vehicle_data: selectedVehicle,
    };
    
    onSubmit(finalData);
  };

  // Watch fields for changes
  const startDate = form.watch("start_date");
  const rentAmount = form.watch("rent_amount");
  const depositAmount = form.watch("deposit_amount");

  // Update total amount when relevant fields change
  useEffect(() => {
    calculateTotalAmount(rentAmount, depositAmount);
  }, [rentAmount, depositAmount, durationMonths]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Agreement Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Agreement Details</h3>
            
            {/* Agreement Number */}
            <FormField
              control={form.control}
              name="agreement_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agreement Number</FormLabel>
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Start Date */}
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
                        onSelect={(date) => {
                          field.onChange(date);
                          if (date) {
                            updateEndDate(date, durationMonths);
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Duration */}
            <FormItem>
              <FormLabel>Duration (Months)</FormLabel>
              <Select 
                value={durationMonths.toString()} 
                onValueChange={(value) => {
                  const months = parseInt(value);
                  setDurationMonths(months);
                  updateEndDate(form.getValues("start_date"), months);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 3, 6, 12, 24, 36].map((month) => (
                    <SelectItem key={month} value={month.toString()}>
                      {month} {month === 1 ? "month" : "months"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
            
            {/* End Date */}
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
                        disabled={(date) => date < form.getValues("start_date")}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Agreement Status */}
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
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Customer & Vehicle Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Customer & Vehicle</h3>
            
            {/* Customer Selection */}
            <FormField
              control={form.control}
              name="customer_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleCustomerChange(value);
                    }} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
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
            
            {/* Customer Information Display */}
            {selectedCustomer && (
              <div className="bg-muted p-3 rounded-md text-sm">
                <p><strong>Email:</strong> {selectedCustomer.email}</p>
                <p><strong>Phone:</strong> {selectedCustomer.phone_number}</p>
                <p><strong>Driver License:</strong> {selectedCustomer.driver_license}</p>
                <p><strong>Nationality:</strong> {selectedCustomer.nationality}</p>
              </div>
            )}
            
            {/* Vehicle Selection */}
            <FormField
              control={form.control}
              name="vehicle_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleVehicleChange(value);
                    }} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select vehicle" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {vehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.make} {vehicle.model} ({vehicle.license_plate})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Vehicle Information Display */}
            {selectedVehicle && (
              <div className="bg-muted p-3 rounded-md text-sm">
                <p><strong>Make:</strong> {selectedVehicle.make}</p>
                <p><strong>Model:</strong> {selectedVehicle.model}</p>
                <p><strong>License Plate:</strong> {selectedVehicle.license_plate}</p>
                <p><strong>VIN:</strong> {selectedVehicle.vin}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Payment Information */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-lg font-medium">Payment Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Rent Amount */}
            <FormField
              control={form.control}
              name="rent_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Rent Amount</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Deposit Amount */}
            <FormField
              control={form.control}
              name="deposit_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deposit Amount</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Daily Late Fee */}
            <FormField
              control={form.control}
              name="daily_late_fee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Daily Late Fee</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Total Contract Amount */}
          <FormField
            control={form.control}
            name="total_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Contract Amount</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    disabled 
                    className="font-bold"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Notes */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <textarea 
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Agreement Template Preview */}
        {(selectedCustomer && selectedVehicle) && (
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-medium">Agreement Preview</h3>
            <div className="bg-muted p-4 rounded-md text-sm">
              <h4 className="font-bold text-center text-base mb-4">VEHICLE RENTAL AGREEMENT</h4>
              <p className="mb-2">
                <strong>Agreement Number:</strong> {form.getValues("agreement_number")}
              </p>
              <p className="mb-2">
                <strong>Date:</strong> {format(form.getValues("start_date"), "PPP")}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                <div className="border-b pb-2">
                  <h5 className="font-semibold">CUSTOMER INFORMATION</h5>
                  <p><strong>Name:</strong> {selectedCustomer.full_name}</p>
                  <p><strong>ID/Driver License:</strong> {selectedCustomer.driver_license}</p>
                  <p><strong>Nationality:</strong> {selectedCustomer.nationality}</p>
                  <p><strong>Email:</strong> {selectedCustomer.email}</p>
                  <p><strong>Phone:</strong> {selectedCustomer.phone_number}</p>
                </div>
                
                <div className="border-b pb-2">
                  <h5 className="font-semibold">VEHICLE INFORMATION</h5>
                  <p><strong>Make:</strong> {selectedVehicle.make}</p>
                  <p><strong>Model:</strong> {selectedVehicle.model}</p>
                  <p><strong>License Plate:</strong> {selectedVehicle.license_plate}</p>
                  <p><strong>VIN:</strong> {selectedVehicle.vin}</p>
                </div>
              </div>
              
              <div className="border-b pb-2 mb-2">
                <h5 className="font-semibold">AGREEMENT TERMS</h5>
                <p><strong>Start Date:</strong> {format(form.getValues("start_date"), "PPP")}</p>
                <p><strong>End Date:</strong> {format(form.getValues("end_date"), "PPP")}</p>
                <p><strong>Duration:</strong> {form.getValues("agreement_duration")}</p>
                <p><strong>Monthly Rent:</strong> {form.getValues("rent_amount")} QAR</p>
                <p><strong>Security Deposit:</strong> {form.getValues("deposit_amount")} QAR</p>
                <p><strong>Daily Late Fee:</strong> {form.getValues("daily_late_fee")} QAR</p>
                <p><strong>Total Contract Value:</strong> {form.getValues("total_amount")} QAR</p>
              </div>
              
              <p className="italic text-xs">
                * This is a preview of the agreement. The final document will include complete terms and conditions.
              </p>
            </div>
          </div>
        )}
        
        {/* Submit Button */}
        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full md:w-auto"
          >
            {isSubmitting ? "Creating Agreement..." : "Create Agreement"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AgreementForm;
