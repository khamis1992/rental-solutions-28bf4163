
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Vehicle, VehicleType, VehicleFormData, VehicleFilterParams, VehicleStatus, VehicleInsertData } from '@/types/vehicle';
import { ensureVehicleImagesBucket, getImagePublicUrl, formatVehicleForDisplay } from '@/lib/supabase';

// Type for database interactions to prevent circular reference issues
interface DatabaseVehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  vin: string;
  color?: string | null;
  status?: string | null;
  mileage?: number | null;
  image_url?: string | null;
  description?: string | null;
  is_test_data?: boolean | null;
  location?: string | null;
  insurance_company?: string | null;
  insurance_expiry?: string | null;
  device_type?: string | null;
  rent_amount?: number | null;
  vehicle_type_id?: string | null;
  registration_number?: string | null;
  created_at: string;
  updated_at: string;
  vehicle_types?: VehicleType;
}

// Helper function to validate status
function isValidStatus(status: string): status is VehicleStatus {
  return ['available', 'rented', 'reserved', 'maintenance', 'police_station', 'accident', 'stolen', 'retired'].includes(status);
}

const fetchVehicles = async (filters?: VehicleFilterParams) => {
  let query = supabase.from('vehicles')
    .select('*, vehicle_types(*)');
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'any') {
        query = query.eq(key, value);
      }
    });
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) {
    throw new Error(`Error fetching vehicles: ${error.message}`);
  }
  
  return data.map((vehicle: any) => {
    const vehicleWithType = {
      ...vehicle,
      vehicleType: vehicle.vehicle_types
    };
    delete vehicleWithType.vehicle_types;
    
    return formatVehicleForDisplay(vehicleWithType);
  });
};

const fetchVehicleById = async (id: string) => {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*, vehicle_types(*)')
    .eq('id', id)
    .single();
  
  if (error) {
    throw new Error(`Vehicle with ID ${id} not found: ${error.message}`);
  }
  
  const vehicleWithType = {
    ...data,
    vehicleType: data.vehicle_types
  };
  delete vehicleWithType.vehicle_types;
  
  return formatVehicleForDisplay(vehicleWithType);
};

const fetchVehicleTypes = async () => {
  const { data, error } = await supabase
    .from('vehicle_types')
    .select('*')
    .eq('is_active', true)
    .order('name');
  
  if (error) {
    throw new Error(`Error fetching vehicle types: ${error.message}`);
  }
  
  return data;
};

const uploadVehicleImage = async (file: File, id: string): Promise<string> => {
  const bucketReady = await ensureVehicleImagesBucket();
  
  if (!bucketReady) {
    throw new Error('Failed to ensure vehicle-images bucket exists. Please contact an administrator.');
  }
  
  const fileExt = file.name.split('.').pop();
  const fileName = `${id}-${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;
  
  const { error } = await supabase.storage
    .from('vehicle-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });
  
  if (error) {
    console.error('Upload error details:', error);
    throw new Error(`Error uploading image: ${error.message}`);
  }
  
  return getImagePublicUrl('vehicle-images', filePath);
};

export const useVehicles = () => {
  const queryClient = useQueryClient();
  
  return {
    useList: (filters?: VehicleFilterParams) => {
      return useQuery({
        queryKey: ['vehicles', filters],
        queryFn: () => fetchVehicles(filters),
      });
    },
    
    useVehicle: (id: string) => {
      return useQuery({
        queryKey: ['vehicles', id],
        queryFn: () => fetchVehicleById(id),
        enabled: !!id,
      });
    },
    
    useVehicleTypes: () => {
      return useQuery({
        queryKey: ['vehicleTypes'],
        queryFn: fetchVehicleTypes,
      });
    },
    
    useCreate: () => {
      return useMutation({
        mutationFn: async (formData: VehicleFormData) => {
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
          
          // Build a properly typed vehicle data object for insertion
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
            status: formData.status || 'available',
          };
          
          const { data, error } = await supabase
            .from('vehicles')
            .insert(vehicleData)
            .select()
            .single();
          
          if (error) {
            throw new Error(`Error creating vehicle: ${error.message}`);
          }
          
          if (imageUrl && formData.image) {
            try {
              const newImageUrl = await uploadVehicleImage(formData.image, data.id);
              
              await supabase
                .from('vehicles')
                .update({ image_url: newImageUrl })
                .eq('id', data.id);
                
              data.image_url = newImageUrl;
            } catch (imageError) {
              console.error('Error updating image with final ID:', imageError);
            }
          }
          
          return data;
        },
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['vehicles'] });
          toast.success('Vehicle added successfully');
        },
        onError: (error) => {
          toast.error('Failed to add vehicle', {
            description: error instanceof Error ? error.message : 'Unknown error occurred',
          });
        },
      });
    },
    
    useUpdate: () => {
      return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: VehicleFormData }) => {
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
          
          // Build an update object with proper typing for Supabase
          const vehicleData: VehicleInsertData = {};
          
          // Required fields
          if (data.make !== undefined) vehicleData.make = data.make;
          if (data.model !== undefined) vehicleData.model = data.model;
          if (data.year !== undefined) vehicleData.year = data.year;
          if (data.license_plate !== undefined) vehicleData.license_plate = data.license_plate;
          if (data.vin !== undefined) vehicleData.vin = data.vin;
          
          // Optional fields
          if (data.color !== undefined) vehicleData.color = data.color;
          if (data.status !== undefined) vehicleData.status = data.status;
          if (data.mileage !== undefined) vehicleData.mileage = data.mileage;
          if (data.description !== undefined) vehicleData.description = data.description;
          if (data.location !== undefined) vehicleData.location = data.location;
          if (data.insurance_company !== undefined) vehicleData.insurance_company = data.insurance_company;
          if (data.insurance_expiry !== undefined) vehicleData.insurance_expiry = data.insurance_expiry;
          if (data.rent_amount !== undefined) vehicleData.rent_amount = data.rent_amount;
          
          if (data.vehicle_type_id !== undefined) {
            vehicleData.vehicle_type_id = data.vehicle_type_id === 'none' ? null : data.vehicle_type_id;
          }
          
          if (imageUrl) vehicleData.image_url = imageUrl;
          
          const { data: updatedVehicle, error } = await supabase
            .from('vehicles')
            .update(vehicleData)
            .eq('id', id)
            .select('*, vehicle_types(*)')
            .single();
          
          if (error) {
            throw new Error(`Error updating vehicle: ${error.message}`);
          }
          
          const vehicleWithType = {
            ...updatedVehicle,
            vehicleType: updatedVehicle.vehicle_types
          };
          delete vehicleWithType.vehicle_types;
          
          return formatVehicleForDisplay(vehicleWithType);
        },
        onSuccess: (_, variables) => {
          queryClient.invalidateQueries({ queryKey: ['vehicles'] });
          queryClient.invalidateQueries({ queryKey: ['vehicles', variables.id] });
          toast.success('Vehicle updated successfully');
        },
        onError: (error) => {
          toast.error('Failed to update vehicle', {
            description: error instanceof Error ? error.message : 'Unknown error occurred',
          });
        },
      });
    },
    
    useDelete: () => {
      return useMutation({
        mutationFn: async (id: string) => {
          const { data: vehicle } = await supabase
            .from('vehicles')
            .select('image_url')
            .eq('id', id)
            .single();
          
          const { error } = await supabase
            .from('vehicles')
            .delete()
            .eq('id', id);
          
          if (error) {
            throw new Error(`Error deleting vehicle: ${error.message}`);
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
        },
        onSuccess: (id) => {
          queryClient.invalidateQueries({ queryKey: ['vehicles'] });
          toast.success('Vehicle deleted successfully');
        },
        onError: (error) => {
          toast.error('Failed to delete vehicle', {
            description: error instanceof Error ? error.message : 'Unknown error occurred',
          });
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
                  description: `${payload.new.make} ${payload.new.model} is now ${payload.new.status}`,
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
