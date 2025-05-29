
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Vehicle,
  VehicleFormData,
  VehicleInsertData,
  VehicleUpdateData,
  VehicleStatus,
} from '@/types/vehicle';
import { supabase } from '@/lib/supabase';
import { checkSupabaseHealth } from '@/lib/supabase';
import { mapDatabaseRecordToVehicle, mapToDBStatus } from '@/lib/vehicles/vehicle-mappers';
import { handleApiError } from '@/hooks/use-api';
import { uploadVehicleImage } from '@/lib/vehicles/vehicle-storage';

export const useVehicleMutations = () => {
  const queryClient = useQueryClient();

  const useCreate = () => {
    return useMutation({
      mutationFn: async (formData: VehicleFormData): Promise<Vehicle> => {
        try {
          let imageUrl = null;
          if (formData.image) {
            try {
              const tempId = crypto.randomUUID();
              imageUrl = await uploadVehicleImage(formData.image, tempId);
            } catch (error) {
              console.error('Error uploading image:', error);
              toast.error('Failed to upload image', {
                description: error instanceof Error ? error.message : 'Unknown error occurred',
              });
              throw error;
            }
          }
          
          const vehicleData: VehicleInsertData = {
            make: formData.make,
            model: formData.model,
            year: typeof formData.year === 'string' ? parseInt(formData.year, 10) : formData.year,
            license_plate: formData.license_plate,
            vin: formData.vin,
            color: formData.color || null,
            mileage: formData.mileage || 0,
            description: formData.description || null,
            location: formData.location || null,
            insurance_company: formData.insurance_company || null,
            insurance_expiry: formData.insurance_expiry || null,
            rent_amount: formData.rent_amount || null,
            vehicle_type_id: formData.vehicle_type_id === 'none' ? null : formData.vehicle_type_id,
            image_url: imageUrl,
            status: (formData.status ? mapToDBStatus(formData.status) : 'available') as VehicleStatus,
          };
          
          const { data, error } = await supabase
            .from('vehicles')
            .insert(vehicleData)
            .select('*, vehicle_types(*)')
            .maybeSingle();
            
          if (error) {
            throw error;
          }
          
          if (!data) {
            throw new Error('Vehicle was created but no data was returned');
          }
          
          if (imageUrl && formData.image) {
            try {
              const newImageUrl = await uploadVehicleImage(formData.image, data.id);
              
              const { error: updateError } = await supabase
                .from('vehicles')
                .update({ image_url: newImageUrl })
                .eq('id', data.id);
                
              if (updateError) {
                console.error('Error updating vehicle with final image URL:', updateError);
              } else {
                data.image_url = newImageUrl;
              }
            } catch (imageError) {
              console.error('Error updating image with final ID:', imageError);
            }
          }
          
          return mapDatabaseRecordToVehicle(data);
        } catch (error) {
          handleApiError(error, 'Failed to create vehicle');
          throw error;
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['vehicles'] });
        toast.success('Vehicle added successfully');
      },
    });
  };

  const useUpdate = () => {
    return useMutation({
      mutationFn: async ({ id, data }: { id: string; data: VehicleFormData }): Promise<Vehicle> => {
        try {
          if (!id) {
            throw new Error('Vehicle ID is required for update');
          }

          const { isHealthy, error: healthError } = await checkSupabaseHealth();
          if (!isHealthy) {
            throw new Error(`Database connection error: ${healthError || 'Connection failed'}`);
          }
          
          const { data: existingVehicle, error: checkError } = await supabase
            .from('vehicles')
            .select('id, status')
            .eq('id', id)
            .maybeSingle();
            
          if (checkError) {
            console.error('Error checking if vehicle exists:', checkError);
            throw new Error(`Failed to verify vehicle: ${checkError.message}`);
          }
          
          if (!existingVehicle) {
            console.error('Vehicle not found with ID:', id);
            throw new Error(`Vehicle with ID ${id} not found`);
          }
          
          let imageUrl = null;
          if (data.image) {
            try {
              imageUrl = await uploadVehicleImage(data.image, id);
            } catch (error) {
              console.error('Error uploading image:', error);
              toast.error('Failed to upload image', {
                description: error instanceof Error ? error.message : 'Unknown error occurred',
              });
              throw error;
            }
          }
          
          const vehicleData: VehicleUpdateData = {};
          
          if (data.make !== undefined) vehicleData.make = data.make;
          if (data.model !== undefined) vehicleData.model = data.model;
          if (data.year !== undefined) vehicleData.year = data.year;
          if (data.license_plate !== undefined) vehicleData.license_plate = data.license_plate;
          if (data.vin !== undefined) vehicleData.vin = data.vin;
          
          if (data.color !== undefined) vehicleData.color = data.color;
          
          if (data.status !== undefined) {
            const newStatus = mapToDBStatus(data.status);
            vehicleData.status = newStatus as VehicleStatus;
          }
        
          if (data.mileage !== undefined) vehicleData.mileage = data.mileage;
          if (data.description !== undefined) vehicleData.description = data.description;
          if (data.location !== undefined) vehicleData.location = data.location;
          if (data.insurance_company !== undefined) vehicleData.insurance_company = data.insurance_company;
          
          if ('insurance_expiry' in data) {
            vehicleData.insurance_expiry = data.insurance_expiry || null;
          }
          
          if (data.rent_amount !== undefined) vehicleData.rent_amount = data.rent_amount;
          
          if (data.vehicle_type_id !== undefined) {
            vehicleData.vehicle_type_id = data.vehicle_type_id === 'none' ? null : data.vehicle_type_id;
          }
          
          if (imageUrl) vehicleData.image_url = imageUrl;
          
          let attempt = 0;
          const maxAttempts = 3;
          let lastError = null;
          let updatedVehicle = null;
          
          while (attempt < maxAttempts && !updatedVehicle) {
            try {
              const { data: result, error } = await supabase
                .from('vehicles')
                .update(vehicleData)
                .eq('id', id)
                .select('*, vehicle_types(*)')
                .maybeSingle();
                
              if (error) {
                console.error(`Update attempt ${attempt + 1} failed:`, error);
                lastError = error;
                attempt++;
                if (attempt < maxAttempts) {
                  await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt)));
                  continue;
                }
                throw error;
              }

              if (!result) {
                const { data: fetchedVehicle, error: fetchError } = await supabase
                  .from('vehicles')
                  .select('*, vehicle_types(*)')
                  .eq('id', id)
                  .maybeSingle();
                  
                if (fetchError) {
                  console.error('Error fetching updated vehicle:', fetchError);
                  throw new Error(`Vehicle updated but failed to fetch updated data: ${fetchError.message}`);
                }
                
                if (!fetchedVehicle) {
                  console.error('Vehicle not found after update:', id);
                  throw new Error('Vehicle was updated but could not be found afterwards');
                }
                
                updatedVehicle = mapDatabaseRecordToVehicle(fetchedVehicle);
              } else {
                updatedVehicle = mapDatabaseRecordToVehicle(result);
              }
            } catch (e) {
              console.error(`Update attempt ${attempt + 1} failed with exception:`, e);
              lastError = e;
              attempt++;
              
              if (attempt < maxAttempts) {
                await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt)));
              } else {
                throw e;
              }
            }
          }
          
          if (!updatedVehicle) {
            throw lastError || new Error('Failed to update vehicle after multiple attempts');
          }
          
          return updatedVehicle;
        } catch (error) {
          console.error('Update vehicle error details:', error);
          handleApiError(error, 'Failed to update vehicle');
          throw error;
        }
      },
      onSuccess: (updatedVehicle, variables) => {
        queryClient.invalidateQueries({ queryKey: ['vehicles'] });
        queryClient.invalidateQueries({ queryKey: ['vehicles', variables.id] });
        queryClient.setQueryData(['vehicles', variables.id], updatedVehicle);
      },
    });
  };

  const useDelete = () => {
    return useMutation({
      mutationFn: async (id: string): Promise<string> => {
        try {
          const { data: leases, error: leasesError } = await supabase
            .from('leases')
            .select('id')
            .eq('vehicle_id', id)
            .eq('status', 'active')
            .limit(1);
            
          if (leasesError) {
            throw leasesError;
          }
          
          if (leases && leases.length > 0) {
            throw new Error('Cannot delete a vehicle that is currently in use');
          }
          
          const { data: vehicle, error: vehicleError } = await supabase
            .from('vehicles')
            .select('image_url')
            .eq('id', id)
            .maybeSingle();
            
          if (vehicleError) {
            throw vehicleError;
          }
          
          const { error } = await supabase
            .from('vehicles')
            .delete()
            .eq('id', id);
            
          if (error) {
            throw error;
          }
          
          if (vehicle && vehicle.image_url) {
            try {
              const urlParts = vehicle.image_url.split('/');
              const fileName = urlParts[urlParts.length - 1];
              
              await supabase.storage
                .from('vehicle-images')
                .remove([fileName]);
            } catch (storageError) {
              console.error('Failed to delete vehicle image:', storageError);
            }
          }
          
          return id;
        } catch (error) {
          handleApiError(error, 'Failed to delete vehicle');
          throw error;
        }
      },
      onSuccess: (id) => {
        queryClient.invalidateQueries({ queryKey: ['vehicles'] });
        toast.success('Vehicle deleted successfully');
      },
    });
  };

  return {
    useCreate,
    useUpdate,
    useDelete,
  };
};
