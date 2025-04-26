import { useState, useEffect } from "react";
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
import { CalendarIcon, CheckCircle, InfoIcon, AlertCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { agreementSchema } from "@/lib/validation-schemas/agreement";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { checkVehicleAvailability } from "@/utils/agreement-utils";
import { VehicleAssignmentDialog } from "./VehicleAssignmentDialog";
import { toast } from "sonner";
import { Loader } from "@/components/ui/loader";
import { VehicleSearchCommandPalette } from "@/components/ui/vehicle-search-command-palette";

interface AgreementFormProps {
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
  initialData?: any;
  standardTemplateExists?: boolean;
  isCheckingTemplate?: boolean;
}

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

const AgreementFormWithVehicleCheck = ({
  onSubmit,
  isSubmitting,
  initialData,
  standardTemplateExists = true,
  isCheckingTemplate = false,
}: AgreementFormProps) => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [durationMonths, setDurationMonths] = useState<number>(12);
  const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false);
  const [vehicleAvailabilityResult, setVehicleAvailabilityResult] = useState<any>(null);
  const [isCheckingVehicle, setIsCheckingVehicle] = useState(false);
  const [isVehicleSearchOpen, setIsVehicleSearchOpen] = useState(false);

  const generateAgreementNumber = () => {
    const prefix = "AGR";
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    return `${prefix}-${timestamp}-${random}`;
  };

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
      daily_late_fee: 120,
      agreement_duration: "12 months",
      notes: "",
      terms_accepted: false,
    },
  });

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

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const { data, error } = await supabase
          .from("vehicles")
          .select("*");

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
    } catch (error) {
      console.error("Error fetching customer details:", error);
    }
  };

  const handleVehicleChange = async (vehicleId: string) => {
    setIsCheckingVehicle(true);
    try {
      const availabilityResult = await checkVehicleAvailability(vehicleId);
      setVehicleAvailabilityResult(availabilityResult);
      
      if (!availabilityResult.isAvailable && availabilityResult.existingAgreement) {
        setIsVehicleDialogOpen(true);
      }
      
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("id", vehicleId)
        .single();

      if (error) {
        throw error;
      }

      setSelectedVehicle(data);
      form.setValue("rent_amount", data.rent_amount || 0);
      calculateTotalAmount(data.rent_amount || 0, form.getValues("deposit_amount"));
    } catch (error) {
      console.error("Error checking vehicle availability:", error);
      toast.error("Error checking vehicle availability");
    } finally {
      setIsCheckingVehicle(false);
    }
  };

  const updateEndDate = (startDate: Date, months: number) => {
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + months);
    form.setValue("end_date", endDate);
    form.setValue("agreement_duration", `${months} months`);
    calculateTotalAmount(form.getValues("rent_amount"), form.getValues("deposit_amount"));
  };

  const calculateTotalAmount = (rentAmount: number, depositAmount: number) => {
    const months = durationMonths || 12;
    const total = (rentAmount * months) + depositAmount;
    form.setValue("total_amount", total);
  };

  const handleFormSubmit = (data: z.infer<typeof formSchema>) => {
    const finalData = {
      ...data,
      customer_data: selectedCustomer,
      vehicle_data: selectedVehicle,
      deposit_amount: data.deposit_amount,
      terms_accepted: true
    };
    
    onSubmit(finalData);
  };

  const handleVehicleConfirmation = () => {
    console.log("User confirmed vehicle reassignment");
  };

  const startDate = form.watch("start_date");
  const rentAmount = form.watch("rent_amount");
  const depositAmount = form.watch("deposit_amount");

  useEffect(() => {
    calculateTotalAmount(rentAmount, depositAmount);
  }, [rentAmount, depositAmount, durationMonths]);

  const renderTemplateStatus = () => {
    if (isCheckingTemplate) {
      return (
        <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-md border border-blue-200 flex items-center">
          <div className="w-8 h-8 rounded-full bg-blue-100 mr-3 flex items-center justify-center">
            <InfoIcon className="h-4 w-4 text-blue-500" />
          </div>
          <div>
            <p className="font-medium">Checking Template Status</p>
            <p className="text-sm">Verifying if the standard agreement template exists...</p>
          </div>
        </div>
      );
    }
    
    if (!standardTemplateExists) {
      return (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Template Not Found</AlertTitle>
          <AlertDescription>
            The standard agreement template "agreement temp" was not found in the database.
            The agreement will use the default template format.
          </AlertDescription>
        </Alert>
      );
    }
    
    return (
      <div className="mt-4 p-3 bg-green-50 text-green-800 rounded-md border border-green-200 flex items-center">
        <div className="w-8 h-8 rounded-full bg-green-100 mr-3 flex items-center justify-center">
          <CheckCircle className="h-4 w-4 text-green-500" />
        </div>
        <div>
          <p className="font-medium">Using Standard Template</p>
          <p className="text-sm">The agreement will use the standard template from the database.</p>
        </div>
      </div>
    );
  };

  const renderAgreementPreview = () => {
    if (!(selectedCustomer && selectedVehicle)) {
      return null;
    }
    
    return (
      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-lg font-medium">Agreement Preview</h3>
        
        <div className="bg-muted p-4 rounded-md text-sm">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-base">AGREEMENT TEMPLATE PREVIEW</h4>
          </div>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Template Information</AlertTitle>
            <AlertDescription>
              {standardTemplateExists ? 
                "Using the standard 'agreement temp' template from the database." : 
                "Standard template not found. Using default format."}
            </AlertDescription>
          </Alert>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border p-3 rounded-md">
              <h5 className="font-semibold mb-2">Customer Data</h5>
              <p><code>{"{{CUSTOMER_NAME}}"}</code>: {selectedCustomer.full_name}</p>
              <p><code>{"{{CUSTOMER_EMAIL}}"}</code>: {selectedCustomer.email}</p>
              <p><code>{"{{CUSTOMER_PHONE}}"}</code>: {selectedCustomer.phone_number}</p>
              <p><code>{"{{CUSTOMER_LICENSE}}"}</code>: {selectedCustomer.driver_license}</p>
              <p><code>{"{{CUSTOMER_NATIONALITY}}"}</code>: {selectedCustomer.nationality}</p>
            </div>
            
            <div className="border p-3 rounded-md">
              <h5 className="font-semibold mb-2">Vehicle Data</h5>
              <p><code>{"{{VEHICLE_MAKE}}"}</code>: {selectedVehicle.make}</p>
              <p><code>{"{{VEHICLE_MODEL}}"}</code>: {selectedVehicle.model}</p>
              <p><code>{"{{VEHICLE_PLATE}}"}</code>: {selectedVehicle.license_plate}</p>
              <p><code>{"{{VEHICLE_VIN}}"}</code>: {selectedVehicle.vin}</p>
              <p><code>{"{{VEHICLE_YEAR}}"}</code>: {selectedVehicle.year}</p>
            </div>
          </div>
          
          <div className="mt-4 border p-3 rounded-md">
            <h5 className="font-semibold mb-2">Agreement Data</h5>
            <div className="grid grid-cols-2 gap-2">
              <p><code>{"{{AGREEMENT_NUMBER}}"}</code>: {form.getValues("agreement_number")}</p>
              <p><code>{"{{START_DATE}}"}</code>: {format(form.getValues("start_date"), "PPP")}</p>
              <p><code>{"{{END_DATE}}"}</code>: {format(form.getValues("end_date"), "PPP")}</p>
              <p><code>{"{{RENT_AMOUNT}}"}</code>: {form.getValues("rent_amount")} QAR</p>
              <p><code>{"{{DEPOSIT_AMOUNT}}"}</code>: {form.getValues("deposit_amount")} QAR</p>
              <p><code>{"{{TOTAL_AMOUNT}}"}</code>: {form.getValues("total_amount")} QAR</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
          {renderTemplateStatus()}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Agreement Details</h3>
              
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
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Customer & Vehicle</h3>
              
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
              
              {selectedCustomer && (
                <div className="bg-muted p-3 rounded-md text-sm">
                  <p><strong>Email:</strong> {selectedCustomer.email}</p>
                  <p><strong>Phone:</strong> {selectedCustomer.phone_number}</p>
                  <p><strong>Driver License:</strong> {selectedCustomer.driver_license}</p>
                  <p><strong>Nationality:</strong> {selectedCustomer.nationality}</p>
                </div>
              )}
              
              <FormField
                control={form.control}
                name="vehicle_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle</FormLabel>
                    <div className="space-y-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        onClick={() => setIsVehicleSearchOpen(true)}
                        disabled={isCheckingVehicle}
                      >
                        {isCheckingVehicle ? (
                          <Loader className="mr-2 h-4 w-4 animate-spin" />
                        ) : selectedVehicle ? (
                          <>
                            {selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.license_plate})
                          </>
                        ) : (
                          "Search for a vehicle..."
                        )}
                      </Button>
                      <VehicleSearchCommandPalette
                        isOpen={isVehicleSearchOpen}
                        onClose={() => setIsVehicleSearchOpen(false)}
                        vehicles={vehicles}
                        onVehicleSelect={(vehicle) => {
                          field.onChange(vehicle.id);
                          handleVehicleChange(vehicle.id);
                        }}
                        isLoading={isCheckingVehicle}
                      />
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              
              {vehicleAvailabilityResult && !vehicleAvailabilityResult.isAvailable && !isVehicleDialogOpen && (
                <Alert variant="warning" className="bg-amber-50 border-amber-200">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-800">Vehicle Already Assigned</AlertTitle>
                  <AlertDescription className="text-amber-700">
                    This vehicle is currently assigned to Agreement #{vehicleAvailabilityResult.existingAgreement.agreement_number}.
                    When you submit this form, that agreement will be closed automatically.
                  </AlertDescription>
                </Alert>
              )}
              
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
          
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-medium">Payment Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          
          {renderAgreementPreview()}
          
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isSubmitting || isCheckingVehicle}
              className="w-full md:w-auto"
            >
              {isSubmitting ? "Creating Agreement..." : "Create Agreement"}
            </Button>
          </div>
        </form>
      </Form>

      {/* Vehicle Assignment Confirmation Dialog */}
      <VehicleAssignmentDialog
        isOpen={isVehicleDialogOpen}
        onClose={() => setIsVehicleDialogOpen(false)}
        onConfirm={handleVehicleConfirmation}
        vehicleId={form.getValues("vehicle_id")}
        existingAgreement={vehicleAvailabilityResult?.existingAgreement}
      />
    </>
  );
};

export default AgreementFormWithVehicleCheck;
