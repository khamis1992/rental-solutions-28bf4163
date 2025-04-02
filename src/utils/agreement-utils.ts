
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Agreement, AgreementStatus } from '@/lib/validation-schemas/agreement';
import { SimpleAgreement } from '@/hooks/use-agreements';

// Helper function to adapt SimpleAgreement to Agreement type for detail pages
export const adaptSimpleToFullAgreement = (simpleAgreement: SimpleAgreement): Agreement => {
  return {
    ...simpleAgreement,
    id: simpleAgreement.id,
    customer_id: simpleAgreement.customer_id,
    vehicle_id: simpleAgreement.vehicle_id,
    start_date: simpleAgreement.start_date ? new Date(simpleAgreement.start_date) : new Date(),
    end_date: simpleAgreement.end_date ? new Date(simpleAgreement.end_date) : new Date(),
    status: simpleAgreement.status as typeof AgreementStatus[keyof typeof AgreementStatus],
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
      onSuccess();
    }
  } catch (error) {
    console.error("Unexpected error during update:", error);
    toast.error("An unexpected error occurred during the update.");
    onError(error);
  }
};

// Check if a vehicle is available or assigned to another active agreement
export const checkVehicleAvailability = async (vehicleId: string): Promise<{ 
  isAvailable: boolean; 
  existingAgreement?: any 
}> => {
  try {
    // Check if vehicle is assigned to any active agreement
    const { data, error } = await supabase
      .from('leases')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .eq('status', 'active')
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
export const activateAgreement = async (agreementId: string, vehicleId: string): Promise<boolean> => {
  try {
    console.log(`Activating agreement ${agreementId} for vehicle ${vehicleId}`);
    
    // Check if vehicle is assigned to any active agreements
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
    
    console.log(`Successfully activated agreement ${agreementId}`);
    return true;
  } catch (error) {
    console.error("Error in activateAgreement:", error);
    toast.error("An unexpected error occurred during agreement activation");
    return false;
  }
};
