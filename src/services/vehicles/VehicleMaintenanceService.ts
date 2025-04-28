
import { BaseService, handleServiceOperation, ServiceResult } from '../base/BaseService';
import { supabase } from '@/lib/supabase';
import { DbId } from '@/types/database-common';

/**
 * Service responsible for managing vehicle maintenance operations
 * Handles maintenance records, scheduling, and service history
 */
export class VehicleMaintenanceService extends BaseService<'maintenance'> {
  /**
   * Get maintenance records for a specific vehicle
   * @param vehicleId - ID of the vehicle
   * @returns Promise with maintenance records
   */
  async getMaintenanceRecords(vehicleId: string): Promise<ServiceResult<any[]>> {
    return handleServiceOperation(async () => {
      const { data, error } = await supabase
        .from('maintenance')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('scheduled_date', { ascending: false });
      
      if (error) {
        throw new Error(`Failed to fetch maintenance records: ${error.message}`);
      }
      
      return data || [];
    });
  }

  /**
   * Schedule new maintenance for a vehicle
   * @param vehicleId - ID of the vehicle
   * @param maintenanceData - Maintenance details
   * @returns Promise with the created maintenance record
   */
  async scheduleMaintenance(
    vehicleId: string, 
    maintenanceData: {
      maintenance_type: string;
      description: string;
      scheduled_date: Date;
      estimated_cost?: number;
      notes?: string;
    }
  ): Promise<ServiceResult<any>> {
    return handleServiceOperation(async () => {
      const record = {
        vehicle_id: vehicleId,
        maintenance_type: maintenanceData.maintenance_type,
        description: maintenanceData.description,
        scheduled_date: maintenanceData.scheduled_date.toISOString(),
        cost: maintenanceData.estimated_cost || 0,
        notes: maintenanceData.notes || '',
        status: 'scheduled'
      };
      
      const { data, error } = await supabase
        .from('maintenance')
        .insert(record)
        .select()
        .single();
      
      if (error) {
        throw new Error(`Failed to schedule maintenance: ${error.message}`);
      }
      
      return data;
    });
  }

  /**
   * Update the status of a maintenance record
   * @param maintenanceId - ID of the maintenance record
   * @param status - New status
   * @param completionDetails - Optional completion details
   * @returns Promise with the updated maintenance record
   */
  async updateMaintenanceStatus(
    maintenanceId: string,
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
    completionDetails?: {
      completion_date?: Date;
      actual_cost?: number;
      notes?: string;
    }
  ): Promise<ServiceResult<any>> {
    return handleServiceOperation(async () => {
      const updateData: any = { status };
      
      if (status === 'completed' && completionDetails) {
        updateData.completed_date = completionDetails.completion_date?.toISOString();
        updateData.cost = completionDetails.actual_cost;
        
        if (completionDetails.notes) {
          updateData.notes = completionDetails.notes;
        }
      }
      
      const { data, error } = await supabase
        .from('maintenance')
        .update(updateData)
        .eq('id', maintenanceId)
        .select()
        .single();
      
      if (error) {
        throw new Error(`Failed to update maintenance status: ${error.message}`);
      }
      
      return data;
    });
  }

  /**
   * Delete a maintenance record
   * @param maintenanceId - ID of the maintenance record
   * @returns Promise indicating success
   */
  async deleteMaintenance(maintenanceId: string): Promise<ServiceResult<boolean>> {
    return handleServiceOperation(async () => {
      const { error } = await supabase
        .from('maintenance')
        .delete()
        .eq('id', maintenanceId);
      
      if (error) {
        throw new Error(`Failed to delete maintenance record: ${error.message}`);
      }
      
      return true;
    });
  }

  /**
   * Get all maintenance records with pagination and filtering
   * @param filters - Optional filters
   * @param pagination - Optional pagination parameters
   * @returns Promise with maintenance records and count
   */
  async getAllMaintenanceRecords(
    filters?: {
      status?: string;
      vehicle_id?: string;
      from_date?: Date;
      to_date?: Date;
    },
    pagination?: {
      page: number;
      pageSize: number;
    }
  ): Promise<ServiceResult<{ data: any[]; count: number }>> {
    return handleServiceOperation(async () => {
      let query = supabase
        .from('maintenance')
        .select('*, vehicles(*)', { count: 'exact' });
      
      // Apply filters
      if (filters) {
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        
        if (filters.vehicle_id) {
          query = query.eq('vehicle_id', filters.vehicle_id);
        }
        
        if (filters.from_date) {
          query = query.gte('scheduled_date', filters.from_date.toISOString());
        }
        
        if (filters.to_date) {
          query = query.lte('scheduled_date', filters.to_date.toISOString());
        }
      }
      
      // Apply pagination
      if (pagination) {
        const { page, pageSize } = pagination;
        const start = (page - 1) * pageSize;
        query = query.range(start, start + pageSize - 1);
      }
      
      // Order by scheduled date
      query = query.order('scheduled_date', { ascending: false });
      
      const { data, error, count } = await query;
      
      if (error) {
        throw new Error(`Failed to fetch maintenance records: ${error.message}`);
      }
      
      return { 
        data: data || [], 
        count: count || 0 
      };
    });
  }
}

export const vehicleMaintenanceService = new VehicleMaintenanceService();
