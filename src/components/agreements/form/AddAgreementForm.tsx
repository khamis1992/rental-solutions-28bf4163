
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { AgreementTemplateStatus } from "./AgreementTemplateStatus";
import { AgreementDetails } from "./AgreementDetails";
import { CustomerVehicleSection } from "./CustomerVehicleSection";
import { PaymentInformation } from "./PaymentInformation";
import { useTemplateSetup } from "./TemplateSetup";
import { CustomerInfo } from "@/types/customer";

const AddAgreementForm = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { standardTemplateExists, specificUrlCheck, templateError } = useTemplateSetup();
  
  // Form state
  const [agreementNumber, setAgreementNumber] = useState("");
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

  // Generate unique agreement number on component mount
  useEffect(() => {
    const generateAgreementNumber = () => {
      const prefix = "AGR";
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const random = Math.floor(1000 + Math.random() * 9000);
      return `${prefix}-${dateStr}-${random}`;
    };
    
    setAgreementNumber(generateAgreementNumber());
  }, []);

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

  const validateForm = () => {
    if (!selectedCustomer) {
      toast.error("Please select a customer");
      return false;
    }
    
    if (!selectedVehicle) {
      toast.error("Please select a vehicle");
      return false;
    }
    
    if (!startDate) {
      toast.error("Please select a start date");
      return false;
    }
    
    if (parseFloat(rentAmount) <= 0) {
      toast.error("Rent amount must be greater than zero");
      return false;
    }
    
    return true;
  };

  const generatePaymentSchedule = async (leaseId: string) => {
    try {
      // Calculate monthly payment dates based on start date and duration
      const paymentDates = [];
      const rentAmountNum = parseFloat(rentAmount);
      
      for (let i = 0; i < parseInt(durationMonths); i++) {
        const paymentDate = new Date(startDate);
        paymentDate.setMonth(paymentDate.getMonth() + i);
        
        paymentDates.push({
          lease_id: leaseId,
          amount: rentAmountNum,
          due_date: paymentDate.toISOString(),
          status: i === 0 ? 'pending' : 'pending',
          type: 'rent',
          description: `Month ${i + 1} payment`
        });
      }
      
      // Insert payment schedule
      if (paymentDates.length > 0) {
        const { error } = await supabase.from('unified_payments').insert(paymentDates);
        if (error) {
          console.error("Error creating payment schedule:", error);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error("Error in payment schedule generation:", error);
      return false;
    }
  };

  const checkVehicleAvailability = async (vehicleId: string) => {
    try {
      // Check if vehicle is already assigned to an active agreement
      const { data, error } = await supabase
        .from('leases')
        .select('id, agreement_number, status')
        .eq('vehicle_id', vehicleId)
        .eq('status', 'active');
        
      if (error) throw error;
      
      return {
        isAvailable: !data || data.length === 0,
        existingAgreement: data && data.length > 0 ? data[0] : null
      };
    } catch (error) {
      console.error("Error checking vehicle availability:", error);
      throw error;
    }
  };

  const closeExistingAgreement = async (agreementId: string) => {
    try {
      const { error } = await supabase
        .from('leases')
        .update({ status: 'closed', updated_at: new Date().toISOString() })
        .eq('id', agreementId);
        
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error closing existing agreement:", error);
      return false;
    }
  };

  const updateVehicleStatus = async (vehicleId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', vehicleId);
        
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error updating vehicle status:", error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let vehicleId = selectedVehicle?.id;
      
      // Check if vehicle is available if status is active
      if (vehicleId && status === 'active') {
        const { isAvailable, existingAgreement } = await checkVehicleAvailability(vehicleId);
        
        // If vehicle is not available, close the existing agreement
        if (!isAvailable && existingAgreement) {
          console.log(`Vehicle is assigned to agreement #${existingAgreement.agreement_number} which will be closed`);
          const closed = await closeExistingAgreement(existingAgreement.id);
          if (!closed) {
            toast.error("Failed to close existing agreement for the vehicle");
            setIsSubmitting(false);
            return;
          }
        }
      }
      
      // Create agreement
      const leaseData = {
        agreement_number: agreementNumber,
        customer_id: selectedCustomer!.id,
        vehicle_id: vehicleId,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: status,
        rent_amount: parseFloat(rentAmount),
        deposit_amount: parseFloat(depositAmount),
        daily_late_fee: parseFloat(dailyLateFee),
        total_amount: parseFloat(totalContractAmount),
        notes: notes,
        agreement_type: 'long_term' // Default value
      };
      
      const { data, error } = await supabase.from("leases").insert([leaseData]).select("id").single();
      
      if (error) {
        throw error;
      }
      
      // If agreement is active, update vehicle status
      if (status === 'active' && vehicleId) {
        await updateVehicleStatus(vehicleId, 'rented');
        
        // Generate payment schedule
        const paymentsCreated = await generatePaymentSchedule(data.id);
        if (!paymentsCreated) {
          toast.warning("Agreement created but failed to generate payment schedule");
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
