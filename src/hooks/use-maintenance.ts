
import { useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useApiQuery, useApiMutation, useCrudApi } from "@/hooks/use-api";
import { Maintenance, MaintenanceFilters, MaintenanceStatus } from "@/lib/validation-schemas/maintenance";
import { supabase } from "@/integrations/supabase/client";

// Helper function to transform database records to our frontend model
const transformMaintenanceRecord = (record: any): Maintenance => {
  return {
    id: record.id,
    vehicle_id: record.vehicle_id,
    maintenance_type: record.maintenance_type,
    // Status is stored as uppercase in DB, but our enum uses lowercase
    status: record.status?.toLowerCase() as keyof typeof MaintenanceStatus,
    description: record.description,
    cost: record.cost || 0,
    scheduled_date: record.scheduled_date ? new Date(record.scheduled_date) : new Date(),
    completion_date: record.completed_date ? new Date(record.completed_date) : undefined,
    service_provider: record.performed_by || record.service_provider,
    invoice_number: record.invoice_number,
    odometer_reading: record.odometer_reading,
    notes: record.notes,
    created_at: record.created_at ? new Date(record.created_at) : undefined,
    updated_at: record.updated_at ? new Date(record.updated_at) : undefined,
    vehicles: record.vehicles
  };
};

// Helper function to transform our frontend model to database record format
const transformToDbRecord = (maintenance: Omit<Maintenance, 'id'> | Maintenance): any => {
  // Base fields that map directly
  const dbRecord: any = {
    vehicle_id: maintenance.vehicle_id,
    maintenance_type: maintenance.maintenance_type,
    // Convert status to uppercase for the database
    status: maintenance.status?.toUpperCase(),
    description: maintenance.description,
    cost: maintenance.cost,
    notes: maintenance.notes,
    odometer_reading: maintenance.odometer_reading,
    invoice_number: maintenance.invoice_number,
    scheduled_date: maintenance.scheduled_date instanceof Date ? maintenance.scheduled_date.toISOString() : maintenance.scheduled_date,
  };

  // Map service_provider to performed_by (if the DB uses that field)
  if (maintenance.service_provider) {
    dbRecord.performed_by = maintenance.service_provider;
    dbRecord.service_provider = maintenance.service_provider;
  }

  // Handle completion_date mapping to completed_date
  if (maintenance.completion_date) {
    dbRecord.completed_date = maintenance.completion_date instanceof Date 
      ? maintenance.completion_date.toISOString() 
      : maintenance.completion_date;
  }

  return dbRecord;
};

export const useMaintenance = () => {
  const { toast } = useToast();
  const crudApi = useCrudApi<Maintenance & { id: string }>('maintenance');

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
            query = query.or(`description.ilike.%${filters.query}%,performed_by.ilike.%${filters.query}%,invoice_number.ilike.%${filters.query}%`);
          }
          if (filters.status) {
            // Convert status to uppercase for database query
            query = query.eq('status', filters.status.toUpperCase());
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

        // Transform database records to our frontend model
        return (data || []).map(record => transformMaintenanceRecord(record));
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

        // Transform database record to our frontend model
        return transformMaintenanceRecord(data);
      },
      { enabled: !!id }
    );
  };

  // Create a new maintenance record
  const useCreate = () => {
    return useApiMutation(
      async (newMaintenance: Omit<Maintenance, 'id'>) => {
        // Transform to database format before inserting
        const dbRecord = transformToDbRecord(newMaintenance);

        const { data, error } = await supabase
          .from('maintenance')
          .insert(dbRecord)
          .select()
          .single();

        if (error) {
          throw error;
        }

        return transformMaintenanceRecord(data);
      },
      {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Maintenance record created successfully.",
          });
        },
        onError: (error: unknown) => {
          let errorMessage = "Failed to create maintenance record";
          if (error instanceof Error) {
            errorMessage += `: ${error.message}`;
          }
          
          toast({
            title: "Error",
            description: errorMessage,
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
        
        // Remove the vehicles relationship and transform to DB format
        const dbRecord = transformToDbRecord(maintenanceData);

        const { data, error } = await supabase
          .from('maintenance')
          .update(dbRecord)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          throw error;
        }

        return transformMaintenanceRecord(data);
      },
      {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Maintenance record updated successfully.",
          });
        },
        onError: (error: unknown) => {
          let errorMessage = "Failed to update maintenance record";
          if (error instanceof Error) {
            errorMessage += `: ${error.message}`;
          }
          
          toast({
            title: "Error",
            description: errorMessage,
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
        onError: (error: unknown) => {
          let errorMessage = "Failed to delete maintenance record";
          if (error instanceof Error) {
            errorMessage += `: ${error.message}`;
          }
          
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
        },
      }
    );
  };

  return { useList, useOne, useCreate, useUpdate, useDelete };
};
