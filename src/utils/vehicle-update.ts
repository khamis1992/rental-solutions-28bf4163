
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { checkSupabaseHealth } from '@/integrations/supabase/client';
import { mapToDBStatus } from '@/lib/vehicles/vehicle-mappers';
import { VehicleStatus } from '@/types/vehicle';
import { withTimeoutAndRetry } from '@/utils/promise';

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

    // Use withTimeoutAndRetry for the database update
    const updateResult = await withTimeoutAndRetry(
      async () => {
        const { data: updatedVehicle, error } = await supabase
          .from('vehicles')
          .update(updateData)
          .eq('id', id)
          .select('*, vehicle_types(*)')
          .maybeSingle();
          
        if (error) {
          throw error;
        }
        
        return updatedVehicle;
      },
      {
        retries: 2,
        retryDelayMs: 1000,
        timeoutMs: 5000,
        operationName: `Update vehicle ${id}`,
        onProgress: (message) => console.log(message)
      }
    );

    if (!updateResult.success) {
      console.error(`All update attempts failed:`, updateResult.error);
      return { 
        success: false, 
        message: `Failed to update after multiple attempts: ${updateResult.error?.message || 'Unknown error'}`
      };
    }
    
    if (!updateResult.data) {
      console.log('Update may have succeeded but no data returned, fetching vehicle data separately');
      const fetchResult = await withTimeoutAndRetry(
        async () => {
          const { data, error } = await supabase
            .from('vehicles')
            .select('*, vehicle_types(*)')
            .eq('id', id)
            .maybeSingle();
            
          if (error) {
            throw error;
          }
          
          return data;
        },
        {
          retries: 1,
          retryDelayMs: 500,
          operationName: 'Fetch updated vehicle data'
        }
      );
      
      if (!fetchResult.success) {
        return {
          success: true,
          message: 'Vehicle updated but failed to fetch updated data',
        };
      }
      
      console.log(`Successfully updated vehicle:`, fetchResult.data);
      return { 
        success: true, 
        message: `Vehicle updated successfully`,
        data: fetchResult.data
      };
    }
    
    console.log(`Successfully updated vehicle:`, updateResult.data);
    return { 
      success: true, 
      message: `Vehicle updated successfully`,
      data: updateResult.data
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
 * Update just the vehicle status with proper error handling and forced verification
 * This is the main function used by the StatusUpdateDialog
 */
export const updateVehicleStatus = async (
  id: string,
  status: VehicleStatus
): Promise<{ success: boolean; message: string; data?: any }> => {
  console.log(`updateVehicleStatus: Updating vehicle ${id} status to ${status}`);
  
  // Validate the status to ensure it's a valid VehicleStatus value
  const validStatuses: VehicleStatus[] = [
    'available', 'rented', 'reserved', 'maintenance', 
    'police_station', 'accident', 'stolen', 'retired'
  ];
  
  if (!validStatuses.includes(status)) {
    console.error(`Invalid status value provided: ${status}`);
    return {
      success: false,
      message: `Invalid status value: ${status}. Must be one of: ${validStatuses.join(', ')}`
    };
  }
  
  try {
    console.log(`Status value before mapping: ${status}`);
    const dbStatus = mapToDBStatus(status);
    console.log(`Status value after mapping to DB format: ${dbStatus}`);
    
    // First verify the vehicle exists
    const { data: vehicle, error: checkError } = await supabase
      .from('vehicles')
      .select('id, status')
      .eq('id', id)
      .maybeSingle();
      
    if (checkError) {
      console.error('Error checking vehicle existence:', checkError);
      return {
        success: false,
        message: `Failed to verify vehicle: ${checkError.message}`
      };
    }
    
    if (!vehicle) {
      console.error(`Vehicle with ID ${id} not found`);
      return {
        success: false,
        message: `Vehicle with ID ${id} not found`
      };
    }
    
    console.log(`Current vehicle DB status: ${vehicle.status}`);
    
    // Using withTimeoutAndRetry for the status update operation
    const updateResult = await withTimeoutAndRetry(
      async () => {
        // Perform a direct update to the database with consistent timestamp
        const timestamp = new Date().toISOString();
        console.log(`Performing direct database update for vehicle ${id} to status "${dbStatus}" with timestamp ${timestamp}`);
        
        const { data, error } = await supabase
          .from('vehicles')
          .update({ 
            status: dbStatus,
            updated_at: timestamp
          })
          .eq('id', id)
          .select('*');
          
        if (error) {
          throw error;
        }
        
        return data;
      },
      {
        retries: 2,
        retryDelayMs: 500,
        timeoutMs: 5000,
        operationName: `Update vehicle ${id} status to ${status}`
      }
    );
    
    if (!updateResult.success) {
      return {
        success: false,
        message: `Status update failed: ${updateResult.error?.message || 'Unknown error'}`
      };
    }
    
    // Add a small delay before verification
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Verify status was actually updated with a separate query
    const { data: verifyData, error: verifyError } = await supabase
      .from('vehicles')
      .select('id, status, updated_at')
      .eq('id', id)
      .maybeSingle();
      
    if (verifyError) {
      console.error('Verification query failed:', verifyError);
      return {
        success: false,
        message: `Update succeeded but verification failed: ${verifyError.message}`
      };
    } else {
      console.log(`Verification query shows status is now: ${verifyData?.status}`);
      
      // Double check that the status was actually updated as expected
      if (verifyData?.status !== dbStatus) {
        console.error(`Status verification failed: expected ${dbStatus}, got ${verifyData?.status}`);
        
        // Try one more time with a direct update
        const forceUpdateResult = await withTimeoutAndRetry(
          async () => {
            const { error } = await supabase
              .from('vehicles')
              .update({ 
                status: dbStatus,
                updated_at: new Date().toISOString() 
              })
              .eq('id', id);
              
            if (error) {
              throw error;
            }
            
            return true;
          },
          {
            retries: 1,
            operationName: 'Force status update'
          }
        );
        
        if (!forceUpdateResult.success) {
          return {
            success: false,
            message: `Status update verification failed. Database inconsistent.`
          };
        }
        
        console.log("Final force update completed, status should be updated now");
      }
    }
    
    return {
      success: true,
      message: `Vehicle status updated to ${status}`,
      data: updateResult.data || verifyData
    };
  } catch (err) {
    console.error('Error in status update:', err);
    return {
      success: false,
      message: `Error in status update: ${err instanceof Error ? err.message : 'Unknown error occurred'}`
    };
  }
};
