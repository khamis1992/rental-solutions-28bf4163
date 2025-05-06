
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarIcon, CheckCircle2, ArrowLeft } from "lucide-react";
import PageContainer from "@/components/layout/PageContainer";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { checkStandardTemplateExists } from "@/utils/agreementUtils";
import { ensureStorageBuckets } from "@/utils/setupBuckets";
import { checkSpecificTemplateUrl } from "@/utils/templateUtils";
import { checkVehicleAvailability, activateAgreement } from "@/utils/agreement-utils";
import { forceGeneratePaymentForAgreement } from "@/lib/validation-schemas/agreement";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CustomerSelector from "@/components/customers/CustomerSelector";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const AddAgreement = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [standardTemplateExists, setStandardTemplateExists] = useState<boolean>(false);
  const [checkingTemplate, setCheckingTemplate] = useState<boolean>(true);
  const [specificUrlCheck, setSpecificUrlCheck] = useState<any>(null);

  // Form state
  const [agreementNumber, setAgreementNumber] = useState<string>("AGR-" + Math.floor(100000 + Math.random() * 900000));
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date(new Date().setFullYear(new Date().getFullYear() + 1)));
  const [duration, setDuration] = useState<string>("12");
  const [status, setStatus] = useState<string>("draft");
  const [rentAmount, setRentAmount] = useState<string>("0");
  const [depositAmount, setDepositAmount] = useState<string>("0");
  const [totalAmount, setTotalAmount] = useState<string>("0");
  const [lateFee, setLateFee] = useState<string>("120");
  const [notes, setNotes] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  useEffect(() => {
    if (typeof sessionStorage !== 'undefined') {
      const cachedTemplateCheck = sessionStorage.getItem('template_check_result');
      if (cachedTemplateCheck) {
        try {
          const { exists, timestamp, specificCheck } = JSON.parse(cachedTemplateCheck);
          const now = Date.now();
          
          if (now - timestamp < 60 * 60 * 1000) {
            console.log('Using cached template check results');
            setStandardTemplateExists(exists);
            if (specificCheck) setSpecificUrlCheck(specificCheck);
            setCheckingTemplate(false);
            return;
          }
        } catch (err) {
          console.warn('Error parsing template check cache:', err);
        }
      }
    }
    
    const setupStorage = async () => {
      try {
        console.log("Setting up storage and ensuring buckets exist...");
        setCheckingTemplate(true);

        const specificUrl = "https://vqdlsidkucrownbfuouq.supabase.co/storage/v1/object/public/agreements//agreement_template.docx";
        console.log("Checking specific URL: ", specificUrl);
        const specificCheck = await checkSpecificTemplateUrl(specificUrl);
        setSpecificUrlCheck(specificCheck);
        if (specificCheck.accessible) {
          console.log("Specific URL is accessible!");
          setStandardTemplateExists(true);
          setCheckingTemplate(false);
          
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('template_check_result', JSON.stringify({
              exists: true,
              timestamp: Date.now(),
              specificCheck
            }));
          }
          
          return;
        } else {
          console.log("Specific URL is not accessible:", specificCheck.error);
        }

        const result = await ensureStorageBuckets();
        if (!result.success) {
          console.error("Error setting up storage buckets:", result.error);
          toast.error("Storage Setup Error", {
            description: "There was an error setting up storage buckets. Template creation may fail."
          });
        } else {
          console.log("Storage buckets setup complete");
        }

        console.log("Checking if agreement template exists...");
        const exists = await checkStandardTemplateExists();
        console.log("Template exists result:", exists);
        setStandardTemplateExists(exists);
        if (!exists) {
          toast.error("Template Not Found", {
            description: "The standard agreement template was not found. Please upload a template file."
          });
        } else {
          toast.success("Template Found", {
            description: "The agreement template was found and will be used for new agreements."
          });
        }
        
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('template_check_result', JSON.stringify({
            exists,
            timestamp: Date.now(),
            specificCheck: specificUrlCheck,
          }));
        }
      } catch (error) {
        console.error("Error during template setup:", error);
        setStandardTemplateExists(false);
        toast.error("Error Checking Template", {
            description: "There was an error checking for the agreement template. Please upload a template file."
        });
      } finally {
        setCheckingTemplate(false);
      }
    };
    setupStorage();
  }, []);

  const handleDurationChange = (value: string) => {
    setDuration(value);
    if (startDate && value) {
      const months = parseInt(value, 10);
      const newEndDate = new Date(startDate);
      newEndDate.setMonth(newEndDate.getMonth() + months);
      setEndDate(newEndDate);
    }
  };

  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date);
    if (date && duration) {
      const months = parseInt(duration, 10);
      const newEndDate = new Date(date);
      newEndDate.setMonth(newEndDate.getMonth() + months);
      setEndDate(newEndDate);
    }
  };

  const handleCustomerSelect = (customer: any) => {
    setSelectedCustomer(customer);
  };

  const handleVehicleSelect = (vehicle: any) => {
    setSelectedVehicle(vehicle);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (!selectedCustomer) {
      toast.error("Please select a customer");
      setIsSubmitting(false);
      return;
    }

    if (!selectedVehicle) {
      toast.error("Please select a vehicle");
      setIsSubmitting(false);
      return;
    }

    try {
      const leaseData = {
        agreement_number: agreementNumber,
        customer_id: selectedCustomer.id,
        vehicle_id: selectedVehicle.id,
        start_date: startDate,
        end_date: endDate,
        rent_amount: parseFloat(rentAmount),
        deposit_amount: parseFloat(depositAmount),
        total_amount: parseFloat(totalAmount),
        daily_late_fee: parseFloat(lateFee),
        status: status,
        notes: notes
      };
      
      if (leaseData.vehicle_id && leaseData.status === 'active') {
        const { isAvailable, existingAgreement } = await checkVehicleAvailability(leaseData.vehicle_id);
        
        if (!isAvailable && existingAgreement) {
          console.log(`Vehicle is assigned to agreement #${existingAgreement.agreement_number} which will be closed`);
        }
      }
      
      console.log("Submitting lease data:", leaseData);
      
      const { data, error } = await supabase.from("leases").insert([leaseData]).select("id").single();
      if (error) {
        throw error;
      }
      
      if (leaseData.status === 'active' && leaseData.vehicle_id) {
        await activateAgreement(data.id, leaseData.vehicle_id);
      } else if (leaseData.status === 'active') {
        try {
          console.log("Generating initial payment schedule for new agreement");
          const result = await forceGeneratePaymentForAgreement(supabase, data.id);
          if (!result.success) {
            console.warn("Could not generate payment schedule:", result.message);
          }
        } catch (paymentError) {
          console.error("Error generating payment schedule:", paymentError);
        }
      }
      
      toast.success("Agreement created successfully");
      navigate(`/agreements/${data.id}`);
    } catch (error: any) {
      console.error("Error creating agreement:", error);
      toast.error("Failed to create agreement", {
        description: error.message || "Something went wrong"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <button 
            onClick={() => navigate('/agreements')} 
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </button>
          <h1 className="text-2xl font-bold mt-2">Create New Agreement</h1>
          <p className="text-gray-600">Create a new rental agreement with a customer</p>
          <p className="text-sm text-gray-500">System Date: {format(new Date(), "MMMM d, yyyy")}</p>
        </div>

        {checkingTemplate ? (
          <div className="flex justify-center items-center p-8 bg-white rounded-lg shadow-sm border border-gray-200">
            <p>Checking template availability...</p>
          </div>
        ) : (
          <>
            {standardTemplateExists || (specificUrlCheck && specificUrlCheck.accessible) ? (
              <Alert className="mb-6 bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-700 flex items-center">
                  <span className="font-medium">Template Ready</span>
                  <span className="ml-2">Agreement template is available and ready to use.</span>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="mb-6 bg-yellow-50 border-yellow-200">
                <CheckCircle2 className="h-4 w-4 text-yellow-500" />
                <AlertDescription className="text-yellow-700">
                  <span className="font-medium">Template Check</span>
                  <span className="ml-2">Template is accessible</span>
                </AlertDescription>
              </Alert>
            )}

            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                <div>
                  <p className="font-medium">Using Standard Template</p>
                  <p className="text-sm text-gray-600">The agreement will use the standard template from the database.</p>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Agreement Details */}
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-lg font-medium mb-4">Agreement Details</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Agreement Number</label>
                        <Input 
                          value={agreementNumber} 
                          onChange={(e) => setAgreementNumber(e.target.value)} 
                          className="w-full"
                          disabled
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !startDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {startDate ? format(startDate, "MMMM d, yyyy") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={startDate}
                              onSelect={handleStartDateChange}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Months)</label>
                        <Select value={duration} onValueChange={handleDurationChange}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 month</SelectItem>
                            <SelectItem value="3">3 months</SelectItem>
                            <SelectItem value="6">6 months</SelectItem>
                            <SelectItem value="12">12 months</SelectItem>
                            <SelectItem value="24">24 months</SelectItem>
                            <SelectItem value="36">36 months</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !endDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {endDate ? format(endDate, "MMMM d, yyyy") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={endDate}
                              onSelect={setEndDate}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <Select value={status} onValueChange={setStatus}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-lg font-medium mb-4">Payment Information</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent Amount</label>
                        <Input 
                          type="number" 
                          value={rentAmount} 
                          onChange={(e) => {
                            setRentAmount(e.target.value);
                            // Update total amount based on duration
                            const rent = parseFloat(e.target.value) || 0;
                            const months = parseInt(duration, 10) || 0;
                            setTotalAmount((rent * months).toString());
                          }} 
                          placeholder="0"
                          className="w-full"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Deposit Amount</label>
                        <Input 
                          type="number" 
                          value={depositAmount} 
                          onChange={(e) => setDepositAmount(e.target.value)} 
                          placeholder="0"
                          className="w-full"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Daily Late Fee</label>
                        <Input 
                          type="number" 
                          value={lateFee} 
                          onChange={(e) => setLateFee(e.target.value)} 
                          placeholder="120"
                          className="w-full"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Total Contract Amount</label>
                        <Input 
                          type="number" 
                          value={totalAmount} 
                          onChange={(e) => setTotalAmount(e.target.value)} 
                          placeholder="0"
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-lg font-medium mb-4">Notes</h2>
                    <Textarea 
                      value={notes} 
                      onChange={(e) => setNotes(e.target.value)} 
                      placeholder="Enter any additional information about this agreement"
                      className="w-full h-32"
                    />
                  </div>
                </div>

                {/* Customer & Vehicle */}
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-lg font-medium mb-4">Customer & Vehicle</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                        <CustomerSelector 
                          onCustomerSelect={handleCustomerSelect}
                          selectedCustomer={selectedCustomer}
                          inputClassName="w-full"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
                        <Select onValueChange={(value) => {
                          // This is a simplified example - in real app you'd fetch vehicle details
                          setSelectedVehicle({ id: value });
                        }}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select vehicle" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="vehicle1">Toyota Camry (ABC-123)</SelectItem>
                            <SelectItem value="vehicle2">Honda Accord (XYZ-789)</SelectItem>
                            <SelectItem value="vehicle3">Ford F-150 (QWE-456)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedVehicle && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-md">
                          <h3 className="text-sm font-medium text-gray-700">Vehicle Details</h3>
                          <p className="text-sm text-gray-600">More details would be shown here</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="bg-blue-600 hover:bg-blue-700 text-white" 
                  size="lg"
                >
                  {isSubmitting ? "Creating Agreement..." : "Create Agreement"}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default AddAgreement;
