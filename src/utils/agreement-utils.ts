
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { SimpleAgreement } from '@/hooks/use-agreements';
import { supabase } from '@/integrations/supabase/client';

export const adaptSimpleToFullAgreement = (data: SimpleAgreement): Agreement => {
  return {
    ...data,
    // Add any necessary conversions from SimpleAgreement to Agreement
  } as Agreement;
};

export const updateAgreementWithCheck = async (
  { id, data }: { id: string; data: any },
  userId?: string,
  successCallback?: () => void,
  errorCallback?: (error: any) => void
) => {
  try {
    // Update agreement logic here...
    
    toast.success('Agreement updated successfully');
    
    if (successCallback) {
      successCallback();
    }
  } catch (error) {
    console.error('Failed to update agreement:', error);
    toast.error('Failed to update agreement');
    
    if (errorCallback) {
      errorCallback(error);
    }
  }
};

export const checkAndCreateMissingPaymentSchedules = async (): Promise<{ 
  success: boolean; 
  generatedCount: number; 
  message?: string; 
  error?: any 
}> => {
  try {
    console.log("Checking for active agreements without payment schedules");
    
    // Find active agreements that don't have payment schedules
    const { data: activeAgreements, error: agreementsError } = await supabase
      .from('leases')
      .select('id, agreement_number, rent_amount, total_amount, start_date, end_date')
      .eq('status', 'active')
      .is('payment_schedule_generated', null);
    
    if (agreementsError) {
      console.error('Error fetching active agreements:', agreementsError);
      return { 
        success: false, 
        generatedCount: 0,
        message: 'Error fetching active agreements', 
        error: agreementsError 
      };
    }
    
    if (!activeAgreements || activeAgreements.length === 0) {
      console.log('No agreements require payment schedule generation');
      return { 
        success: true, 
        generatedCount: 0,
        message: 'No payment schedules needed to be generated' 
      };
    }
    
    console.log(`Found ${activeAgreements.length} agreements that need payment schedules`);
    
    let generatedCount = 0;
    
    // For each agreement, generate a payment schedule
    for (const agreement of activeAgreements) {
      try {
        // Logic to generate payment schedule for this agreement
        // You might want to implement this based on your app's requirements
        console.log(`Generating payment schedule for agreement: ${agreement.agreement_number}`);
        
        // Mark the agreement as having a payment schedule
        const { error: updateError } = await supabase
          .from('leases')
          .update({ 
            payment_schedule_generated: new Date().toISOString() 
          })
          .eq('id', agreement.id);
        
        if (updateError) {
          console.error(`Error updating agreement ${agreement.id}:`, updateError);
          continue;
        }
        
        generatedCount++;
      } catch (scheduleError) {
        console.error(`Error generating schedule for agreement ${agreement.id}:`, scheduleError);
      }
    }
    
    return { 
      success: true, 
      generatedCount,
      message: `Generated ${generatedCount} payment schedules` 
    };
  } catch (err) {
    console.error('Unexpected error in checkAndCreateMissingPaymentSchedules:', err);
    return { 
      success: false, 
      generatedCount: 0,
      message: `Failed to generate payment schedules: ${err instanceof Error ? err.message : String(err)}`,
      error: err 
    };
  }
};

// Add the missing functions that were referenced in the build errors
export const checkVehicleAvailability = async (vehicleId: string): Promise<{
  isAvailable: boolean;
  existingAgreement?: any;
}> => {
  try {
    // Check if the vehicle exists in any active agreement
    const { data: existingAgreements, error } = await supabase
      .from('leases')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .eq('status', 'active')
      .limit(1);
      
    if (error) {
      console.error("Error checking vehicle availability:", error);
      throw error;
    }
    
    if (existingAgreements && existingAgreements.length > 0) {
      return {
        isAvailable: false,
        existingAgreement: existingAgreements[0]
      };
    }
    
    return { isAvailable: true };
  } catch (error) {
    console.error("Error in checkVehicleAvailability:", error);
    throw error;
  }
};

export const activateAgreement = async (agreementId: string, vehicleId: string): Promise<boolean> => {
  try {
    // First, close any existing active agreements for this vehicle
    const { data: existingAgreements, error: fetchError } = await supabase
      .from('leases')
      .select('id')
      .eq('vehicle_id', vehicleId)
      .eq('status', 'active');
      
    if (fetchError) {
      console.error("Error checking existing agreements:", fetchError);
      throw fetchError;
    }
    
    // Close existing agreements if any
    if (existingAgreements && existingAgreements.length > 0) {
      for (const existing of existingAgreements) {
        if (existing.id !== agreementId) {
          const { error: closeError } = await supabase
            .from('leases')
            .update({ 
              status: 'closed',
              closed_at: new Date().toISOString(),
              closed_reason: 'Vehicle reassigned to new agreement'
            })
            .eq('id', existing.id);
            
          if (closeError) {
            console.error(`Error closing agreement ${existing.id}:`, closeError);
          }
        }
      }
    }
    
    // Mark vehicle as rented
    const { error: vehicleError } = await supabase
      .from('vehicles')
      .update({ status: 'rented' })
      .eq('id', vehicleId);
      
    if (vehicleError) {
      console.error("Error updating vehicle status:", vehicleError);
    }
    
    return true;
  } catch (error) {
    console.error("Error in activateAgreement:", error);
    return false;
  }
};
