
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Customer } from '@/lib/validation-schemas/customer';
import { toast } from 'sonner';

// Change the table name from 'customers' to 'profiles'
const PROFILES_TABLE = 'profiles';
const CUSTOMER_ROLE = 'customer';

export const useCustomers = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useState({
    query: '',
    status: 'all',
  });

  // Fetch all customers with optional filtering
  const { 
    data: customers, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['customers', searchParams],
    queryFn: async () => {
      console.log('Fetching customers with params:', searchParams);
      
      try {
        let query = supabase
          .from(PROFILES_TABLE)
          .select('*')
          .eq('role', CUSTOMER_ROLE) // Only select profiles with role='customer'
          .order('created_at', { ascending: false });

        // Apply status filter if not 'all'
        if (searchParams.status !== 'all' && searchParams.status) {
          query = query.eq('status', searchParams.status);
        }

        // Apply search query if provided
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
        
        // Log raw data for debugging
        console.log('Raw customer data from profiles table:', data);
        
        // Process customers to ensure they have required fields
        const processedCustomers = (data || []).map(profile => ({
          id: profile.id,
          full_name: profile.full_name || '',
          email: profile.email || '',
          phone: profile.phone_number || '',
          driver_license: profile.driver_license || '',
          nationality: profile.nationality || '',
          address: profile.address || '',
          notes: profile.notes || '',
          status: profile.status || 'active',
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

  // Create a new customer
  const createCustomer = useMutation({
    mutationFn: async (newCustomer: Omit<Customer, 'id'>) => {
      console.log('Creating new customer with data:', newCustomer);
      
      const { data, error } = await supabase
        .from(PROFILES_TABLE)
        .insert([{ 
          full_name: newCustomer.full_name,
          email: newCustomer.email,
          phone_number: newCustomer.phone, // Map to phone_number in profiles
          address: newCustomer.address,
          driver_license: newCustomer.driver_license,
          nationality: newCustomer.nationality,
          notes: newCustomer.notes,
          status: newCustomer.status || 'active',
          role: CUSTOMER_ROLE, // Ensure role is set to customer
          created_at: new Date().toISOString() 
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating customer:', error);
        throw new Error(error.message);
      }
      
      console.log('Created customer:', data);
      return data as Customer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create customer', { description: error.message });
    },
  });

  // Update a customer
  const updateCustomer = useMutation({
    mutationFn: async (customer: Customer) => {
      const { data, error } = await supabase
        .from(PROFILES_TABLE)
        .update({ 
          full_name: customer.full_name,
          email: customer.email,
          phone_number: customer.phone, // Map to phone_number in profiles
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
      return data[0] as Customer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update customer', { description: error.message });
    },
  });

  // Delete a customer
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

  // Get a single customer by ID
  const getCustomer = async (id: string): Promise<Customer | null> => {
    try {
      console.log('Fetching customer with ID:', id);
      
      const { data, error } = await supabase
        .from(PROFILES_TABLE)
        .select('*')
        .eq('id', id)
        .maybeSingle(); // Using maybeSingle instead of single to handle not found case

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

      // Map the data properly to the Customer type
      const customerData: Customer = {
        id: data.id,
        full_name: data.full_name || '',
        email: data.email || '',
        phone: data.phone_number || '',
        driver_license: data.driver_license || '',
        nationality: data.nationality || '',
        address: data.address || '',
        notes: data.notes || '',
        status: data.status || 'active',
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
  };
};
