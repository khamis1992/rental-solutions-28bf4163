/**
 * Standardized Maintenance Service
 * Handles vehicle maintenance management and related operations
 */
import { supabase } from '@/lib/supabase';
import { BaseService } from './BaseService';
import {
  Maintenance,
  MaintenanceInsert,
  MaintenanceUpdate,
  MaintenanceStatus,
  MaintenanceType,
  MaintenancePriority,
  PaginatedMaintenanceResult,
  MaintenanceStatistics
} from '@/types/maintenance.types';
import { handleError } from '@/utils/error-handler';
import { validateData } from '@/utils/validation';
import {
  maintenanceSchema,
  maintenanceInsertSchema,
  maintenanceUpdateSchema,
  scheduleMaintenanceSchema
} from '@/schemas/maintenance.schema';

/**
 * Service for managing vehicle maintenance
 */
export class MaintenanceService extends BaseService {
  constructor() {
    super('maintenance');
  }

  /**
   * Get maintenance records with filtering and pagination
   */
  async getMaintenance(
    filters: {
      vehicleId?: string;
      status?: MaintenanceStatus | MaintenanceStatus[];
      type?: MaintenanceType;
      priority?: MaintenancePriority;
      categoryId?: string;
      fromDate?: Date;
      toDate?: Date;
      searchTerm?: string;
    } = {},
    limit = 10,
    offset = 0
  ): Promise<PaginatedMaintenanceResult | null> {
    try {
      // Start building the query
      let query = supabase.from('maintenance').select(`
        *,
        vehicle:vehicle_id(*),
        category:category_id(*)
      `, { count: 'exact' });

      // Apply filters
      if (filters.vehicleId) {
        query = query.eq('vehicle_id', filters.vehicleId);
      }

      if (filters.status) {
        if (Array.isArray(filters.status)) {
          query = query.in('status', filters.status);
        } else {
          query = query.eq('status', filters.status);
        }
      }

      if (filters.type) {
        query = query.eq('maintenance_type', filters.type);
      }

      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }

      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }

      if (filters.fromDate) {
        query = query.gte('scheduled_date', filters.fromDate.toISOString());
      }

      if (filters.toDate) {
        query = query.lte('scheduled_date', filters.toDate.toISOString());
      }

      if (filters.searchTerm && filters.searchTerm.trim() !== '') {
        const searchTerm = filters.searchTerm.trim();
        query = query.or(
          `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,technician_name.ilike.%${searchTerm}%`
        );
      }

      // Apply pagination
      const { data, error, count } = await query
        .order('scheduled_date', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      return {
        data: data as Maintenance[],
        count: count || 0
      };
    } catch (error) {
      handleError(error, { context: 'Maintenance listing' });
      return null;
    }
  }

  /**
   * Get a single maintenance record by ID
   */
  async getMaintenanceById(id: string): Promise<Maintenance | null> {
    try {
      const { data, error } = await supabase
        .from('maintenance')
        .select(`
          *,
          vehicle:vehicle_id(*),
          category:category_id(*),
          tasks:maintenance_tasks(*),
          documents:maintenance_documents(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return data as Maintenance;
    } catch (error) {
      handleError(error, { context: 'Maintenance details' });
      return null;
    }
  }
  /**
   * Create a new maintenance record
   */
  async createMaintenance(data: MaintenanceInsert): Promise<Maintenance | null> {
    try {
      // Validate the input data
      const validatedData = validateData(maintenanceInsertSchema, data, {
        context: 'Maintenance creation',
        throwOnError: true
      });
      
      if (!validatedData) return null;

      const { data: newMaintenance, error } = await supabase
        .from('maintenance')
        .insert({
          ...validatedData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return newMaintenance as Maintenance;
    } catch (error) {
      handleError(error, { context: 'Create maintenance' });
      return null;
    }
  }
  /**
   * Update an existing maintenance record
   */
  async updateMaintenance(id: string, data: MaintenanceUpdate): Promise<Maintenance | null> {
    try {
      // Validate the input data
      const validatedData = validateData(maintenanceUpdateSchema, data, {
        context: 'Maintenance update',
        throwOnError: true
      });
      
      if (!validatedData) return null;

      const { data: updatedMaintenance, error } = await supabase
        .from('maintenance')
        .update({
          ...validatedData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return updatedMaintenance as Maintenance;
    } catch (error) {
      handleError(error, { context: 'Update maintenance' });
      return null;
    }
  }

  /**
   * Delete a maintenance record
   */
  async deleteMaintenance(id: string): Promise<Maintenance | null> {
    try {
      const { data: deletedMaintenance, error } = await supabase
        .from('maintenance')
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return deletedMaintenance as Maintenance;
    } catch (error) {
      handleError(error, { context: 'Delete maintenance' });
      return null;
    }
  }

  /**
   * Update maintenance status
   */
  async updateMaintenanceStatus(id: string, status: MaintenanceStatus): Promise<Maintenance | null> {
    try {
      let updateData: any = { status };
      
      // If completing the maintenance, set the completed date
      if (status === MaintenanceStatus.COMPLETED) {
        updateData.completed_date = new Date().toISOString();
      }
      
      const { data, error } = await supabase
        .from('maintenance')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as Maintenance;
    } catch (error) {
      handleError(error, { context: 'Update maintenance status' });
      return null;
    }
  }

  /**
   * Get maintenance statistics
   */
  async getMaintenanceStatistics(vehicleId?: string): Promise<MaintenanceStatistics | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_maintenance_statistics', { vehicle_id: vehicleId || null });

      if (error) {
        throw error;
      }

      return data as MaintenanceStatistics;
    } catch (error) {
      handleError(error, { context: 'Maintenance statistics' });
      return null;
    }
  }

  /**
   * Get maintenance records for a specific vehicle
   */
  async getVehicleMaintenance(vehicleId: string): Promise<Maintenance[] | null> {
    try {
      const { data, error } = await supabase
        .from('maintenance')
        .select('*, category:category_id(*)')
        .eq('vehicle_id', vehicleId)
        .order('scheduled_date', { ascending: false });

      if (error) {
        throw error;
      }

      return data as Maintenance[];
    } catch (error) {
      handleError(error, { context: 'Vehicle maintenance history' });
      return null;
    }
  }
  /**
   * Schedule routine maintenance for a vehicle
   */
  async scheduleRoutineMaintenance(
    vehicleId: string,
    scheduledDate: Date,
    maintenanceType: MaintenanceType = MaintenanceType.ROUTINE
  ): Promise<Maintenance | null> {
    try {
      // Validate input using the schedule maintenance schema
      const validatedData = validateData(scheduleMaintenanceSchema, {
        vehicleId,
        scheduledDate,
        maintenanceType
      }, {
        context: 'Schedule maintenance',
        throwOnError: true
      });
      
      if (!validatedData) return null;
      
      // Get vehicle information
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select('make, model, year, odometer_reading')
        .eq('id', vehicleId)
        .single();
        
      if (vehicleError) {
        throw vehicleError;
      }
      
      // Create maintenance record
      const maintenanceData: MaintenanceInsert = {
        vehicle_id: vehicleId,
        title: `Routine maintenance for ${vehicleData.make} ${vehicleData.model} (${vehicleData.year})`,
        description: `Scheduled routine maintenance at ${vehicleData.odometer_reading || 'current'} km`,
        maintenance_type: maintenanceType,
        status: MaintenanceStatus.SCHEDULED,
        priority: MaintenancePriority.MEDIUM,
        scheduled_date: scheduledDate.toISOString(),
        odometer_reading: vehicleData.odometer_reading
      };
      
      return await this.createMaintenance(maintenanceData);
    } catch (error) {
      handleError(error, { context: 'Schedule routine maintenance' });
      return null;
    }
  }
}

// Export a singleton instance
export const maintenanceService = new MaintenanceService();
