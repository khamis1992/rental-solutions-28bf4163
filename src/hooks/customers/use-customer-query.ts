
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Customer } from '@/lib/validation-schemas/customer';
import { stripCountryCode } from './customer-utils';

export interface CustomerSearchParams {
  query: string;
  status: string;
}

export const useCustomerQuery = (searchParams: CustomerSearchParams): UseQueryResult<Customer[]> => {
  return useQuery({
    queryKey: ['customers', searchParams],
    queryFn: async () => {
      console.log('Fetching customers with params:', searchParams);
      
      try {
        let query = supabase
          .from('profiles')
          .select('*')
          .eq('role', 'customer');

        if (searchParams.status !== 'all' && searchParams.status) {
          query = query.eq('status', searchParams.status);
        }

        if (searchParams.query) {
          query = query.or(
            `full_name.ilike.%${searchParams.query}%,email.ilike.%${searchParams.query}%,phone_number.ilike.%${searchParams.query}%,driver_license.ilike.%${searchParams.query}%`
          );
        }

        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;
        
        if (error) {
          console.error('Supabase query error:', error);
          throw new Error(error.message);
        }
        
        console.log('Raw customer data from profiles table:', data);
        
        return (data || []).map(profile => ({
          id: profile.id,
          full_name: profile.full_name || '',
          email: profile.email || '',
          phone: stripCountryCode(profile.phone_number || ''),
          driver_license: profile.driver_license || '',
          nationality: profile.nationality || '',
          address: profile.address || '',
          notes: profile.notes || '',
          status: (profile.status || 'active') as "active" | "inactive" | "pending_review" | "blacklisted" | "pending_payment",
          created_at: profile.created_at,
          updated_at: profile.updated_at,
        }));
      } catch (catchError) {
        console.error('Unexpected error in customer fetch:', catchError);
        return [];
      }
    }
  });
};
