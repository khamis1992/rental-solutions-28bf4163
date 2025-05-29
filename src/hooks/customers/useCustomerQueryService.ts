
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Customer } from '@/lib/validation-schemas/customer';
import { toast } from 'sonner';

const PROFILES_TABLE = 'profiles';
const CUSTOMER_ROLE = 'customer';

const stripCountryCode = (phone: string): string => {
  return phone.replace(/^\+974/, '').trim();
};

interface SearchParams {
  query: string;
  status: string;
}

export const useCustomerQueryService = (searchParams: SearchParams) => {
  const { 
    data: customers, 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: ['customers', searchParams],
    queryFn: async () => {
      console.log('Fetching customers with params:', searchParams);
      
      try {
        let query = supabase
          .from(PROFILES_TABLE)
          .select('*');
          
        // Apply role filter as a string
        query = query.eq('role', CUSTOMER_ROLE);
        
        // Order by created_at descending
        query = query.order('created_at', { ascending: false });

        if (searchParams.status !== 'all' && searchParams.status) {
          // Use safe casting for the status filter
          query = query.eq('status', searchParams.status);
        }

        if (searchParams.query) {
          query = query.or(
            `full_name.ilike.%${searchParams.query}%,email.ilike.%${searchParams.query}%,phone_number.ilike.%${searchParams.query}%,driver_license.ilike.%${searchParams.query}%`
          );
        }

        const { data, error } = await query;
        
        if (error) {
          console.error('Supabase query error:', error);
          throw new Error(error.message);
        }
        
        console.log('Raw customer data from profiles table:', data);
        
        const processedCustomers = Array.isArray(data) ? data.map(profile => ({
          id: profile.id,
          full_name: profile.full_name || '',
          email: profile.email || '',
          phone: profile.phone_number ? stripCountryCode(profile.phone_number) : '',
          driver_license: profile.driver_license || '',
          nationality: profile.nationality || '',
          address: profile.address || '',
          notes: profile.notes || '',
          status: (profile.status || 'active'),
          created_at: profile.created_at,
          updated_at: profile.updated_at,
        })) : [];
        
        console.log('Processed customers from profiles:', processedCustomers);
        return processedCustomers as Customer[];
      } catch (catchError: any) {
        console.error('Unexpected error in customer fetch:', catchError);
        return [];
      }
    },
    initialData: []
  });

  const getCustomer = async (id: string): Promise<Customer | null> => {
    try {
      console.log('Fetching customer with ID:', id);
      
      const { data, error } = await supabase
        .from(PROFILES_TABLE)
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

      console.log('Raw customer data from profiles:', data);

      const customerData: Customer = {
        id: data.id,
        full_name: data.full_name || '',
        email: data.email || '',
        phone: data.phone_number ? stripCountryCode(data.phone_number) : '',
        driver_license: data.driver_license || '',
        nationality: data.nationality || '',
        address: data.address || '',
        notes: data.notes || '',
        status: (data.status || 'active'),
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
      
      return customerData;
    } catch (error: any) {
      console.error('Unexpected error fetching customer:', error);
      toast.error('Failed to fetch customer');
      return null;
    }
  };

  return {
    customers,
    isLoading,
    error,
    refetch,
    getCustomer,
  };
};
