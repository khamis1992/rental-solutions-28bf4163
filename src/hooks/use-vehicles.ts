
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Vehicle, VehicleFilterParams, VehicleFormData, VehicleInsertData } from '@/types/vehicle';
import { fetchVehicles, fetchVehicleById, fetchVehicleTypes } from '@/lib/vehicles/vehicle-api';
import { uploadVehicleImage } from '@/lib/vehicles/vehicle-storage';
import { supabase } from '@/integrations/supabase/client';
import { mapDatabaseRecordToVehicle } from '@/lib/vehicles/vehicle-mappers';

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
        mutationFn: async (formData: VehicleFormData): Promise<Vehicle> => {
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
          
          // Get the complete vehicle data with vehicle_types
          const { data: completeData, error: fetchError } = await supabase
            .from('vehicles')
            .select('*, vehicle_types(*)')
            .eq('id', data.id)
            .single();
            
          if (fetchError) {
            console.error('Error fetching complete vehicle data:', fetchError);
            return mapDatabaseRecordToVehicle(data);
          }
          
          return mapDatabaseRecordToVehicle(completeData);
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
        mutationFn: async ({ id, data }: { id: string; data: VehicleFormData }): Promise<Vehicle> => {
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
          
          return mapDatabaseRecordToVehicle(updatedVehicle);
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
        mutationFn: async (id: string): Promise<string> => {
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
