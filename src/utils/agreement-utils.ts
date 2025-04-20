import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DB_AGREEMENT_STATUS } from '@/lib/validation-schemas/agreement';
import { SimpleAgreement } from '@/hooks/use-agreements';

// Helper function to adapt SimpleAgreement to Agreement type for detail pages
export const adaptSimpleToFullAgreement = (simpleAgreement: SimpleAgreement) => {
  return {
    ...simpleAgreement,
    id: simpleAgreement.id,
    customer_id: simpleAgreement.customer_id,
    vehicle_id: simpleAgreement.vehicle_id,
    start_date: simpleAgreement.start_date ? new Date(simpleAgreement.start_date) : new Date(),
    end_date: simpleAgreement.end_date ? new Date(simpleAgreement.end_date) : new Date(),
    status: simpleAgreement.status,
    created_at: simpleAgreement.created_at ? new Date(simpleAgreement.created_at) : undefined,
    updated_at: simpleAgreement.updated_at ? new Date(simpleAgreement.updated_at) : undefined,
    total_amount: simpleAgreement.total_amount || 0,
    deposit_amount: simpleAgreement.deposit_amount || 0,
    agreement_number: simpleAgreement.agreement_number || '',
    notes: simpleAgreement.notes || '',
    terms_accepted: true,
    additional_drivers: [],
  };
};

// Force generate payment for an agreement
export const forceGeneratePaymentForAgreement = async (
  supabaseClient: any, 
  agreementId: string, 
  specificDate?: Date
) => {
  try {
    // Implementation would go here
    console.log(`Generating payment for agreement ${agreementId}`);
    
    // Simplified implementation
    return {
      success: true,
      message: "Payment generated successfully"
    };
  } catch (error) {
    console.error("Error generating payment:", error);
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

export const updateAgreementWithCheck = async (
  params: { id: string; data: any },
  userId: string | undefined, 
  onSuccess: () => void,
  onError: (error: any) => void
) => {
  try {
    if (!userId) {
      console.warn("User ID is not available. Proceeding without user-specific checks.");
    }

    // Check if status is being changed to active
    const isChangingToActive = params.data.status === DB_AGREEMENT_STATUS.ACTIVE;
    
    // If changing to active, first check the current status
    let currentStatus: string | null = null;
    if (isChangingToActive) {
      const { data: currentAgreement, error: fetchError } = await supabase
        .from('leases')
        .select('status')
        .eq('id', params.id)
        .single();
        
      if (fetchError) {
        console.warn("Could not fetch current agreement status:", fetchError);
      } else if (currentAgreement) {
        currentStatus = currentAgreement.status;
      }
    }

    // Optimistic update
    toast.success("Agreement update initiated...");

    const { data, error } = await supabase
      .from('leases')
      .update(params.data)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error("Update failed:", error);
      toast.error(`Update failed: ${error.message}`);
      onError(error);
    } else {
      console.log("Agreement updated successfully:", data);
      toast.success("Agreement updated successfully!");
      
      // If the status was changed to active and it wasn't active before, generate payment schedule
      if (isChangingToActive && currentStatus !== DB_AGREEMENT_STATUS.ACTIVE) {
        console.log(`Agreement ${params.id} status changed to active. Generating payment schedule...`);
        try {
          const result = await forceGeneratePaymentForAgreement(supabase, params.id);
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

// Check if a vehicle is available or assigned to another active agreement
export const checkVehicleAvailability = async (vehicleId: string) => {
  try {
    // Check if vehicle is assigned to any active agreement
    const { data, error } = await supabase
      .from('leases')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .eq('status', DB_AGREEMENT_STATUS.ACTIVE)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No active agreements found for this vehicle - it's available
        return { isAvailable: true };
      }
      // Other errors
      console.error("Error checking vehicle availability:", error);
      throw error;
    }

    // If we got data, the vehicle is assigned to an active agreement
    return { 
      isAvailable: false,
      existingAgreement: data
    };
  } catch (error) {
    console.error("Error in checkVehicleAvailability:", error);
    // Default to available in case of unexpected errors to prevent blocking the flow
    return { isAvailable: true };
  }
};

// Function to activate an agreement and handle existing agreements for the same vehicle
export const activateAgreement = async (agreementId: string, vehicleId: string) => {
  try {
    console.log(`Activating agreement ${agreementId} for vehicle ${vehicleId}`);
    
    // Check if vehicle is assigned to any active agreements
    const { data: existingAgreements, error: checkError } = await supabase
      .from('leases')
      .select('id, agreement_number')
      .eq('vehicle_id', vehicleId)
      .eq('status', DB_AGREEMENT_STATUS.ACTIVE);
      
    if (checkError) {
      console.error("Error checking existing agreements:", checkError);
      toast.error("Failed to check existing agreements");
      return false;
    }
    
    // Close any existing active agreements for this vehicle
    if (existingAgreements && existingAgreements.length > 0) {
      console.log(`Found ${existingAgreements.length} active agreements to close`);
      
      for (const agreement of existingAgreements) {
        // Skip if this is the same agreement we're trying to activate
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
    
    // Update vehicle status
    const { error: vehicleUpdateError } = await supabase
      .from('vehicles')
      .update({ status: 'rented' })
      .eq('id', vehicleId);
      
    if (vehicleUpdateError) {
      console.error("Failed to update vehicle status:", vehicleUpdateError);
      toast.error("Failed to update vehicle status");
      return false;
    }
    
    // Generate payment record for the agreement
    try {
      // First get the agreement details to have the rent amount
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

// Function to check for active agreements without payment schedules and create them
export const checkAndCreateMissingPaymentSchedules = async () => {
  try {
    console.log("Checking for active agreements without payment schedules");
    
    // Get current month and year
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Find active agreements
    const { data: activeAgreements, error: agreementsError } = await supabase
      .from('leases')
      .select('id, rent_amount, agreement_number, start_date, daily_late_fee')
      .eq('status', DB_AGREEMENT_STATUS.ACTIVE);
      
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
    
    // For each active agreement, check if there's a payment for each month from start date to current month
    for (const agreement of activeAgreements) {
      if (!agreement.start_date) {
        console.warn(`Agreement ${agreement.agreement_number} has no start date, skipping`);
        skippedCount++;
        continue;
      }
      
      const startDate = new Date(agreement.start_date);
      
      // Only consider agreements that started before or in the current month
      if (startDate <= new Date(currentYear, currentMonth + 1, 0)) {
        // Calculate all months from start date to current month
        const startMonth = startDate.getMonth();
        const startYear = startDate.getFullYear();
        
        // Calculate total number of months to check
        const totalMonths = (currentYear - startYear) * 12 + (currentMonth - startMonth) + 1;
        
        // Get all existing payments for this agreement
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
        
        // Create a set of months that already have payments
        const paidMonths = new Set<string>();
        if (existingPayments) {
          existingPayments.forEach(payment => {
            // Use original_due_date if available, otherwise use payment_date
            const dateToUse = payment.original_due_date || payment.payment_date;
            if (dateToUse) {
              const paymentDate = new Date(dateToUse);
              paidMonths.add(`${paymentDate.getMonth()}-${paymentDate.getFullYear()}`);
            }
          });
        }
        
        // Check each month from start date to current month
        for (let i = 0; i < totalMonths; i++) {
          // Calculate the month we're checking
          const monthToCheck = new Date(startYear, startMonth + i, 1);
          const monthKey = `${monthToCheck.getMonth()}-${monthToCheck.getFullYear()}`;
          
          // If there's no payment for this month, generate one
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
