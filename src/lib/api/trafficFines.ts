
import { supabase } from '@/integrations/supabase/client';
import { TrafficFine, mapTrafficFineResponse } from '@/types/traffic-fine';

export const trafficFinesApi = {
  async fetchAll(): Promise<TrafficFine[]> {
    const { data, error } = await supabase
      .from('traffic_fines')
      .select('*');
    
    if (error) throw error;
    return (data || []).map(mapTrafficFineResponse);
  },

  async fetchByCustomerId(customerId: string): Promise<TrafficFine[]> {
    const { data, error } = await supabase
      .from('traffic_fines')
      .select('*')
      .eq('customer_id', customerId);
    
    if (error) throw error;
    return (data || []).map(mapTrafficFineResponse);
  },

  async fetchByLeaseId(leaseId: string): Promise<TrafficFine[]> {
    const { data, error } = await supabase
      .from('traffic_fines')
      .select('*')
      .eq('lease_id', leaseId);
    
    if (error) throw error;
    return (data || []).map(mapTrafficFineResponse);
  },

  async updateStatus(id: string, status: string): Promise<TrafficFine> {
    const { data, error } = await supabase
      .from('traffic_fines')
      .update({ payment_status: status })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return mapTrafficFineResponse(data);
  }
};
