
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { supabase, formatVehicleForDisplay, getImagePublicUrl } from '@/lib/supabase';
import { Vehicle, VehicleType, VehicleFormData, VehicleFilterParams } from '@/types/vehicle';

// Fetch all vehicles with optional filtering
const fetchVehicles = async (filters?: VehicleFilterParams) => {
  let query = supabase.from('vehicles')
    .select('*, vehicle_types(*)');
  
  // Apply filters if provided
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query = query.eq(key, value);
      }
    });
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) {
    throw new Error(`Error fetching vehicles: ${error.message}`);
  }
  
  // Format the response for display
  return data.map((vehicle: any) => {
    // Process the vehicle_types join and format for frontend
    const vehicleWithType = {
      ...vehicle,
      vehicleType: vehicle.vehicle_types
    };
    delete vehicleWithType.vehicle_types; // Remove the nested join
    
    return formatVehicleForDisplay(vehicleWithType);
  });
};

// Fetch a single vehicle by ID
const fetchVehicleById = async (id: string) => {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*, vehicle_types(*)')
    .eq('id', id)
    .single();
  
  if (error) {
    throw new Error(`Vehicle with ID ${id} not found: ${error.message}`);
  }
  
  // Process the vehicle_types join
  const vehicleWithType = {
    ...data,
    vehicleType: data.vehicle_types
  };
  delete vehicleWithType.vehicle_types;
  
  return formatVehicleForDisplay(vehicleWithType);
};

// Fetch all vehicle types
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

// Upload vehicle image
const uploadVehicleImage = async (file: File, id: string): Promise<string> => {
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
    throw new Error(`Error uploading image: ${error.message}`);
  }
  
  return getImagePublicUrl('vehicle-images', filePath);
};

export const useVehicles = () => {
  const queryClient = useQueryClient();
  
  return {
    // Get all vehicles with optional filtering
    useList: (filters?: VehicleFilterParams) => {
      return useQuery({
        queryKey: ['vehicles', filters],
        queryFn: () => fetchVehicles(filters),
      });
    },
    
    // Get a single vehicle by ID
    useVehicle: (id: string) => {
      return useQuery({
        queryKey: ['vehicles', id],
        queryFn: () => fetchVehicleById(id),
        enabled: !!id, // Only run the query if id is provided
      });
    },
    
    // Get all vehicle types
    useVehicleTypes: () => {
      return useQuery({
        queryKey: ['vehicleTypes'],
        queryFn: fetchVehicleTypes,
      });
    },
    
    // Create a new vehicle
    useCreate: () => {
      return useMutation({
        mutationFn: async (formData: VehicleFormData) => {
          // Handle image upload if provided
          let imageUrl = null;
          if (formData.image) {
            // Generate a temporary ID for the file name
            const tempId = crypto.randomUUID();
            imageUrl = await uploadVehicleImage(formData.image, tempId);
          }
          
          // Prepare the vehicle data
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
            rent_amount: formData.rent_amount,
            vehicle_type_id: formData.vehicle_type_id,
            image_url: imageUrl,
          };
          
          // Insert the vehicle
          const { data, error } = await supabase
            .from('vehicles')
            .insert(vehicleData)
            .select()
            .single();
          
          if (error) {
            throw new Error(`Error creating vehicle: ${error.message}`);
          }
          
          // If image was uploaded with a temp ID, update it with the real ID
          if (imageUrl && formData.image) {
            try {
              const newImageUrl = await uploadVehicleImage(formData.image, data.id);
              
              // Update the vehicle with the new image URL
              await supabase
                .from('vehicles')
                .update({ image_url: newImageUrl })
                .eq('id', data.id);
                
              data.image_url = newImageUrl;
            } catch (imageError) {
              console.error('Error updating image with final ID:', imageError);
              // Continue with the operation, as the vehicle was created successfully
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
    
    // Update a vehicle
    useUpdate: () => {
      return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: VehicleFormData }) => {
          // Handle image upload if provided
          let imageUrl = null;
          if (data.image) {
            imageUrl = await uploadVehicleImage(data.image, id);
          }
          
          // Prepare the vehicle data
          const vehicleData: Record<string, any> = {
            make: data.make,
            model: data.model,
            year: data.year,
            license_plate: data.license_plate,
            vin: data.vin,
            status: data.status,
            mileage: data.mileage,
          };
          
          // Only include optional fields if they are provided
          if (data.color !== undefined) vehicleData.color = data.color;
          if (data.description !== undefined) vehicleData.description = data.description;
          if (data.location !== undefined) vehicleData.location = data.location;
          if (data.insurance_company !== undefined) vehicleData.insurance_company = data.insurance_company;
          if (data.rent_amount !== undefined) vehicleData.rent_amount = data.rent_amount;
          if (data.vehicle_type_id !== undefined) vehicleData.vehicle_type_id = data.vehicle_type_id;
          if (imageUrl) vehicleData.image_url = imageUrl;
          
          // Update the vehicle
          const { data: updatedVehicle, error } = await supabase
            .from('vehicles')
            .update(vehicleData)
            .eq('id', id)
            .select('*, vehicle_types(*)')
            .single();
          
          if (error) {
            throw new Error(`Error updating vehicle: ${error.message}`);
          }
          
          // Process the vehicle_types join
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
    
    // Delete a vehicle
    useDelete: () => {
      return useMutation({
        mutationFn: async (id: string) => {
          // Get the vehicle to check if it has an image
          const { data: vehicle } = await supabase
            .from('vehicles')
            .select('image_url')
            .eq('id', id)
            .single();
          
          // Delete the vehicle
          const { error } = await supabase
            .from('vehicles')
            .delete()
            .eq('id', id);
          
          if (error) {
            throw new Error(`Error deleting vehicle: ${error.message}`);
          }
          
          // If vehicle had an image, try to delete it from storage
          // This is a best-effort operation and won't fail the overall deletion
          if (vehicle && vehicle.image_url) {
            try {
              // Extract the filename from the URL
              const urlParts = vehicle.image_url.split('/');
              const fileName = urlParts[urlParts.length - 1];
              
              await supabase.storage
                .from('vehicle-images')
                .remove([fileName]);
            } catch (storageError) {
              console.error('Failed to delete vehicle image:', storageError);
              // Continue with the operation, as the vehicle was deleted successfully
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
    
    // Setup real-time subscription for vehicle status updates
    useRealtimeUpdates: () => {
      useEffect(() => {
        // Subscribe to vehicle changes
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
              // Invalidate queries to refresh data
              queryClient.invalidateQueries({ queryKey: ['vehicles'] });
              
              // If it's an update to a specific vehicle, invalidate that query too
              if (payload.new && payload.new.id) {
                queryClient.invalidateQueries({ 
                  queryKey: ['vehicles', payload.new.id] 
                });
              }
              
              // Show toast notification for important updates
              if (payload.eventType === 'UPDATE' && 
                  payload.old && payload.new && 
                  payload.old.status !== payload.new.status) {
                toast.info(`Vehicle status updated`, {
                  description: `${payload.new.make} ${payload.new.model} is now ${payload.new.status}`,
                });
              }
            }
          )
          .subscribe();
          
        // Cleanup subscription on unmount
        return () => {
          supabase.removeChannel(subscription);
        };
      }, [queryClient]);
    }
  };
};
