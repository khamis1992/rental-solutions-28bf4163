
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { checkSupabaseHealth } from '@/integrations/supabase/client';
import { mapToDBStatus } from '@/lib/vehicles/vehicle-mappers';
import { VehicleStatus } from '@/types/vehicle';

export const updateVehicleInfo = async (
  id: string, 
  data: Partial<{
    status: VehicleStatus;
    make: string;
    model: string;
    year: number;
    license_plate: string;
    vin: string;
    color: string;
    mileage: number;
    location: string;
    description: string;
    insurance_company: string;
    insurance_expiry: string | null;
    rent_amount: number;
    vehicle_type_id: string;
  }>
): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    console.log(`Attempting to update vehicle ${id}`);
    
    // First check database connection
    const connectionStatus = await checkSupabaseHealth();
    if (!connectionStatus.isHealthy) {
      console.error('Database connection error:', connectionStatus.error);
      return { 
        success: false, 
        message: `Database connection error: ${connectionStatus.error || 'Cannot connect to database'}` 
      };
    }
    
    // Validate input parameters
    if (!id || typeof id !== 'string' || id.trim() === '') {
      console.error('Invalid vehicle ID provided:', id);
      return { 
        success: false,
        message: 'Invalid vehicle ID provided' 
      };
    }

    // Verify vehicle exists before updating
    const { data: vehicle, error: checkError } = await supabase
      .from('vehicles')
      .select('id, status')
      .eq('id', id)
      .single();
      
    if (checkError) {
      console.error(`Error checking if vehicle exists:`, checkError);
      return { 
        success: false, 
        message: `Error verifying vehicle: ${checkError.message}` 
      };
    }
    
    if (!vehicle) {
      return { 
        success: false, 
        message: `Vehicle with ID ${id} not found` 
      };
    }

    // Prepare update data
    const updateData: any = { ...data };
    
    // Map status if provided
    if (updateData.status) {
      updateData.status = mapToDBStatus(updateData.status);
    }
    
    // Add updated timestamp
    updateData.updated_at = new Date().toISOString();
    
    // Update the vehicle
    const { data: updatedVehicle, error } = await supabase
      .from('vehicles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating vehicle:', error);
      return { 
        success: false, 
        message: `Failed to update vehicle: ${error.message}` 
      };
    }
    
    console.log(`Successfully updated vehicle:`, updatedVehicle);
    return { 
      success: true, 
      message: `Vehicle updated successfully`,
      data: updatedVehicle
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Unexpected error updating vehicle:', err);
    return { 
      success: false, 
      message: `Unexpected error: ${errorMessage}` 
    };
  }
};
