import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { SimpleAgreement } from '@/hooks/use-agreements';

export const adaptSimpleToFullAgreement = (simpleAgreement: SimpleAgreement): Agreement => {
  const agreement: Agreement = {
    ...simpleAgreement,
    customer_name: simpleAgreement.customer_name || (simpleAgreement.customers?.full_name || 'Unknown'),
    license_plate: simpleAgreement.license_plate || (simpleAgreement.vehicles?.license_plate || 'Unknown'),
    vehicle_make: simpleAgreement.vehicle_make || (simpleAgreement.vehicles?.make || 'Unknown'),
    vehicle_model: simpleAgreement.vehicle_model || (simpleAgreement.vehicles?.model || 'Unknown'),
    vehicle_year: simpleAgreement.vehicle_year || (simpleAgreement.vehicles?.year || 'Unknown'),
  };

  if ('created_at' in simpleAgreement) {
    agreement.created_at = simpleAgreement.created_at;
  }

  if ('updated_at' in simpleAgreement) {
    agreement.updated_at = simpleAgreement.updated_at;
  }

  return agreement;
};

export const updateAgreementWithCheck = async (
  { id, data }: { id: string; data: Partial<Agreement> },
  userId?: string,
  onSuccess?: () => void,
  onError?: (error: any) => void
) => {
  try {
    if (!userId) {
      console.warn("User ID is not available. Proceeding without user-specific checks.");
    }

    const isChangingToActive = data.status === 'active';

    let currentStatus: string | null = null;
    if (isChangingToActive) {
      const { data: currentAgreement, error: fetchError } = await supabase
        .from('leases')
        .select('status')
        .eq('id', id)
        .single();
        
      if (fetchError) {
        console.warn("Could not fetch current agreement status:", fetchError);
      } else if (currentAgreement) {
        currentStatus = currentAgreement.status;
      }
    }

    const cleanData = { ...data };

    const fieldsToExclude = [
      'customer_data', 
      'vehicle_data', 
      'vehicles', 
      'customers', 
      '__typename', 
      'terms_accepted', 
      'additional_drivers'
    ];
    fieldsToExclude.forEach(field => {
      if (field in cleanData) delete cleanData[field];
    });

    toast.success("Agreement update initiated...");

    console.log("Sending data to update:", cleanData);

    const { data, error } = await supabase
      .from('leases')
      .update(cleanData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("Update failed:", error);
      toast.error(`Update failed: ${error.message}`);
      onError(error);
    } else {
      console.log("Agreement updated successfully:", data);
      toast.success("Agreement updated successfully!");
      
      if (isChangingToActive && currentStatus !== 'active') {
        console.log(`Agreement ${id} status changed to active. Generating payment schedule...`);
        try {
          const result = await forceGeneratePaymentForAgreement(supabase, id);
          if (result.success) {
            toast.success("Payment schedule generated automatically");
          } else {
            console.warn("Could not generate payment schedule:", result.message);
            toast.warning(`Agreement updated, but payment schedule generation had an issue: ${result.message}`);
          }
        } catch (paymentError) {
          console.error("Error generating payment schedule:", paymentError);
          toast.warning("Agreement updated, but payment schedule could not be generated");
        }
      }
      
      onSuccess();
    }
  } catch (error) {
    console.error("Unexpected error during update:", error);
    toast.error("An unexpected error occurred during the update.");
    onError(error);
  }
};

export const checkVehicleAvailability = async (vehicleId: string): Promise<{ 
  isAvailable: boolean; 
  existingAgreement?: any 
}> => {
  try {
    const { data, error } = await supabase
      .from('leases')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .eq('status', 'active')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { isAvailable: true };
      }
      console.error("Error checking vehicle availability:", error);
      throw error;
    }

    return { 
      isAvailable: false,
      existingAgreement: data
    };
  } catch (error) {
    console.error("Error in checkVehicleAvailability:", error);
    return { isAvailable: true };
  }
};

export const activateAgreement = async (agreementId: string, vehicleId: string): Promise<boolean> => {
  try {
    console.log(`Activating agreement ${agreementId} for vehicle ${vehicleId}`);
    
    const { data: existingAgreements, error: checkError } = await supabase
      .from('leases')
      .select('id, agreement_number')
      .eq('vehicle_id', vehicleId)
      .eq('status', 'active');
      
    if (checkError) {
      console.error("Error checking existing agreements:", checkError);
      toast.error("Failed to check existing agreements");
      return false;
    }
    
    if (existingAgreements && existingAgreements.length > 0) {
      console.log(`Found ${existingAgreements.length} active agreements to close`);
      
      for (const agreement of existingAgreements) {
        if (agreement.id === agreementId) continue;
        
        console.log(`Closing agreement ${agreement.agreement_number} (${agreement.id})`);
        const { error: closeError } = await supabase
          .from('leases')
          .update({ status: 'closed' })
          .eq('id', agreement.id);
          
        if (closeError) {
          console.error(`Failed to close agreement ${agreement.id}:`, closeError);
          toast.error(`Failed to close existing agreement ${agreement.agreement_number}`);
          return false;
        }
        
        toast.success(`Closed existing agreement ${agreement.agreement_number}`);
      }
    }
    
    const { error: vehicleUpdateError } = await supabase
      .from('vehicles')
      .update({ status: 'rented' })
      .eq('id', vehicleId);
      
    if (vehicleUpdateError) {
      console.error("Failed to update vehicle status:", vehicleUpdateError);
      toast.error("Failed to update vehicle status");
      return false;
    }
    
    try {
      const { data: agreement, error: agreementError } = await supabase
        .from('leases')
        .select('rent_amount, agreement_number')
        .eq('id', agreementId)
        .single();
      
      if (agreementError) {
        console.error("Error fetching agreement details for payment generation:", agreementError);
        toast.warning("Agreement activated, but could not generate payment schedule");
      } else if (agreement) {
        console.log(`Generating payment schedule for agreement ${agreement.agreement_number}`);
        const result = await forceGeneratePaymentForAgreement(supabase, agreementId);
        
        if (result.success) {
          toast.success("Payment schedule generated successfully");
        } else {
          console.warn("Could not generate payment schedule:", result.message);
          toast.warning(`Agreement activated, but payment schedule generation had an issue: ${result.message}`);
        }
      }
    } catch (paymentError) {
      console.error("Error generating payment schedule:", paymentError);
      toast.warning("Agreement activated, but payment schedule could not be generated");
    }
    
    console.log(`Successfully activated agreement ${agreementId}`);
    return true;
  } catch (error) {
    console.error("Error in activateAgreement:", error);
    toast.error("An unexpected error occurred during agreement activation");
    return false;
  }
};

export const checkAndCreateMissingPaymentSchedules = async (): Promise<{
  success: boolean;
  generatedCount: number;
  message: string;
  error?: any;
}> => {
  try {
    console.log("Checking for active agreements without payment schedules");
    
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const { data: activeAgreements, error: agreementsError } = await supabase
      .from('leases')
      .select('id, rent_amount, agreement_number, start_date, daily_late_fee')
      .eq('status', 'active');
      
    if (agreementsError) {
      console.error("Error fetching active agreements:", agreementsError);
      return { 
        success: false, 
        generatedCount: 0,
        message: `Error fetching agreements: ${agreementsError.message}`,
        error: agreementsError
      };
    }
    
    if (!activeAgreements || activeAgreements.length === 0) {
      console.log("No active agreements found");
      return { 
        success: true, 
        generatedCount: 0,
        message: "No active agreements found"
      };
    }
    
    console.log(`Found ${activeAgreements.length} active agreements, checking for missing payment schedules`);
    
    let generatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const agreement of activeAgreements) {
      if (!agreement.start_date) {
        console.warn(`Agreement ${agreement.agreement_number} has no start date, skipping`);
        skippedCount++;
        continue;
      }
      
      const startDate = new Date(agreement.start_date);
      
      if (startDate <= new Date(currentYear, currentMonth + 1, 0)) {
        const startMonth = startDate.getMonth();
        const startYear = startDate.getFullYear();
        
        const totalMonths = (currentYear - startYear) * 12 + (currentMonth - startMonth) + 1;
        
        const { data: existingPayments, error: paymentsError } = await supabase
          .from('unified_payments')
          .select('id, payment_date, original_due_date')
          .eq('lease_id', agreement.id)
          .eq('type', 'rent');
          
        if (paymentsError) {
          console.error(`Error checking payments for agreement ${agreement.id}:`, paymentsError);
          errorCount++;
          continue;
        }
        
        const paidMonths = new Set<string>();
        if (existingPayments) {
          existingPayments.forEach(payment => {
            const dateToUse = payment.original_due_date || payment.payment_date;
            if (dateToUse) {
              const paymentDate = new Date(dateToUse);
              paidMonths.add(`${paymentDate.getMonth()}-${paymentDate.getFullYear()}`);
            }
          });
        }
        
        for (let i = 0; i < totalMonths; i++) {
          const monthToCheck = new Date(startYear, startMonth + i, 1);
          const monthKey = `${monthToCheck.getMonth()}-${monthToCheck.getFullYear()}`;
          
          if (!paidMonths.has(monthKey)) {
            console.log(`Generating payment for agreement ${agreement.agreement_number} for ${monthToCheck.toLocaleString('default', { month: 'long', year: 'numeric' })}`);
            
            try {
              const result = await forceGeneratePaymentForAgreement(supabase, agreement.id, monthToCheck);
              
              if (result.success) {
                console.log(`Successfully generated payment for agreement ${agreement.agreement_number} for ${monthToCheck.toLocaleString('default', { month: 'long', year: 'numeric' })}`);
                generatedCount++;
              } else {
                console.warn(`Failed to generate payment for agreement ${agreement.agreement_number}:`, result.message);
                errorCount++;
              }
            } catch (error) {
              console.error(`Error generating payment for agreement ${agreement.id}:`, error);
              errorCount++;
            }
          } else {
            skippedCount++;
          }
        }
      } else {
        console.log(`Agreement ${agreement.agreement_number} starts in the future, skipping`);
        skippedCount++;
      }
    }
    
    console.log(`Completed checking ${activeAgreements.length} agreements. Generated ${generatedCount} payment schedules. Skipped ${skippedCount} months with existing payments. Encountered ${errorCount} errors.`);
    
    return {
      success: true,
      generatedCount,
      message: `Generated ${generatedCount} payment schedules. Skipped ${skippedCount} months with existing payments. Encountered ${errorCount} errors.`
    };
  } catch (error) {
    console.error("Unexpected error in checkAndCreateMissingPaymentSchedules:", error);
    return {
      success: false,
      generatedCount: 0,
      message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
      error
    };
  }
};
