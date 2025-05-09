
import { supabase } from '@/lib/supabase';

export class AgreementDetailApi {
  static async fetchAgreementDetail(id: string) {
    try {
      const { data, error } = await supabase
        .from('leases')
        .select('*, customers:profiles(*), vehicles(*)')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching agreement detail:', error);
      throw error;
    }
  }
  
  static async updateAgreement(id: string, updateData: any) {
    try {
      const { data, error } = await supabase
        .from('leases')
        .update(updateData)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating agreement:', error);
      throw error;
    }
  }
}
