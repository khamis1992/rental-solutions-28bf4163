
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
import { CalendarIcon, CheckCircle, InfoIcon, AlertCircle, AlertTriangle, ChevronDown, ChevronUp, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { agreementSchema } from "@/lib/validation-schemas/agreement";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { checkVehicleAvailability } from "@/utils/agreement-utils";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CustomerInfo, VehicleInfo, VehicleAssignmentDialogProps } from '@/types/vehicle-assignment.types';
import { CustomerDetailsSection } from "./vehicle-assignment/CustomerDetailsSection";
import { VehicleDetailsSection } from "./vehicle-assignment/VehicleDetailsSection";
import { PaymentWarningSection } from "./vehicle-assignment/PaymentWarningSection";
import { toast } from "sonner";
import { asLeaseId } from "@/lib/database";
import { LeaseRow } from '@/lib/database/types';

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

// Create more specific types instead of using 'any'
interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  status: string;
  description?: string;
  payment_method?: string;
}

interface TrafficFine {
  id: string;
  violation_number: string;
  fine_amount: number;
  payment_status: string;
  violation_date: string;
}

interface ExistingAgreement {
  id: string;
  agreement_number: string;
}

export function VehicleAssignmentDialog({
  open,
  onOpenChange,
  agreementId,
  currentVehicleId,
  onAssignVehicle
}: VehicleAssignmentDialogProps) {
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [trafficFines, setTrafficFines] = useState<TrafficFine[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [acknowledgedPayments, setAcknowledgedPayments] = useState(false);
  const [acknowledgedFines, setAcknowledgedFines] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPaymentHistoryOpen, setIsPaymentHistoryOpen] = useState(false);
  const [existingAgreement, setExistingAgreement] = useState<ExistingAgreement | null>(null);

  useEffect(() => {
    if (open && currentVehicleId) {
      fetchVehicleDetails();
      fetchExistingAgreement();
    }
  }, [open, currentVehicleId]);

  const fetchExistingAgreement = async () => {
    if (!currentVehicleId) return;
    
    try {
      const { data, error } = await supabase
        .from('leases')
        .select('id, agreement_number')
        .eq('vehicle_id', currentVehicleId)
        .eq('status', 'active')
        .single();
        
      if (data && !error) {
        setExistingAgreement({
          id: data.id,
          agreement_number: data.agreement_number
        });
        fetchAssociatedData(data.id);
      }
    } catch (error) {
      console.error("Error fetching existing agreement:", error);
    }
  };

  const fetchVehicleDetails = async () => {
    if (!currentVehicleId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, make, model, license_plate, year, color')
        .eq('id', currentVehicleId)
        .single();
      
      if (data && !error) {
        setVehicleInfo(data as VehicleInfo);
      }
    } catch (error) {
      console.error("Error fetching vehicle details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAssociatedData = async (leaseId: string) => {
    if (!leaseId) return;
    
    setIsLoading(true);
    try {
      // Fetch pending payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('unified_payments')
        .select('*')
        .eq('lease_id', leaseId)
        .in('status', ['pending', 'overdue']);
        
      if (paymentsData && !paymentsError) {
        setPendingPayments(paymentsData as Payment[]);
      }
      
      // Fetch traffic fines
      const { data: finesData, error: finesError } = await supabase
        .from('traffic_fines')
        .select('*')
        .eq('lease_id', leaseId)
        .eq('payment_status', 'pending');
        
      if (finesData && !finesError) {
        setTrafficFines(finesData as TrafficFine[]);
      }
      
      // Fetch customer information through lease
      const { data: leaseData, error: leaseError } = await supabase
        .from('leases')
        .select('customer_id')
        .eq('id', leaseId)
        .single();
        
      if (leaseData?.customer_id && !leaseError) {
        const { data: customerData, error: customerError } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone_number')
          .eq('id', leaseData.customer_id)
          .single();
          
        if (customerData && !customerError) {
          setCustomerInfo(customerData as CustomerInfo);
        }
      }
    } catch (error) {
      console.error("Error fetching associated data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(dateObj);
  };

  // Check if we need acknowledgments
  const needsPaymentAcknowledgment = pendingPayments.length > 0;
  const needsFinesAcknowledgment = trafficFines.length > 0;
  
  // Can proceed if no acknowledgments needed, or all are acknowledged
  const canProceed = (!needsPaymentAcknowledgment || acknowledgedPayments) && 
                    (!needsFinesAcknowledgment || acknowledgedFines);

  if (!open || !existingAgreement) return null;

  const handleConfirm = async () => {
    if (currentVehicleId) {
      await onAssignVehicle(currentVehicleId);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <DialogTitle>Vehicle Already Assigned</DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm">
            This vehicle is currently assigned to Agreement <strong>#{existingAgreement.agreement_number}</strong>.
          </p>
          <p className="text-sm mt-2">
            If you proceed, the existing agreement will be closed automatically, and the vehicle will be assigned to your new agreement.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
          </div>
        ) : (
          <>
            {/* Vehicle and Customer Information Section */}
            {vehicleInfo && (
              <Collapsible
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                className="border rounded-md overflow-hidden mb-3"
              >
                <div className="bg-slate-50 p-3">
                  <CollapsibleTrigger className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-2">
                      <Info className="h-4 w-4 text-slate-500" />
                      <h3 className="text-sm font-medium">Vehicle & Agreement Details</h3>
                    </div>
                    {isDetailsOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent className="p-3 bg-white">
                  <div className="space-y-4">
                    <VehicleDetailsSection vehicleInfo={vehicleInfo} isDetailsOpen={isDetailsOpen} />
                    <CustomerDetailsSection customerInfo={customerInfo} isDetailsOpen={isDetailsOpen} />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Payment History Section */}
            {pendingPayments.length > 0 && (
              <Collapsible
                open={isPaymentHistoryOpen}
                onOpenChange={setIsPaymentHistoryOpen}
                className="border rounded-md overflow-hidden mb-3"
              >
                <div className="bg-slate-50 p-3">
                  <CollapsibleTrigger className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-2">
                      <Info className="h-4 w-4 text-slate-500" />
                      <h3 className="text-sm font-medium">Payment History</h3>
                    </div>
                    {isPaymentHistoryOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent className="p-3 bg-white">
                  <PaymentWarningSection
                    pendingPayments={pendingPayments}
                    acknowledgedPayments={acknowledgedPayments}
                    onAcknowledgePayments={setAcknowledgedPayments}
                    isPaymentHistoryOpen={isPaymentHistoryOpen}
                    formatDate={formatDate}
                  />
                </CollapsibleContent>
              </Collapsible>
            )}

            {trafficFines.length > 0 && (
              <div className="mt-2 border rounded-md p-3 bg-amber-50">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <h3 className="text-sm font-medium">Outstanding Traffic Fines</h3>
                </div>
                <p className="text-sm mt-1 text-gray-600">
                  There {trafficFines.length === 1 ? 'is' : 'are'} {trafficFines.length} unpaid traffic {trafficFines.length === 1 ? 'fine' : 'fines'} associated with this vehicle.
                </p>
                <div className="mt-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acknowledgedFines}
                      onChange={(e) => setAcknowledgedFines(e.target.checked)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm">I acknowledge the outstanding traffic fines</span>
                  </label>
                </div>
              </div>
            )}
          </>
        )}

        <Separator />
        
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={isLoading || !canProceed}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Close Old Agreement & Reassign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
        // Fetch all vehicles, not just available ones, so we can show assigned vehicles too
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
      // Check if vehicle is already assigned to an active agreement
      const availabilityResult = await checkVehicleAvailability(vehicleId);
      setVehicleAvailabilityResult(availabilityResult);
      
      if (!availabilityResult.isAvailable && availabilityResult.existingAgreement) {
        setIsVehicleDialogOpen(true);
      }
      
      // Get vehicle details regardless of availability
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
    // User has confirmed they want to proceed with the vehicle assignment
    // This will be handled in the submission logic which will close the old agreement
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
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleVehicleChange(value);
                      }} 
                      defaultValue={field.value}
                      disabled={isCheckingVehicle}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isCheckingVehicle ? "Checking vehicle..." : "Select vehicle"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vehicles.map((vehicle) => {
                          const isAvailable = vehicle.status === 'available';
                          return (
                            <SelectItem 
                              key={vehicle.id} 
                              value={vehicle.id}
                              className={!isAvailable ? "text-amber-500" : ""}
                            >
                              {vehicle.make} {vehicle.model} ({vehicle.license_plate})
                              {!isAvailable && " [Assigned]"}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
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
                  <p><strong>Year:</strong> {selectedVehicle.year}</p>
                  {selectedVehicle.color && <p><strong>Color:</strong> {selectedVehicle.color}</p>}
                </div>
              )}
            </div>
          </div>
          
          <FormField
            control={form.control}
            name="rent_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rent Amount (QAR)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      field.onChange(isNaN(value) ? 0 : value);
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
                <FormLabel>Deposit Amount (QAR)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      field.onChange(isNaN(value) ? 0 : value);
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
                <FormLabel>Total Amount (QAR) - Calculated Automatically</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    disabled 
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
                <FormLabel>Daily Late Fee (QAR)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      field.onChange(isNaN(value) ? 0 : value);
                    }} 
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
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {selectedCustomer && selectedVehicle && renderAgreementPreview()}
          
          <div className="flex justify-end space-x-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Save Agreement'
              )}
            </Button>
          </div>
        </form>
      </Form>
      
      {isVehicleDialogOpen && (
        <VehicleAssignmentDialog
          open={isVehicleDialogOpen}
          onOpenChange={setIsVehicleDialogOpen}
          agreementId=""
          currentVehicleId={form.getValues("vehicle_id")}
          onAssignVehicle={handleVehicleConfirmation}
        />
      )}
    </>
  );
};

export default AgreementFormWithVehicleCheck;
