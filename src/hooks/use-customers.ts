import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Customer } from '@/lib/validation-schemas/customer';
import { toast } from 'sonner';

const PROFILES_TABLE = 'profiles';
const CUSTOMER_ROLE = 'customer';

const formatQatarPhoneNumber = (phone: string): string => {
  const cleanPhone = phone.replace(/^\+974/, '').trim();
  
  if (/^[3-9]\d{7}$/.test(cleanPhone)) {
    return `+974${cleanPhone}`;
  }
  
  return phone;
};

const stripCountryCode = (phone: string): string => {
  return phone.replace(/^\+974/, '').trim();
};

export const useCustomers = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useState({
    query: '',
    status: 'all',
  });

  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { 
    data: customers, 
    isLoading, 
    error,
    refetch
  } = useQuery({
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
    queryKey: ['customers', searchParams],
    queryFn: async () => {
      console.log('Fetching customers with params:', searchParams);
      
      try {
        let query = supabase
          .from(PROFILES_TABLE)
          .select('*')
          .eq('role', CUSTOMER_ROLE)
          .order('created_at', { ascending: false });

        if (searchParams.status !== 'all' && searchParams.status) {
          query = query.eq('status', searchParams.status as "active" | "inactive" | "pending_review" | "blacklisted" | "pending_payment");
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
        
        const processedCustomers = (data || []).map(profile => ({
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
        
        console.log('Processed customers from profiles:', processedCustomers);
        return processedCustomers as Customer[];
      } catch (catchError) {
        console.error('Unexpected error in customer fetch:', catchError);
        return [];
      }
    },
    initialData: []
  });

  const refreshCustomers = () => {
    return refetch();
  };

  const createCustomer = useMutation({
    mutationFn: async (newCustomer: Omit<Customer, 'id'>) => {
      console.log('Creating new customer with data:', newCustomer);
      
      const formattedPhone = formatQatarPhoneNumber(newCustomer.phone);
      console.log('Formatted phone number:', formattedPhone);
      
      const { data, error } = await supabase
        .from(PROFILES_TABLE)
        .insert([{ 
          full_name: newCustomer.full_name,
          email: newCustomer.email,
          phone_number: formattedPhone,
          address: newCustomer.address,
          driver_license: newCustomer.driver_license,
          nationality: newCustomer.nationality,
          notes: newCustomer.notes,
          status: newCustomer.status || 'active',
          role: CUSTOMER_ROLE,
          created_at: new Date().toISOString() 
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating customer:', error);
        throw new Error(error.message);
      }
      
      console.log('Created customer:', data);
      return {
        ...data,
        phone: stripCountryCode(data.phone_number || '')
      } as Customer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create customer', { description: error.message });
    },
  });

  const updateCustomer = useMutation({
    mutationFn: async (customer: Customer) => {
      const formattedPhone = formatQatarPhoneNumber(customer.phone);
      console.log('Updating customer with formatted phone:', formattedPhone);
      
      const { data, error } = await supabase
        .from(PROFILES_TABLE)
        .update({ 
          full_name: customer.full_name,
          email: customer.email,
          phone_number: formattedPhone,
          address: customer.address,
          driver_license: customer.driver_license,
          nationality: customer.nationality,
          notes: customer.notes,
          status: customer.status,
          updated_at: new Date().toISOString() 
        })
        .eq('id', customer.id)
        .select();

      if (error) throw new Error(error.message);
      
      return {
        ...data[0],
        phone: stripCountryCode(data[0].phone_number || '')
      } as Customer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update customer', { description: error.message });
    },
  });

  const deleteCustomer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(PROFILES_TABLE)
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete customer', { description: error.message });
    },
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
        phone: stripCountryCode(data.phone_number || ''),
        driver_license: data.driver_license || '',
        nationality: data.nationality || '',
        address: data.address || '',
        notes: data.notes || '',
        status: (data.status || 'active') as "active" | "inactive" | "pending_review" | "blacklisted" | "pending_payment",
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
      
      return customerData;
    } catch (error) {
      console.error('Unexpected error fetching customer:', error);
      toast.error('Failed to fetch customer');
      return null;
    }
  };

  return {
    customers,
    isLoading,
    error,
    searchParams,
    setSearchParams,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomer,
    refreshCustomers,
  };
};
