import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Vehicle, VehicleFilterParams, VehicleFormData, VehicleInsertData, VehicleUpdateData } from '@/types/vehicle';
import { supabase } from '@/lib/supabase';
import { checkSupabaseHealth, checkConnectionWithRetry, monitorDatabaseConnection } from '@/integrations/supabase/client';
import { mapDatabaseRecordToVehicle, mapToDBStatus } from '@/lib/vehicles/vehicle-mappers';
import { handleApiError } from '@/hooks/use-api';
import { uploadVehicleImage } from '@/lib/vehicles/vehicle-storage';
import { safelyGetRecordFromResponse, safelyGetRecordsFromResponse } from '@/types/supabase-helpers';

export const useVehicles = () => {
  const queryClient = useQueryClient();
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  
  useEffect(() => {
    const checkConnection = async () => {
      const isConnected = await checkConnectionWithRetry();
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
      
      if (!isConnected) {
        toast.error('Database connection error', {
          description: 'Failed to connect to the database. Check your internet connection.',
          duration: 5000,
        });
      }
    };
    
    checkConnection();
  }, []);
  
  return {
    connectionStatus,
    
    useConnectionStatus: () => {
      return useQuery({
        queryKey: ['databaseConnection'],
        queryFn: async () => {
          const result = await checkSupabaseHealth();
          return result.isHealthy;
        },
        refetchInterval: 30000,
      });
    },
    
    useList: (filters?: VehicleFilterParams) => {
      return useQuery({
        queryKey: ['vehicles', filters],
        queryFn: async () => {
          const cacheKey = `vehicles-${JSON.stringify(filters)}`;
          const cachedData = CacheManager.get(cacheKey);
          if (cachedData) return cachedData;
          try {
            const { isHealthy, error: connectionError } = await checkSupabaseHealth();
            
            if (!isHealthy) {
              throw new Error(`Database connection error: ${connectionError || 'Failed to connect'}`);
            }
            
            let query = supabase
              .from('vehicles')
              .select('*, vehicle_types(*)');
            
            if (filters) {
              if (filters.status) {
                if (filters.status === 'reserved') {
                  query = query.eq('status', 'reserve');
                } else {
                  query = query.eq('status', filters.status);
                }
              }
              
              if (filters.make) {
                query = query.eq('make', filters.make);
              }
              
              if (filters.model) {
                query = query.ilike('model', `%${filters.model}%`);
              }
              
              if (filters.vehicle_type_id) {
                query = query.eq('vehicle_type_id', filters.vehicle_type_id);
              }
              
              if (filters.location) {
                query = query.eq('location', filters.location);
              }
              
              if (filters.year) {
                query = query.eq('year', filters.year);
              }
              
              if (filters.search) {
                query = query.ilike('vin', `%${filters.search}%`);
              }
            }
            
            let attempts = 0;
            const maxAttempts = 2;
            let lastError = null;
            
            while (attempts < maxAttempts) {
              try {
                const { data, error } = await query.order('created_at', { ascending: false });
                
                if (error) {
                  lastError = error;
                  attempts++;
                  if (attempts < maxAttempts) {
                    console.log(`Query attempt ${attempts} failed, retrying...`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    continue;
                  }
                  throw error;
                }
                
                const safeData = safelyGetRecordsFromResponse(data ? { data, error: null } : null);
                return safeData.map(record => mapDatabaseRecordToVehicle(record));
              } catch (err) {
                lastError = err;
                attempts++;
                if (attempts < maxAttempts) {
                  console.log(`Query attempt ${attempts} failed with error:`, err);
                  await new Promise(resolve => setTimeout(resolve, 1000));
                } else {
                  break;
                }
              }
            }
            
            throw lastError;
          } catch (error) {
            console.error('Failed to fetch vehicles:', error);
            handleApiError(error, 'Failed to fetch vehicles');
            throw error;
          }
        },
        staleTime: 1000 * 60 * 5,
        retry: 2,
        retryDelay: 1000,
      });
    },
    
    useVehicle: (id: string) => {
      return useQuery({
        queryKey: ['vehicles', id],
        queryFn: async () => {
          try {
            if (!id) {
              throw new Error('Vehicle ID is required');
            }
            
            console.log(`Fetching vehicle with ID: ${id}`);
            
            const { isHealthy } = await checkSupabaseHealth();
            if (!isHealthy) {
              throw new Error('Database connection error');
            }
            
            const { data, error } = await supabase
              .from('vehicles')
              .select('*, vehicle_types(*)')
              .eq('id', id)
              .maybeSingle();
            
            if (error) {
              console.error(`Error fetching vehicle ${id}:`, error);
              throw error;
            }
            
            if (!data) {
              console.error(`No vehicle found with ID: ${id}`);
              throw new Error(`Vehicle with ID ${id} not found`);
            }
            
            console.log(`Successfully fetched vehicle data:`, data);
            return mapDatabaseRecordToVehicle(data);
          } catch (error) {
            console.error(`Failed to fetch vehicle ${id}:`, error);
            handleApiError(error, `Failed to fetch vehicle ${id}`);
            throw error;
          }
        },
        enabled: Boolean(id),
        retry: 2,
        retryDelay: 1000,
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
        retry: 2,
        retryDelay: 1000,
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

            // Verify database connection first
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
            
            console.log('Current vehicle status in database:', existingVehicle.status);
            
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
            
            const vehicleData: VehicleUpdateData = {};
            
            if (data.make !== undefined) vehicleData.make = data.make;
            if (data.model !== undefined) vehicleData.model = data.model;
            if (data.year !== undefined) vehicleData.year = data.year;
            if (data.license_plate !== undefined) vehicleData.license_plate = data.license_plate;
            if (data.vin !== undefined) vehicleData.vin = data.vin;
            
            if (data.color !== undefined) vehicleData.color = data.color;
            
            if (data.status !== undefined) {
              const newStatus = mapToDBStatus(data.status);
              vehicleData.status = newStatus;
              console.log('Status being updated to:', newStatus, 'from form value:', data.status);
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
            
            console.log('Updating vehicle with data:', vehicleData);
            
            const { data: updatedVehicle, error } = await supabase
              .from('vehicles')
              .update(vehicleData)
              .eq('id', id)
              .select('*, vehicle_types(*)')
              .single();
              
            if (error) {
              console.error('Supabase update error:', error);
              throw new Error(`Failed to update vehicle: ${error.message}`);
            }

            if (!updatedVehicle) {
              throw new Error('Vehicle update failed - no data returned');
            }

            // Verify the update was successful by comparing key fields
            const verifyUpdate = await supabase
              .from('vehicles')
              .select('*')
              .eq('id', id)
              .single();

            if (verifyUpdate.error || !verifyUpdate.data) {
              throw new Error('Failed to verify vehicle update');
            }
            
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
        onSuccess: (_, variables) => {
          queryClient.invalidateQueries({ queryKey: ['vehicles'] });
          queryClient.invalidateQueries({ queryKey: ['vehicles', variables.id] });
        },
      });
    },
    
    useDelete: () => {
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
    },
    
    useRealtimeUpdates: () => {
      useEffect(() => {
        const subscription = supabase
          .channel('vehicles-changes')
          .on('postgres_changes', 
            { 
              event: '*', 
              schema: 'public', 
              table: 'vehicles' 
            }, 
            (payload) => {
              console.log('Real-time update:', payload);
              queryClient.invalidateQueries({ queryKey: ['vehicles'] });
              
              if (payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
                queryClient.invalidateQueries({ 
                  queryKey: ['vehicles', payload.new.id] 
                });
              }
              
              if (payload.eventType === 'UPDATE' && 
                  payload.old && payload.new && 
                  typeof payload.old === 'object' && typeof payload.new === 'object' &&
                  'status' in payload.old && 'status' in payload.new &&
                  'make' in payload.new && 'model' in payload.new &&
                  payload.old.status !== payload.new.status) {
                toast.info(`Vehicle status updated`, {
                  description: `${payload.new.make} ${payload.new.model} is now ${payload.new.status === 'reserve' ? 'reserved' : payload.new.status}`,
                });
              }
            }
          )
          .subscribe();
          
        return () => {
          supabase.removeChannel(subscription);
        };
      }, [queryClient]);
    }
  };
};
