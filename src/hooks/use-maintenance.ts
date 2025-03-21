import { useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useApiQuery, useApiMutation, useCrudApi } from "@/hooks/use-api";
import { Maintenance, MaintenanceFilters } from "@/lib/validation-schemas/maintenance";

export const useMaintenance = () => {
  const { toast } = useToast();
  const crudApi = useCrudApi<Maintenance>('maintenance');

  // Fetch maintenance records with optional filtering
  const useList = (filters?: MaintenanceFilters) => {
    return useApiQuery(
      ['maintenance', filters ? JSON.stringify(filters) : 'all'],
      async () => {
        let query = supabase
          .from('maintenance')
          .select('*, vehicles(id, make, model, license_plate, image_url)');

        // Apply filters if provided
        if (filters) {
          if (filters.query) {
            query = query.or(`description.ilike.%${filters.query}%,service_provider.ilike.%${filters.query}%,invoice_number.ilike.%${filters.query}%`);
          }
          if (filters.status) {
            query = query.eq('status', filters.status);
          }
          if (filters.vehicle_id) {
            query = query.eq('vehicle_id', filters.vehicle_id);
          }
          if (filters.maintenance_type) {
            query = query.eq('maintenance_type', filters.maintenance_type);
          }
          if (filters.date_from) {
            query = query.gte('scheduled_date', filters.date_from.toISOString());
          }
          if (filters.date_to) {
            query = query.lte('scheduled_date', filters.date_to.toISOString());
          }
        }

        const { data, error } = await query.order('scheduled_date', { ascending: false });

        if (error) {
          throw error;
        }

        return data as Maintenance[];
      }
    );
  };

  // Get a single maintenance record by ID
  const useOne = (id: string | undefined) => {
    return useApiQuery(
      ['maintenance', id],
      async () => {
        if (!id) return null;

        const { data, error } = await supabase
          .from('maintenance')
          .select('*, vehicles(id, make, model, license_plate, image_url)')
          .eq('id', id)
          .single();

        if (error) {
          throw error;
        }

        return data as Maintenance;
      },
      { enabled: !!id }
    );
  };

  // Create a new maintenance record
  const useCreate = () => {
    return useApiMutation(
      async (newMaintenance: Omit<Maintenance, 'id'>) => {
        const { data, error } = await supabase
          .from('maintenance')
          .insert(newMaintenance)
          .select()
          .single();

        if (error) {
          throw error;
        }

        return data;
      },
      {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Maintenance record created successfully.",
          });
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: `Failed to create maintenance record: ${error.message}`,
            variant: "destructive",
          });
        },
      }
    );
  };

  // Update an existing maintenance record
  const useUpdate = () => {
    return useApiMutation(
      async (maintenance: Maintenance) => {
        const { id, ...maintenanceData } = maintenance;
        
        if (!id) throw new Error("Maintenance ID is required for updates");
        
        // Remove the vehicles relationship before updating
        if ('vehicles' in maintenanceData) {
          delete maintenanceData.vehicles;
        }

        const { data, error } = await supabase
          .from('maintenance')
          .update(maintenanceData)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          throw error;
        }

        return data;
      },
      {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Maintenance record updated successfully.",
          });
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: `Failed to update maintenance record: ${error.message}`,
            variant: "destructive",
          });
        },
      }
    );
  };

  // Delete a maintenance record
  const useDelete = () => {
    return useApiMutation(
      async (id: string) => {
        const { error } = await supabase
          .from('maintenance')
          .delete()
          .eq('id', id);

        if (error) {
          throw error;
        }

        return id;
      },
      {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Maintenance record deleted successfully.",
          });
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: `Failed to delete maintenance record: ${error.message}`,
            variant: "destructive",
          });
        },
      }
    );
  };

  return { useList, useOne, useCreate, useUpdate, useDelete };
};
