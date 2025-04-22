import { useQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Vehicle, VehicleFilterParams, VehicleFormData, VehicleInsertData, VehicleUpdateData } from '@/types/vehicle';
import { supabase } from '@/lib/supabase';
import { mapDatabaseRecordToVehicle, mapToDBStatus } from '@/lib/vehicles/vehicle-mappers';
import { handleApiError } from '@/hooks/use-api';
import { uploadVehicleImage } from '@/lib/vehicles/vehicle-storage';
import { executeQuery } from '@/lib/supabase';

// Prefetch configuration
const STALE_TIME = 5 * 60 * 1000; // 5 minutes
const CACHE_TIME = 30 * 60 * 1000; // 30 minutes

// Prefetch vehicles for better UX
export const prefetchVehicles = async (queryClient: QueryClient) => {
  await queryClient.prefetchQuery({
    queryKey: ['vehicles'],
    queryFn: () => executeQuery('vehicles-list', () => 
      supabase
        .from('vehicles')
        .select('*, vehicle_types(*)')
        .order('created_at', { ascending: false })
    ),
    staleTime: STALE_TIME,
  });
};

export const useVehicles = () => {
  const queryClient = useQueryClient();
  
  return {
    useList: (filters?: VehicleFilterParams) => {
      // Memoize filters to prevent unnecessary re-renders
      const memoizedFilters = useMemo(() => filters, [
        filters?.status,
        filters?.make,
        filters?.model,
        filters?.vehicle_type_id,
        filters?.location,
        filters?.year,
        filters?.search
      ]);

      return useQuery({
        queryKey: ['vehicles', memoizedFilters],
        queryFn: async () => {
          try {
            const { data, error } = await executeQuery(
              `vehicles-${JSON.stringify(memoizedFilters)}`,
              async () => {
                let query = supabase
                  .from('vehicles')
                  .select('*, vehicle_types(*)');
                
                if (memoizedFilters) {
                  if (memoizedFilters.status) {
                    query = query.eq('status', memoizedFilters.status === 'reserved' ? 'reserve' : memoizedFilters.status);
                  }
                  if (memoizedFilters.make) query = query.eq('make', memoizedFilters.make);
                  if (memoizedFilters.model) query = query.ilike('model', `%${memoizedFilters.model}%`);
                  if (memoizedFilters.vehicle_type_id) query = query.eq('vehicle_type_id', memoizedFilters.vehicle_type_id);
                  if (memoizedFilters.location) query = query.eq('location', memoizedFilters.location);
                  if (memoizedFilters.year) query = query.eq('year', memoizedFilters.year);
                  if (memoizedFilters.search) {
                    query = query.or(`make.ilike.%${memoizedFilters.search}%,model.ilike.%${memoizedFilters.search}%,license_plate.ilike.%${memoizedFilters.search}%`);
                  }
                }
                
                return query.order('created_at', { ascending: false });
              }
            );

            if (error) throw error;
            return data.map(record => mapDatabaseRecordToVehicle(record));
          } catch (error) {
            handleApiError(error, 'Failed to fetch vehicles');
            throw error;
          }
        },
        staleTime: STALE_TIME,
        cacheTime: CACHE_TIME,
        keepPreviousData: true,
      });
    },
    
    useVehicle: (id: string) => {
      return useQuery({
        queryKey: ['vehicles', id],
        queryFn: async () => {
          if (!id) throw new Error('Vehicle ID is required');
          
          const { data, error } = await executeQuery(
            `vehicle-${id}`,
            () => supabase
              .from('vehicles')
              .select('*, vehicle_types(*)')
              .eq('id', id)
              .maybeSingle()
          );
          
          if (error) throw error;
          if (!data) throw new Error(`Vehicle with ID ${id} not found`);
          
          return mapDatabaseRecordToVehicle(data);
        },
        enabled: Boolean(id),
        staleTime: STALE_TIME,
        cacheTime: CACHE_TIME,
      });
    },
    
    useVehicleTypes: () => {
      return useQuery({
        queryKey: ['vehicleTypes'],
        queryFn: async () => {
          try {
            const { data, error } = await supabase
              .from('vehicle_types')
              .select('*')
              .eq('is_active', true)
              .order('name');
            
            if (error) {
              throw error;
            }
            
            return data;
          } catch (error) {
            handleApiError(error, 'Failed to fetch vehicle types');
            throw error;
          }
        },
      });
    },
    
    useCreate: () => {
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
            
            // Build vehicle data object for insertion
            const vehicleData: VehicleInsertData = {
              make: formData.make,
              model: formData.model,
              year: formData.year,
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
              status: formData.status ? mapToDBStatus(formData.status) : 'available',
            };
            
            // Insert new vehicle
            const { data, error } = await supabase
              .from('vehicles')
              .insert(vehicleData)
              .select('*, vehicle_types(*)')
              .single();
              
            if (error) {
              throw error;
            }
            
            if (imageUrl && formData.image) {
              try {
                const newImageUrl = await uploadVehicleImage(formData.image, data.id);
                
                // Update with the final image URL using the actual vehicle ID
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
        onSuccess: (newVehicle) => {
          queryClient.setQueryData(['vehicles'], (old: Vehicle[] = []) => {
            return [newVehicle, ...old];
          });
          queryClient.invalidateQueries({ queryKey: ['vehicles'] });
          toast.success('Vehicle added successfully');
        },
      });
    },
    
    useUpdate: () => {
      return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: VehicleFormData }): Promise<Vehicle> => {
          try {
            console.log('Starting vehicle update process for ID:', id);
            console.log('Received update data:', data);
            
            if (!id) {
              throw new Error('Vehicle ID is required for update');
            }
            
            // Verify the vehicle exists before attempting to update
            const { data: existingVehicle, error: checkError } = await supabase
              .from('vehicles')
              .select('id')
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
                console.log('Uploading new vehicle image');
                imageUrl = await uploadVehicleImage(data.image, id);
                console.log('Image uploaded successfully:', imageUrl);
              } catch (error) {
                console.error('Error uploading image:', error);
                toast.error('Failed to upload image', {
                  description: error instanceof Error ? error.message : 'Unknown error occurred',
                });
                throw error;
              }
            }
            
            // Build an update object for Supabase
            const vehicleData: VehicleUpdateData = {};
            
            // Required fields
            if (data.make !== undefined) vehicleData.make = data.make;
            if (data.model !== undefined) vehicleData.model = data.model;
            if (data.year !== undefined) vehicleData.year = data.year;
            if (data.license_plate !== undefined) vehicleData.license_plate = data.license_plate;
            if (data.vin !== undefined) vehicleData.vin = data.vin;
            
            // Optional fields
            if (data.color !== undefined) vehicleData.color = data.color;
            if (data.status !== undefined) vehicleData.status = mapToDBStatus(data.status);
            if (data.mileage !== undefined) vehicleData.mileage = data.mileage;
            if (data.description !== undefined) vehicleData.description = data.description;
            if (data.location !== undefined) vehicleData.location = data.location;
            if (data.insurance_company !== undefined) vehicleData.insurance_company = data.insurance_company;
            
            // Handle insurance_expiry specifically to avoid empty string issues
            if ('insurance_expiry' in data) {
              vehicleData.insurance_expiry = data.insurance_expiry || null;
            }
            
            if (data.rent_amount !== undefined) vehicleData.rent_amount = data.rent_amount;
            
            if (data.vehicle_type_id !== undefined) {
              vehicleData.vehicle_type_id = data.vehicle_type_id === 'none' ? null : data.vehicle_type_id;
            }
            
            if (imageUrl) vehicleData.image_url = imageUrl;
            
            console.log('Updating vehicle with data:', vehicleData);
            
            // Update the vehicle and get the updated record
            const { data: updatedVehicle, error } = await supabase
              .from('vehicles')
              .update(vehicleData)
              .eq('id', id)
              .select('*, vehicle_types(*)')
              .maybeSingle();
              
            if (error) {
              console.error('Supabase update error:', error);
              throw error;
            }
            
            // Fix for the "Vehicle update succeeded but no data returned" error
            // If the update succeeded but no data was returned, fetch the vehicle data separately
            if (!updatedVehicle) {
              console.log('Update succeeded but no data returned, fetching vehicle data separately');
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
              
              console.log('Successfully fetched vehicle after update:', fetchedVehicle);
              return mapDatabaseRecordToVehicle(fetchedVehicle);
            }
            
            console.log('Vehicle updated successfully:', updatedVehicle);
            return mapDatabaseRecordToVehicle(updatedVehicle);
          } catch (error) {
            console.error('Update vehicle error details:', error);
            handleApiError(error, 'Failed to update vehicle');
            throw error;
          }
        },
        onSuccess: (updatedVehicle, variables) => {
          // Optimistic update for the vehicles list
          queryClient.setQueryData(['vehicles'], (old: Vehicle[] = []) => {
            return old.map(vehicle => 
              vehicle.id === variables.id ? updatedVehicle : vehicle
            );
          });
          // Update the individual vehicle cache
          queryClient.setQueryData(['vehicles', variables.id], updatedVehicle);
        },
      });
    },
    
    useDelete: () => {
      return useMutation({
        mutationFn: async (id: string): Promise<string> => {
          try {
            // First check if vehicle is in use
            const { data: leases, error: leasesError } = await supabase
              .from('leases')
              .select('id')
              .eq('vehicle_id', id)
              .eq('status', 'active')
              .limit(1);
              
            if (leasesError) {
              throw leasesError;
            }
            
            if (leases.length > 0) {
              throw new Error('Cannot delete a vehicle that is currently in use');
            }
            
            // Check for vehicle image to delete
            const { data: vehicle, error: vehicleError } = await supabase
              .from('vehicles')
              .select('image_url')
              .eq('id', id)
              .single();
              
            if (vehicleError) {
              throw vehicleError;
            }
            
            // Delete the vehicle
            const { error } = await supabase
              .from('vehicles')
              .delete()
              .eq('id', id);
              
            if (error) {
              throw error;
            }
            
            // Delete the image if it exists
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
        onSuccess: (deletedId) => {
          // Optimistic update for the vehicles list
          queryClient.setQueryData(['vehicles'], (old: Vehicle[] = []) => {
            return old.filter(vehicle => vehicle.id !== deletedId);
          });
          // Remove the individual vehicle from cache
          queryClient.removeQueries({ queryKey: ['vehicles', deletedId] });
          toast.success('Vehicle deleted successfully');
        },
      });
    },
    
    useRealtimeUpdates: () => {
      useEffect(() => {
        const channel = supabase
          .channel('vehicles-changes')
          .on('postgres_changes', 
            { 
              event: '*', 
              schema: 'public', 
              table: 'vehicles' 
            }, 
            (payload) => {
              if (!payload.new) return;

              const updatedVehicle = mapDatabaseRecordToVehicle(payload.new);
              
              switch (payload.eventType) {
                case 'INSERT':
                  queryClient.setQueryData(['vehicles'], (old: Vehicle[] = []) => {
                    return [updatedVehicle, ...old];
                  });
                  break;
                  
                case 'UPDATE':
                  queryClient.setQueryData(['vehicles'], (old: Vehicle[] = []) => {
                    return old.map(vehicle => 
                      vehicle.id === updatedVehicle.id ? updatedVehicle : vehicle
                    );
                  });
                  queryClient.setQueryData(['vehicles', updatedVehicle.id], updatedVehicle);
                  
                  if (payload.old && 
                      'status' in payload.old && 
                      payload.old.status !== updatedVehicle.status) {
                    toast.info(`Vehicle status updated`, {
                      description: `${updatedVehicle.make} ${updatedVehicle.model} is now ${
                        updatedVehicle.status === 'reserve' ? 'reserved' : updatedVehicle.status
                      }`,
                    });
                  }
                  break;
                  
                case 'DELETE':
                  queryClient.setQueryData(['vehicles'], (old: Vehicle[] = []) => {
                    return old.filter(vehicle => vehicle.id !== updatedVehicle.id);
                  });
                  queryClient.removeQueries({ queryKey: ['vehicles', updatedVehicle.id] });
                  break;
              }
            }
          )
          .subscribe();
          
        return () => {
          supabase.removeChannel(channel);
        };
      }, [queryClient]);
    }
  };
};
