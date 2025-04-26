
import { supabase } from '@/lib/supabase';
import { Customer } from '@/lib/validation-schemas/customer';
import { toast } from 'sonner';
import { stripCountryCode } from './customer-utils';

export const useSingleCustomer = () => {
  const getCustomer = async (id: string): Promise<Customer | null> => {
    try {
      console.log('Fetching customer with ID:', id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching customer by ID:', error);
        toast.error('Failed to fetch customer', { description: error.message });
        return null;
      }

      if (!data) {
        console.log('No customer found with ID:', id);
        return null;
      }

      return {
        id: data.id,
        full_name: data.full_name || '',
        email: data.email || '',
        phone: stripCountryCode(data.phone_number || ''),
        driver_license: data.driver_license || '',
        nationality: data.nationality || '',
        address: data.address || '',
        notes: data.notes || '',
        status: (data.status || 'active') as "active" | "inactive" | "pending_review" | "blacklisted" | "pending_payment",
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    } catch (error) {
      console.error('Unexpected error fetching customer:', error);
      toast.error('Failed to fetch customer');
      return null;
    }
  };

  return { getCustomer };
};
