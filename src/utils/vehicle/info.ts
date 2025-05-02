
import { mapToDBStatus } from '@/lib/vehicles/vehicle-mappers';
import { supabase } from '@/lib/supabase';
import { VehicleStatus } from '@/types/vehicle';

/**
 * Updates vehicle information in the database with improved efficiency
 */
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
    console.log(`Attempting to update vehicle ${id} with data:`, data);
    
    // Validate input parameters
    if (!id || typeof id !== 'string' || id.trim() === '') {
      console.error('Invalid vehicle ID provided:', id);
      return { 
        success: false,
        message: 'Invalid vehicle ID provided' 
      };
    }

    // Prepare update data
    const updateData: any = { ...data };
    
    // Map status if provided - ensure proper type handling
    if (updateData.status !== undefined) {
      // Convert any status to proper database format
      try {
        console.log(`Pre-mapping status value: ${updateData.status}`);
        const dbStatus = mapToDBStatus(updateData.status);
        updateData.status = dbStatus;
        console.log(`Mapped status ${data.status} to database status ${dbStatus}`);
      } catch (err) {
        console.error('Error mapping status:', err);
        return {
          success: false,
          message: `Invalid status value: ${updateData.status}`
        };
      }
    }
    
    // Add updated timestamp
    updateData.updated_at = new Date().toISOString();
    
    console.log('Final update data to be sent to database:', updateData);

    // Perform the update in a single operation
    const { data: updatedVehicle, error } = await supabase
      .from('vehicles')
      .update(updateData)
      .eq('id', id)
      .select('*, vehicle_types(*)')
      .maybeSingle();
      
    if (error) {
      console.error(`Update failed:`, error);
      return { 
        success: false, 
        message: `Failed to update: ${error.message}`
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
