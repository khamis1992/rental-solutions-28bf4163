
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { checkSupabaseHealth } from '@/integrations/supabase/client';
import { mapToDBStatus } from '@/lib/vehicles/vehicle-mappers';
import { VehicleStatus, DatabaseVehicleStatus } from '@/types/vehicle';

/**
 * Updates vehicle information in the database with improved error handling
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
      .maybeSingle();
      
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

    console.log('Current vehicle status in database:', vehicle.status);

    // Prepare update data
    const updateData: any = { ...data };
    
    // Map status if provided - ensure proper type handling
    if (updateData.status) {
      const dbStatus = mapToDBStatus(updateData.status);
      updateData.status = dbStatus;
      console.log(`Mapped status ${data.status} to database status ${dbStatus}`);
    }
    
    // Add updated timestamp
    updateData.updated_at = new Date().toISOString();
    
    console.log('Final update data to be sent to database:', updateData);

    let retryCount = 0;
    const maxRetries = 2;
    let lastError = null;
    
    // Retry loop for database update
    while (retryCount <= maxRetries) {
      try {
        // Update the vehicle
        const { data: updatedVehicle, error } = await supabase
          .from('vehicles')
          .update(updateData)
          .eq('id', id)
          .select('*, vehicle_types(*)')
          .maybeSingle(); // Using maybeSingle to prevent errors
        
        if (error) {
          console.error(`Attempt ${retryCount + 1}: Error updating vehicle:`, error);
          lastError = error;
          retryCount++;
          
          if (retryCount <= maxRetries) {
            console.log(`Retrying update... (${retryCount}/${maxRetries})`);
            await new Promise(r => setTimeout(r, 1000 * retryCount)); // Exponential backoff
            continue;
          }
          break;
        }
        
        if (!updatedVehicle) {
          console.log('Update may have succeeded but no data returned, fetching vehicle data separately');
          const { data: fetchedVehicle, error: fetchError } = await supabase
            .from('vehicles')
            .select('*, vehicle_types(*)')
            .eq('id', id)
            .maybeSingle();
            
          if (fetchError) {
            console.error('Error fetching updated vehicle:', fetchError);
            return {
              success: true,
              message: 'Vehicle updated but failed to fetch updated data',
            };
          }
          
          console.log(`Successfully updated vehicle:`, fetchedVehicle);
          return { 
            success: true, 
            message: `Vehicle updated successfully`,
            data: fetchedVehicle
          };
        }
        
        console.log(`Successfully updated vehicle:`, updatedVehicle);
        return { 
          success: true, 
          message: `Vehicle updated successfully`,
          data: updatedVehicle
        };
      } catch (updateError) {
        console.error(`Attempt ${retryCount + 1}: Unexpected error updating vehicle:`, updateError);
        lastError = updateError;
        retryCount++;
        
        if (retryCount <= maxRetries) {
          await new Promise(r => setTimeout(r, 1000 * retryCount));
          continue;
        }
      }
    }
    
    // If we get here, all retries failed
    const errorMessage = lastError instanceof Error ? lastError.message : 'Unknown error';
    console.error(`All update attempts failed:`, lastError);
    return { 
      success: false, 
      message: `Failed to update after multiple attempts: ${errorMessage}` 
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

/**
 * Find a vehicle by license plate number
 */
export const findVehicleByLicensePlate = async (licensePlate: string): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    if (!licensePlate || licensePlate.trim() === '') {
      return {
        success: false,
        message: 'Please provide a license plate number'
      };
    }

    console.log(`Searching for vehicle with license plate: ${licensePlate}`);
    
    // Check database connection first
    const connectionStatus = await checkSupabaseHealth();
    if (!connectionStatus.isHealthy) {
      return { 
        success: false, 
        message: `Database connection error: ${connectionStatus.error || 'Cannot connect to database'}`
      };
    }
    
    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .select('*, vehicle_types(*)')
      .ilike('license_plate', licensePlate.trim())
      .maybeSingle();
      
    if (error) {
      console.error('Error searching for vehicle:', error);
      return {
        success: false,
        message: `Database error: ${error.message}`
      };
    }
    
    if (!vehicle) {
      return {
        success: false,
        message: `No vehicle found with license plate ${licensePlate}`
      };
    }
    
    console.log('Found vehicle:', vehicle);
    return {
      success: true,
      message: 'Vehicle found',
      data: vehicle
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error finding vehicle by license plate:', err);
    return {
      success: false,
      message: `Error: ${errorMessage}`
    };
  }
};

/**
 * Update just the vehicle status with proper error handling
 */
export const updateVehicleStatus = async (
  id: string,
  status: VehicleStatus
): Promise<{ success: boolean; message: string; data?: any }> => {
  console.log(`Updating vehicle ${id} status to ${status}`);
  
  // Validate the status to ensure it's a valid VehicleStatus value
  const validStatuses: VehicleStatus[] = [
    'available', 'rented', 'reserved', 'maintenance', 
    'police_station', 'accident', 'stolen', 'retired'
  ];
  
  if (!validStatuses.includes(status)) {
    return {
      success: false,
      message: `Invalid status value: ${status}. Must be one of: ${validStatuses.join(', ')}`
    };
  }
  
  // Use the main update function but only send the status
  return updateVehicleInfo(id, { status });
};
