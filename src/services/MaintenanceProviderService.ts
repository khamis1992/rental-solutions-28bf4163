
import { supabase } from '@/lib/supabase';

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export type MaintenanceProvider = {
  id: string;
  name: string;
  contact_info: string;
  specialties: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export class MaintenanceProviderService {
  private success<T>(data: T): ServiceResult<T> {
    return { success: true, data };
  }

  private error(message: string, error?: any): ServiceResult<any> {
    console.error(message, error);
    return { success: false, error: message };
  }

  async findActive(): Promise<ServiceResult<MaintenanceProvider[]>> {
    try {
      const { data, error } = await supabase
        .from('maintenance_providers')
        .select('*')
        .eq('is_active', true);
        
      if (error) {
        throw new Error(`Failed to fetch active providers: ${error.message}`);
      }
      
      return this.success(data || []);
    } catch (error) {
      return this.error('Failed to fetch maintenance providers', error);
    }
  }
}

export const maintenanceProviderService = new MaintenanceProviderService();
