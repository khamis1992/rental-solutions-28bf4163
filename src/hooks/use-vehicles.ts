
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Vehicle, VehicleFilterParams, VehicleFormData, VehicleInsertData, VehicleUpdateData, VehicleType } from '@/types/vehicle';
import { supabase } from '@/lib/supabase';
import { handleApiError } from '@/hooks/use-api';
import { uploadVehicleImage } from '@/lib/vehicles/vehicle-storage';

export function mapDatabaseRecordToVehicleInner(record: any): Vehicle {
  // Ensure all required fields have default values
  if (!record.vin) record.vin = '';
  if (!record.created_at) record.created_at = new Date().toISOString();
  if (!record.updated_at) record.updated_at = new Date().toISOString();
  
  // Fix for vehicle_types property
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
      features: [], // Adding default empty array
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
  
  return {
    useList: (filters?: VehicleFilterParams) => {
      return useQuery({
        queryKey: ['vehicles', filters],
        queryFn: async () => {
          try {
            // Define the columns we need to select
            const columns = 'id, make, model, year, license_plate, vin, color, mileage, status, location, image_url, rent_amount, vehicle_type_id, created_at, updated_at';
            
            // Start with the base query with specific columns
            let query = supabase
              .from('vehicles')
              .select(`${columns}, vehicle_types(id, name, description)`);
            
            // Apply filters if provided
            if (filters) {
              // Apply status filter, handling the reserved->reserve mapping
              if (filters.status) {
                if (filters.status === 'reserved') {
                  query = query.eq('status', 'reserve');
                } else {
                  query = query.eq('status', filters.status);
                }
              }
              
              // Apply other filters
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
              
              // Add search functionality across multiple fields
              if (filters.search) {
                query = query.or(`make.ilike.%${filters.search}%,model.ilike.%${filters.search}%,license_plate.ilike.%${filters.search}%`);
              }
            }
            
            // Execute the query and sort by creation date
            const { data, error } = await query.order('created_at', { ascending: false });
            
            if (error) {
              throw error;
            }
            
            // Map the database records to our application model
            return data.map(record => mapDatabaseRecordToVehicleInner(record));
          } catch (error) {
            handleApiError(error, 'Failed to fetch vehicles');
            throw error;
          }
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
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
            
            return mapDatabaseRecordToVehicleInner(data);
          } catch (error) {
            handleApiError(error, `Failed to fetch vehicle with ID: ${id}`);
            throw error;
          }
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
      });
    },
    
    useCreateVehicle: () => {
      return useMutation({
        mutationFn: async (formData: VehicleFormData) => {
          try {
            // Handle image upload if present
            let image_url = undefined;
            if (formData.image) {
              // Using the correct type for uploadVehicleImage result
              const uploadResult = await uploadVehicleImage(formData.image);
              if (uploadResult && typeof uploadResult === 'object' && 'error' in uploadResult && uploadResult.error) {
                throw uploadResult.error;
              }
              if (uploadResult && typeof uploadResult === 'object' && 'url' in uploadResult) {
                image_url = uploadResult.url;
              }
            }

            // Convert status if it's 'reserved' to match database
            let dbStatus = formData.status;
            if (dbStatus === 'reserved') {
              dbStatus = 'reserve' as any;
            }

            // Create vehicle record with the image URL if uploaded
            const vehicleData: VehicleInsertData = {
              ...formData,
              status: dbStatus,
              image_url,
            };
            
            // Remove the image property as it's not part of the database schema
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
        onSuccess: () => {
          // Invalidate vehicle cache to trigger refetch
          queryClient.invalidateQueries({ queryKey: ['vehicles'] });
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
            // Handle image upload if present
            let image_url = undefined;
            if (formData.image) {
              // Using the correct type for uploadVehicleImage result
              const uploadResult = await uploadVehicleImage(formData.image);
              if (uploadResult && typeof uploadResult === 'object' && 'error' in uploadResult && uploadResult.error) {
                throw uploadResult.error;
              }
              if (uploadResult && typeof uploadResult === 'object' && 'url' in uploadResult) {
                image_url = uploadResult.url;
              }
            }

            // Convert status if it's 'reserved' to match database
            let dbStatus = formData.status;
            if (dbStatus === 'reserved') {
              dbStatus = 'reserve' as any;
            }

            // Create update data with the image URL if uploaded
            const updateData: VehicleUpdateData = {
              ...formData,
              status: dbStatus,
              ...(image_url ? { image_url } : {}), // Only include if we have a new image
            };
            
            // Remove the image property as it's not part of the database schema
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
        onSuccess: () => {
          // Invalidate vehicle cache to trigger refetch
          queryClient.invalidateQueries({ queryKey: ['vehicles'] });
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
          // Invalidate vehicle cache to trigger refetch
          queryClient.invalidateQueries({ queryKey: ['vehicles'] });
          queryClient.removeQueries({ queryKey: ['vehicles', deletedId] });
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
        staleTime: 1000 * 60 * 10, // 10 minutes
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
                queryClient.invalidateQueries({ queryKey: ['vehicles'] });
              })
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }, []);
    }
  };
};
