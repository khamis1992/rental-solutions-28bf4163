
import { supabase } from '@/lib/supabase';

// Define maintenance record type since it's not in the main schema
export interface MaintenanceRecord {
  id: string;
  vehicle_id: string;
  maintenance_type: string;
  cost: number;
  maintenance_date: string;
  status: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceCreateData {
  vehicle_id: string;
  maintenance_type: string;
  cost: number;
  maintenance_date: string;
  status?: string;
  description?: string;
}

/**
 * Repository for maintenance-related database operations
 * Note: This handles a custom table that may not be in the main schema
 */
export class MaintenanceRepository {
  constructor(private client: any) {}

  /**
   * Find maintenance records by vehicle ID
   */
  async findByVehicleId(vehicleId: string): Promise<{ data: MaintenanceRecord[] | null; error: any }> {
    try {
      const { data, error } = await this.client
        .from('maintenance_records')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('maintenance_date', { ascending: false });
      
      return { data, error };
    } catch (error) {
      console.error('Error fetching maintenance records:', error);
      return { data: null, error };
    }
  }

  /**
   * Create a new maintenance record
   */
  async create(maintenanceData: MaintenanceCreateData): Promise<{ data: MaintenanceRecord | null; error: any }> {
    try {
      const { data, error } = await this.client
        .from('maintenance_records')
        .insert([{
          ...maintenanceData,
          status: maintenanceData.status || 'pending'
        }])
        .select()
        .single();
      
      return { data, error };
    } catch (error) {
      console.error('Error creating maintenance record:', error);
      return { data: null, error };
    }
  }

  /**
   * Update maintenance record status
   */
  async updateStatus(recordId: string, status: string): Promise<{ data: MaintenanceRecord | null; error: any }> {
    try {
      const { data, error } = await this.client
        .from('maintenance_records')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', recordId)
        .select()
        .single();
      
      return { data, error };
    } catch (error) {
      console.error('Error updating maintenance record:', error);
      return { data: null, error };
    }
  }

  /**
   * Get all maintenance records with optional filters
   */
  async findAll(filters?: { status?: string; vehicle_id?: string }): Promise<{ data: MaintenanceRecord[] | null; error: any }> {
    try {
      let query = this.client.from('maintenance_records').select('*');
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.vehicle_id) {
        query = query.eq('vehicle_id', filters.vehicle_id);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      return { data, error };
    } catch (error) {
      console.error('Error fetching maintenance records:', error);
      return { data: null, error };
    }
  }
}

// Export the repository instance
export const maintenanceRepository = new MaintenanceRepository(supabase);
export const createMaintenanceRepository = (client: any) => new MaintenanceRepository(client);
