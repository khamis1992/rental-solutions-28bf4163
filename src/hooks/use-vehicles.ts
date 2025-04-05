
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Vehicle, VehicleFilterParams, VehicleFormData, VehicleInsertData, VehicleUpdateData, VehicleType } from '@/types/vehicle';
import { supabase } from '@/lib/supabase';
import { handleApiError } from '@/hooks/use-api';
import { uploadVehicleImage } from '@/lib/vehicles/vehicle-storage';
import { mapToDBStatus } from '@/lib/vehicles/vehicle-mappers';

export function mapDatabaseRecordToVehicle(record: any): Vehicle {
  if (!record.vin) record.vin = '';
  if (!record.created_at) record.created_at = new Date().toISOString();
  if (!record.updated_at) record.updated_at = new Date().toISOString();
  
  const vehicleType = record.vehicle_types?.[0] || null;
  
  return {
    id: record.id,
    make: record.make,
    model: record.model,
    year: record.year,
    license_plate: record.license_plate,
    status: record.status,
    image_url: record.image_url,
    location: record.location,
    mileage: record.mileage,
    vehicleType: vehicleType ? {
      id: vehicleType.id,
      name: vehicleType.name,
      description: vehicleType.description || '',
      size: vehicleType.size || 'standard',
      daily_rate: vehicleType.daily_rate || 0,
      is_active: vehicleType.is_active !== false,
      features: [],
      created_at: vehicleType.created_at || new Date().toISOString(),
      updated_at: vehicleType.updated_at || new Date().toISOString()
    } : null,
    vin: record.vin,
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
}

export const useVehicles = () => {
  const queryClient = useQueryClient();
  
  type VehicleDatabaseRecord = {
    id: string;
    [key: string]: any;
  };
  
  const batchGetVehicles = async (vehicleIds: string[]): Promise<Record<string, Vehicle>> => {
    try {
      if (!vehicleIds.length) return {};
      
      const { data, error } = await supabase
        .from('vehicles')
        .select('*, vehicle_types(id, name, description, size, daily_rate, is_active)')
        .in('id', vehicleIds);
        
      if (error) throw error;
      
      const validData = data || [];
      return validData.reduce((acc: Record<string, Vehicle>, vehicle: any) => {
        // Properly check if vehicle is a valid object with an id property
        if (vehicle && typeof vehicle === 'object' && 'id' in vehicle && vehicle.id) {
          const typedVehicle = vehicle as VehicleDatabaseRecord;
          acc[typedVehicle.id] = mapDatabaseRecordToVehicle(typedVehicle);
        }
        return acc;
      }, {});
    } catch (error) {
      handleApiError(error, 'Failed to fetch vehicles in batch');
      throw error;
    }
  };
  
  return {
    useList: (filters?: VehicleFilterParams) => {
      return useQuery({
        queryKey: ['vehicles', filters],
        queryFn: async () => {
          try {
            const columns = 'id, make, model, year, license_plate, vin, color, mileage, status, location, image_url, rent_amount, vehicle_type_id, created_at, updated_at';
            
            let query = supabase
              .from('vehicles')
              .select(`${columns}, vehicle_types(id, name, description)`);
            
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
                query = query.or(`make.ilike.%${filters.search}%,model.ilike.%${filters.search}%,license_plate.ilike.%${filters.search}%`);
              }
            }
            
            const { data, error } = await query.order('created_at', { ascending: false });
            
            if (error) {
              throw error;
            }
            
            return data.map(record => mapDatabaseRecordToVehicle(record));
          } catch (error) {
            handleApiError(error, 'Failed to fetch vehicles');
            throw error;
          }
        },
        staleTime: 1000 * 60 * 5,
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
            const { data, error } = await supabase
              .from('vehicles')
              .select('*, vehicle_types(id, name, description, size, daily_rate, is_active)')
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
            
            return mapDatabaseRecordToVehicle(data);
          } catch (error) {
            handleApiError(error, `Failed to fetch vehicle with ID: ${id}`);
            throw error;
          }
        },
        staleTime: 1000 * 60 * 5,
      });
    },
    
    useBatchVehicles: (vehicleIds: string[]) => {
      return useQuery({
        queryKey: ['vehicles', 'batch', vehicleIds],
        queryFn: () => batchGetVehicles(vehicleIds),
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: vehicleIds.length > 0,
      });
    },
    
    useCreateVehicle: () => {
      return useMutation({
        mutationFn: async (formData: VehicleFormData) => {
          try {
            let image_url = undefined;
            if (formData.image) {
              const uploadResult = await uploadVehicleImage(formData.image);
              if (uploadResult && 'error' in uploadResult && uploadResult.error) {
                throw uploadResult.error;
              }
              if (uploadResult && 'url' in uploadResult) {
                image_url = uploadResult.url;
              }
            }

            const dbStatus = mapToDBStatus(formData.status);

            const vehicleData: VehicleInsertData = {
              ...formData,
              status: dbStatus,
              image_url,
            };
            
            delete (vehicleData as any).image;

            const { data, error } = await supabase
              .from('vehicles')
              .insert(vehicleData)
              .select()
              .single();

            if (error) throw error;
            return data;
          } catch (error) {
            handleApiError(error, 'Failed to create vehicle');
            throw error;
          }
        },
        onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: ['vehicles'] });
          queryClient.setQueryData(['vehicles', data.id], 
            (oldData: any) => mapDatabaseRecordToVehicle(data)
          );
          toast.success('Vehicle created successfully!');
        },
        onError: (error) => {
          console.error('Error creating vehicle:', error);
          toast.error('Failed to create vehicle.');
        }
      });
    },
    
    useUpdateVehicle: () => {
      return useMutation({
        mutationFn: async ({ id, formData }: { id: string, formData: VehicleFormData }) => {
          try {
            let image_url = undefined;
            if (formData.image) {
              const uploadResult = await uploadVehicleImage(formData.image);
              if (uploadResult && 'error' in uploadResult && uploadResult.error) {
                throw uploadResult.error;
              }
              if (uploadResult && 'url' in uploadResult) {
                image_url = uploadResult.url;
              }
            }

            const dbStatus = mapToDBStatus(formData.status);

            const updateData: VehicleUpdateData = {
              ...formData,
              status: dbStatus,
              ...(image_url ? { image_url } : {}),
            };
            
            delete (updateData as any).image;

            const { data, error } = await supabase
              .from('vehicles')
              .update(updateData)
              .eq('id', id)
              .select('*')
              .single();

            if (error) throw error;
            return data;
          } catch (error) {
            handleApiError(error, 'Failed to update vehicle');
            throw error;
          }
        },
        onSuccess: (data, variables) => {
          queryClient.invalidateQueries({ queryKey: ['vehicles'] });
          queryClient.setQueryData(['vehicles', variables.id], 
            (oldData: any) => mapDatabaseRecordToVehicle(data)
          );
          toast.success('Vehicle updated successfully!');
        },
        onError: (error) => {
          console.error('Error updating vehicle:', error);
          toast.error('Failed to update vehicle.');
        }
      });
    },
    
    useDeleteVehicle: () => {
      return useMutation({
        mutationFn: async (id: string) => {
          try {
            const { error } = await supabase
              .from('vehicles')
              .delete()
              .eq('id', id);

            if (error) throw error;
            return id;
          } catch (error) {
            handleApiError(error, 'Failed to delete vehicle');
            throw error;
          }
        },
        onSuccess: (deletedId) => {
          queryClient.invalidateQueries({ queryKey: ['vehicles'] });
          queryClient.removeQueries({ queryKey: ['vehicles', deletedId] });
          
          queryClient.invalidateQueries({ queryKey: ['agreements'], exact: false });
          
          toast.success('Vehicle deleted successfully!');
        },
        onError: (error) => {
          console.error('Error deleting vehicle:', error);
          toast.error('Failed to delete vehicle.');
        }
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

            if (error) throw error;
            return data;
          } catch (error) {
            handleApiError(error, 'Failed to fetch vehicle types');
            throw error;
          }
        },
        staleTime: 1000 * 60 * 10,
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
                console.log('Vehicle change detected:', payload);
                
                if (payload.new && payload.new.id) {
                  const vehicleId = payload.new.id;
                  
                  if (payload.eventType === 'DELETE') {
                    queryClient.removeQueries({ queryKey: ['vehicles', vehicleId] });
                  } else {
                    queryClient.invalidateQueries({ queryKey: ['vehicles', vehicleId] });
                    queryClient.invalidateQueries({ queryKey: ['vehicles'], exact: true });
                  }
                } else {
                  queryClient.invalidateQueries({ queryKey: ['vehicles'] });
                }
              })
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }, []);
    },
    
    batchGetVehicles
  };
};
