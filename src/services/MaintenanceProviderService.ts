import { supabase } from '@/lib/supabase';
import { BaseService } from './base/BaseService';
import { 
  Result, 
  ServiceError, 
  createServiceError, 
  createNotFoundError,
  ErrorContext
} from '@/types/error.types';

export type MaintenanceProvider = {
  id: string;
  name: string;
  contact_info: string;
  specialties: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export class MaintenanceProviderService extends BaseService {
  constructor() {
    super(supabase);
  }

  async findActive(): Promise<Result<MaintenanceProvider[]>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('maintenance_providers')
        .select('*')
        .eq('is_active', true);
        
      if (error) {
        throw this.createServiceError(
          'Failed to fetch active providers',
          'findActive'
        );
      }
      
      return data || [];
    }, 'Failed to fetch maintenance providers');
  }
}

export const maintenanceProviderService = new MaintenanceProviderService();
