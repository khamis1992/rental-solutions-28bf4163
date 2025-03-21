
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Agreement, AgreementFormData, AgreementFilterParams } from "@/types/agreement";

// Fetch all agreements with optional filtering
const fetchAgreements = async (filters?: AgreementFilterParams) => {
  let query = supabase.from('rental_agreements')
    .select(`
      *,
      customers (id, first_name, last_name, email),
      vehicles (id, make, model, license_plate, year, image_url)
    `);
  
  // Apply filters if provided
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        query = query.eq(key, value);
      }
    });
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) {
    throw new Error(`Error fetching agreements: ${error.message}`);
  }
  
  return data as unknown as Agreement[];
};

// Fetch a single agreement by ID
const fetchAgreementById = async (id: string) => {
  const { data, error } = await supabase
    .from('rental_agreements')
    .select(`
      *,
      customers (id, first_name, last_name, email),
      vehicles (id, make, model, license_plate, year, image_url)
    `)
    .eq('id', id)
    .single();
  
  if (error) {
    throw new Error(`Agreement with ID ${id} not found: ${error.message}`);
  }
  
  return data as unknown as Agreement;
};

export const useAgreements = () => {
  const queryClient = useQueryClient();
  
  return {
    // Get all agreements with optional filtering
    useList: (filters?: AgreementFilterParams) => {
      return useQuery({
        queryKey: ['agreements', filters],
        queryFn: () => fetchAgreements(filters),
      });
    },
    
    // Get a single agreement by ID
    useAgreement: (id: string) => {
      return useQuery({
        queryKey: ['agreements', id],
        queryFn: () => fetchAgreementById(id),
        enabled: !!id, // Only run the query if id is provided
      });
    },
    
    // Get agreements for a specific customer
    useCustomerAgreements: (customerId: string) => {
      return useQuery({
        queryKey: ['agreements', 'customer', customerId],
        queryFn: () => fetchAgreements({ customer_id: customerId }),
        enabled: !!customerId,
      });
    },
    
    // Get agreements for a specific vehicle
    useVehicleAgreements: (vehicleId: string) => {
      return useQuery({
        queryKey: ['agreements', 'vehicle', vehicleId],
        queryFn: () => fetchAgreements({ vehicle_id: vehicleId }),
        enabled: !!vehicleId,
      });
    },
    
    // Create a new agreement
    useCreate: () => {
      return useMutation({
        mutationFn: async (formData: AgreementFormData) => {
          const { data, error } = await supabase
            .from('rental_agreements')
            .insert(formData)
            .select()
            .single();
          
          if (error) {
            throw new Error(`Error creating agreement: ${error.message}`);
          }
          
          // Update the vehicle status to 'rented'
          await supabase
            .from('vehicles')
            .update({ status: 'rented' })
            .eq('id', formData.vehicle_id);
          
          return data;
        },
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['agreements'] });
          queryClient.invalidateQueries({ queryKey: ['vehicles'] });
          toast.success('Rental agreement created successfully');
        },
        onError: (error) => {
          toast.error('Failed to create rental agreement', {
            description: error instanceof Error ? error.message : 'Unknown error occurred',
          });
        },
      });
    },
    
    // Update an agreement
    useUpdate: () => {
      return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<AgreementFormData> }) => {
          const { data: updatedAgreement, error } = await supabase
            .from('rental_agreements')
            .update(data)
            .eq('id', id)
            .select(`
              *,
              customers (id, first_name, last_name, email),
              vehicles (id, make, model, license_plate, year, image_url)
            `)
            .single();
          
          if (error) {
            throw new Error(`Error updating agreement: ${error.message}`);
          }
          
          // Update vehicle status based on the agreement status
          if (data.status) {
            let vehicleStatus: 'rented' | 'available' = 'rented';
            
            if (['completed', 'cancelled'].includes(data.status)) {
              vehicleStatus = 'available';
            }
            
            await supabase
              .from('vehicles')
              .update({ status: vehicleStatus })
              .eq('id', updatedAgreement.vehicle_id);
          }
          
          return updatedAgreement as unknown as Agreement;
        },
        onSuccess: (_, variables) => {
          queryClient.invalidateQueries({ queryKey: ['agreements'] });
          queryClient.invalidateQueries({ queryKey: ['agreements', variables.id] });
          queryClient.invalidateQueries({ queryKey: ['vehicles'] });
          toast.success('Rental agreement updated successfully');
        },
        onError: (error) => {
          toast.error('Failed to update rental agreement', {
            description: error instanceof Error ? error.message : 'Unknown error occurred',
          });
        },
      });
    },
    
    // Delete an agreement
    useDelete: () => {
      return useMutation({
        mutationFn: async (id: string) => {
          // Get the agreement first to check the vehicle_id
          const { data: agreement } = await supabase
            .from('rental_agreements')
            .select('vehicle_id')
            .eq('id', id)
            .single();
          
          const { error } = await supabase
            .from('rental_agreements')
            .delete()
            .eq('id', id);
          
          if (error) {
            throw new Error(`Error deleting agreement: ${error.message}`);
          }
          
          // Update the vehicle status back to 'available'
          if (agreement && agreement.vehicle_id) {
            await supabase
              .from('vehicles')
              .update({ status: 'available' })
              .eq('id', agreement.vehicle_id);
          }
          
          return id;
        },
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['agreements'] });
          queryClient.invalidateQueries({ queryKey: ['vehicles'] });
          toast.success('Rental agreement deleted successfully');
        },
        onError: (error) => {
          toast.error('Failed to delete rental agreement', {
            description: error instanceof Error ? error.message : 'Unknown error occurred',
          });
        },
      });
    },
  };
};
