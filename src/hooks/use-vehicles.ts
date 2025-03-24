
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Vehicle, VehicleType, VehicleFormData, VehicleFilterParams } from '@/types/vehicle';

// Helper function to ensure vehicle-images bucket exists
const ensureVehicleImagesBucket = async () => {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return false;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === 'vehicle-images');
    
    if (!bucketExists) {
      // Create the bucket
      const { error: createError } = await supabase.storage.createBucket('vehicle-images', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });
      
      if (createError) {
        console.error('Error creating bucket:', createError);
        return false;
      }
      
      console.log('Vehicle images bucket created successfully');
      return true;
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring vehicle images bucket exists:', error);
    return false;
  }
};

// Helper function to get image URL with public URL transformation
const getImagePublicUrl = (bucket: string, path: string): string => {
  try {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  } catch (error) {
    console.error('Error getting public URL:', error);
    return '';
  }
};

// Helper to format data for display with camelCase keys for frontend compatibility
const formatVehicleForDisplay = (vehicle: any): any => {
  if (!vehicle) return null;
  
  return {
    ...vehicle,
    imageUrl: vehicle.image_url,
    licensePlate: vehicle.license_plate,
    dailyRate: vehicle.rent_amount || (vehicle.vehicleType?.daily_rate || 0),
    category: vehicle.vehicleType?.size || 'midsize', // Map to existing frontend category
    features: vehicle.vehicleType?.features || [],
    notes: vehicle.description
  };
};

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
          
          const vehicleData = {
            make: formData.make,
            model: formData.model,
            year: formData.year,
            license_plate: formData.license_plate,
            vin: formData.vin,
            color: formData.color,
            status: formData.status || 'available',
            mileage: formData.mileage || 0,
            description: formData.description,
            location: formData.location,
            insurance_company: formData.insurance_company,
            insurance_expiry: formData.insurance_expiry,
            rent_amount: formData.rent_amount,
            vehicle_type_id: formData.vehicle_type_id === 'none' ? null : formData.vehicle_type_id,
            image_url: imageUrl,
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
          
          const vehicleData: Record<string, any> = {
            make: data.make,
            model: data.model,
            year: data.year,
            license_plate: data.license_plate,
            vin: data.vin,
            status: data.status,
            mileage: data.mileage,
          };
          
          if (data.color !== undefined) vehicleData.color = data.color;
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
