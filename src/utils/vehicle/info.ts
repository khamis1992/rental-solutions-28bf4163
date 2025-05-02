
import { checkSupabaseHealth } from '@/integrations/supabase/client';
import { mapToDBStatus } from '@/lib/vehicles/vehicle-mappers';
import { supabase } from '@/lib/supabase';
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
