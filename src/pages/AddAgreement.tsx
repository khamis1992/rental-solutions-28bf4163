
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  AlertCircle, 
  CheckCircle2, 
  CalendarIcon, 
  ChevronsUpDown
} from "lucide-react";
import PageContainer from "@/components/layout/PageContainer";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { checkStandardTemplateExists, diagnosisTemplateAccess } from "@/utils/agreementUtils";
import { ensureStorageBuckets } from "@/utils/setupBuckets";
import { diagnoseTemplateUrl, uploadAgreementTemplate, checkSpecificTemplateUrl } from "@/utils/templateUtils";
import { checkVehicleAvailability, activateAgreement } from "@/utils/agreement-utils";
import { forceGeneratePaymentForAgreement } from "@/lib/validation-schemas/agreement";
import { formatDate } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import CustomerSelector from "@/components/customers/CustomerSelector";
import { CustomerInfo } from "@/types/customer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const AddAgreement = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [standardTemplateExists, setStandardTemplateExists] = useState<boolean>(false);
  const [checkingTemplate, setCheckingTemplate] = useState<boolean>(true);
  const [templateDiagnosis, setTemplateDiagnosis] = useState<any>(null);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [templateUrlDiagnosis, setTemplateUrlDiagnosis] = useState<any>(null);
  const [specificUrlCheck, setSpecificUrlCheck] = useState<any>(null);
  
  // Form state
  const [agreementNumber, setAgreementNumber] = useState("AGR-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + Math.floor(1000 + Math.random() * 9000));
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerInfo | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [durationMonths, setDurationMonths] = useState<string>("12");
  const [endDate, setEndDate] = useState<Date>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 12);
    return date;
  });
  const [status, setStatus] = useState<string>("draft");
  const [rentAmount, setRentAmount] = useState<string>("0");
  const [depositAmount, setDepositAmount] = useState<string>("0");
  const [dailyLateFee, setDailyLateFee] = useState<string>("120");
  const [totalContractAmount, setTotalContractAmount] = useState<string>("0");
  const [notes, setNotes] = useState<string>("");

  // Update end date when start date or duration changes
  useEffect(() => {
    if (startDate && durationMonths) {
      const newEndDate = new Date(startDate);
      newEndDate.setMonth(newEndDate.getMonth() + parseInt(durationMonths));
      setEndDate(newEndDate);
    }
  }, [startDate, durationMonths]);

  // Update total contract amount when rent amount or duration changes
  useEffect(() => {
    const rent = parseFloat(rentAmount) || 0;
    const duration = parseInt(durationMonths) || 0;
    setTotalContractAmount((rent * duration).toString());
  }, [rentAmount, durationMonths]);

  useEffect(() => {
    if (typeof sessionStorage !== 'undefined') {
      const cachedTemplateCheck = sessionStorage.getItem('template_check_result');
      if (cachedTemplateCheck) {
        try {
          const { exists, timestamp, diagnosis, specificCheck, urlDiagnosis } = JSON.parse(cachedTemplateCheck);
          const now = Date.now();
          
          if (now - timestamp < 60 * 60 * 1000) {
            console.log('Using cached template check results');
            setStandardTemplateExists(exists);
            if (diagnosis) setTemplateDiagnosis(diagnosis);
            if (specificCheck) setSpecificUrlCheck(specificCheck);
            if (urlDiagnosis) setTemplateUrlDiagnosis(urlDiagnosis);
            setCheckingTemplate(false);
            setTemplateError(exists ? null : "Template not found. Please upload a template file or create the agreements bucket manually in Supabase dashboard.");
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
        setTemplateError(null);

        const specificUrl = "https://vqdlsidkucrownbfuouq.supabase.co/storage/v1/object/public/agreements//agreement_template.docx";
        console.log("Checking specific URL: ", specificUrl);
        const specificCheck = await checkSpecificTemplateUrl(specificUrl);
        setSpecificUrlCheck(specificCheck);
        if (specificCheck.accessible) {
          console.log("Specific URL is accessible!");
          setStandardTemplateExists(true);
          setTemplateError(null);
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

          if (result.error?.includes("row-level security") || result.error?.includes("RLS")) {
            setTemplateError("Permission error: Please create the 'agreements' bucket manually in the Supabase dashboard. Use the service role key for storage operations.");
          } else {
            setTemplateError(`Storage setup error: ${result.error}`);
          }
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
          setTemplateError("Template not found. Please upload a template file or create the agreements bucket manually in Supabase dashboard.");
          toast.error("Template Not Found", {
            description: "The standard agreement template was not found. Please upload a template file."
          });
          const diagnosis = await diagnosisTemplateAccess();
          setTemplateDiagnosis(diagnosis);
          console.log("Template diagnosis:", diagnosis);
          if (diagnosis.errors.length > 0) {
            console.error("Diagnosis errors:", diagnosis.errors);
          }
        } else {
          setTemplateError(null);
          toast.success("Template Found", {
            description: "The agreement template was found and will be used for new agreements."
          });
        }

        const urlDiagnosis = await diagnoseTemplateUrl();
        setTemplateUrlDiagnosis(urlDiagnosis);
        console.log("Template URL diagnosis:", urlDiagnosis);
        if (urlDiagnosis.status === "error") {
          console.error("Template URL issues:", urlDiagnosis.issues);
        }
        
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('template_check_result', JSON.stringify({
            exists,
            timestamp: Date.now(),
            diagnosis: templateDiagnosis,
            specificCheck: specificUrlCheck,
            urlDiagnosis
          }));
        }
      } catch (error) {
        console.error("Error during template setup:", error);
        setStandardTemplateExists(false);
        setTemplateError("Error checking template. Please upload a template file.");
        toast.error("Error Checking Template", {
            description: "There was an error checking for the agreement template. Please upload a template file."
        });
      } finally {
        setCheckingTemplate(false);
      }
    };
    setupStorage();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (!selectedCustomer) {
        toast.error("Please select a customer");
        setIsSubmitting(false);
        return;
      }
      
      const leaseData = {
        agreement_number: agreementNumber,
        customer_id: selectedCustomer.id,
        vehicle_id: selectedVehicle?.id || null,
        start_date: startDate,
        end_date: endDate,
        status: status,
        rent_amount: parseFloat(rentAmount),
        deposit_amount: parseFloat(depositAmount),
        daily_late_fee: parseFloat(dailyLateFee),
        total_amount: parseFloat(totalContractAmount),
        notes: notes,
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
        // If agreement is active but not tied to a vehicle, still generate payment
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
    <PageContainer 
      title="Create New Agreement" 
      description="Create a new rental agreement with a customer" 
      backLink="/agreements"
    >
      <div className="space-y-4">
        {/* Template Status */}
        {specificUrlCheck?.accessible && (
          <Alert className="bg-green-50 border-green-500">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertTitle>Template Check</AlertTitle>
            <AlertDescription>
              <span className="text-green-600">Template is accessible</span>
            </AlertDescription>
          </Alert>
        )}
        
        {standardTemplateExists && (
          <Alert className="bg-green-50 border-green-500">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertTitle>Template Ready</AlertTitle>
            <AlertDescription>
              Agreement template is available and ready to use.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Agreement Information */}
        <Card>
          <CardContent className="pt-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">Agreement Information</h2>
            </div>
            
            {/* Using Standard Template Section */}
            {standardTemplateExists && (
              <div className="mb-6 bg-green-50 p-4 rounded-md border border-green-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium text-green-800">Using Standard Template</p>
                    <p className="text-sm text-green-700">The agreement will use the standard template from the database.</p>
                  </div>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Agreement Details */}
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Agreement Details</h3>
                  
                  <div className="space-y-2">
                    <label htmlFor="agreementNumber" className="text-sm font-medium">
                      Agreement Number
                    </label>
                    <Input
                      id="agreementNumber"
                      value={agreementNumber}
                      onChange={(e) => setAgreementNumber(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="startDate" className="text-sm font-medium">
                      Start Date
                    </label>
                    <DatePicker 
                      date={startDate} 
                      setDate={setStartDate} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="duration" className="text-sm font-medium">
                      Duration (Months)
                    </label>
                    <Select value={durationMonths} onValueChange={setDurationMonths}>
                      <SelectTrigger>
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
                  
                  <div className="space-y-2">
                    <label htmlFor="endDate" className="text-sm font-medium">
                      End Date
                    </label>
                    <DatePicker 
                      date={endDate}
                      setDate={setEndDate}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="status" className="text-sm font-medium">
                      Status
                    </label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Customer & Vehicle */}
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Customer & Vehicle</h3>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Customer
                    </label>
                    <CustomerSelector 
                      selectedCustomer={selectedCustomer}
                      onCustomerSelect={setSelectedCustomer}
                      placeholder="Select customer"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Vehicle
                    </label>
                    <Select onValueChange={(value) => {
                      // In a real implementation, you'd fetch vehicle details here
                      setSelectedVehicle({ id: value, make: 'Sample', model: 'Vehicle' });
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vehicle1">Toyota Camry (ABC-123)</SelectItem>
                        <SelectItem value="vehicle2">Honda Civic (XYZ-789)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              {/* Payment Information */}
              <div className="mt-8 space-y-4">
                <h3 className="font-medium text-lg">Payment Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="rentAmount" className="text-sm font-medium">
                      Monthly Rent Amount
                    </label>
                    <Input
                      id="rentAmount"
                      type="number"
                      value={rentAmount}
                      onChange={(e) => setRentAmount(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="depositAmount" className="text-sm font-medium">
                      Deposit Amount
                    </label>
                    <Input
                      id="depositAmount"
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="dailyLateFee" className="text-sm font-medium">
                      Daily Late Fee
                    </label>
                    <Input
                      id="dailyLateFee"
                      type="number"
                      value={dailyLateFee}
                      onChange={(e) => setDailyLateFee(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="totalContractAmount" className="text-sm font-medium">
                    Total Contract Amount
                  </label>
                  <Input
                    id="totalContractAmount"
                    type="number"
                    value={totalContractAmount}
                    onChange={(e) => setTotalContractAmount(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="notes" className="text-sm font-medium">
                    Notes
                  </label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="w-full"
                    placeholder="Add any additional notes here..."
                  />
                </div>
              </div>
              
              {/* Submit Button */}
              <div className="mt-8 flex justify-end">
                <Button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating..." : "Create Agreement"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default AddAgreement;
