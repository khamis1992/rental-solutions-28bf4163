
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import CustomerSelector from "@/components/customers/CustomerSelector";
import { CustomerInfo } from "@/types/customer";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { checkVehicleAvailability, activateAgreement } from "@/utils/agreement-utils";
import { forceGeneratePaymentForAgreement } from "@/lib/validation-schemas/agreement";
import { AgreementTemplateStatus } from "./AgreementTemplateStatus";
import { AgreementDetails } from "./AgreementDetails";
import { CustomerVehicleSection } from "./CustomerVehicleSection";
import { PaymentInformation } from "./PaymentInformation";

const AddAgreementForm = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [standardTemplateExists, setStandardTemplateExists] = useState<boolean>(false);
  const [templateError, setTemplateError] = useState<string | null>(null);
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
    <div className="space-y-4">
      {/* Template Status */}
      <AgreementTemplateStatus 
        standardTemplateExists={standardTemplateExists}
        specificUrlCheck={specificUrlCheck}
      />
      
      <Card>
        <CardContent className="pt-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Agreement Information</h2>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Agreement Details */}
              <AgreementDetails 
                agreementNumber={agreementNumber}
                setAgreementNumber={setAgreementNumber}
                startDate={startDate}
                setStartDate={setStartDate}
                durationMonths={durationMonths}
                setDurationMonths={setDurationMonths}
                endDate={endDate}
                setEndDate={setEndDate}
                status={status}
                setStatus={setStatus}
                standardTemplateExists={standardTemplateExists}
              />
              
              {/* Customer & Vehicle */}
              <CustomerVehicleSection
                selectedCustomer={selectedCustomer}
                setSelectedCustomer={setSelectedCustomer}
                selectedVehicle={selectedVehicle}
                setSelectedVehicle={setSelectedVehicle}
              />
            </div>
            
            {/* Payment Information */}
            <PaymentInformation
              rentAmount={rentAmount}
              setRentAmount={setRentAmount}
              depositAmount={depositAmount}
              setDepositAmount={setDepositAmount}
              dailyLateFee={dailyLateFee}
              setDailyLateFee={setDailyLateFee}
              totalContractAmount={totalContractAmount}
              setTotalContractAmount={setTotalContractAmount}
              notes={notes}
              setNotes={setNotes}
            />
            
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
  );
};

export default AddAgreementForm;
