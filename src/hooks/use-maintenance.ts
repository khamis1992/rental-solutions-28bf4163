
import { supabase } from '@/integrations/supabase/client';
import { useCrudApi } from './use-api';

export function useMaintenance() {
  const maintenanceApi = useCrudApi(
    'maintenance',
    {
      getAll: async () => {
        const { data, error } = await supabase
          .from('maintenance')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
      },
      
      getById: async (id: string) => {
        const { data, error } = await supabase
          .from('maintenance')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        return data;
      },
      
      create: async (maintenanceData: any) => {
        const { data, error } = await supabase
          .from('maintenance')
          .insert(maintenanceData)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      },
      
      update: async (id: string, maintenanceData: any) => {
        const { data, error } = await supabase
          .from('maintenance')
          .update(maintenanceData)
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      },
      
      delete: async (id: string) => {
        const { error } = await supabase
          .from('maintenance')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
      }
    }
  );

  return {
    ...maintenanceApi,
    
    // Additional operations for maintenance
    async getByVehicleId(vehicleId: string) {
      const { data, error } = await supabase
        .from('maintenance')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('scheduled_date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    
    async getMaintenanceStatistics(vehicleId?: string) {
      let query = supabase
        .from('maintenance')
        .select('status, count', { count: 'exact' });
      
      if (vehicleId) {
        query = query.eq('vehicle_id', vehicleId);
      }
      
      const { count, error } = await query;
      
      if (error) throw error;
      return { totalRecords: count || 0 };
    }
  };
}
