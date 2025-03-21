
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Customer } from '@/lib/validation-schemas/customer';
import { toast } from 'sonner';

const CUSTOMERS_TABLE = 'customers';

export const useCustomers = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useState({
    query: '',
    status: 'all',
  });

  // Fetch all customers with optional filtering
  const { data: customers, isLoading, error } = useQuery({
    queryKey: ['customers', searchParams],
    queryFn: async () => {
      let query = supabase
        .from(CUSTOMERS_TABLE)
        .select('*')
        .order('created_at', { ascending: false });

      // Apply status filter if not 'all'
      if (searchParams.status !== 'all') {
        query = query.eq('status', searchParams.status);
      }

      // Apply search query if provided
      if (searchParams.query) {
        query = query.or(
          `full_name.ilike.%${searchParams.query}%,email.ilike.%${searchParams.query}%,phone.ilike.%${searchParams.query}%,driver_license.ilike.%${searchParams.query}%`
        );
      }

      const { data, error } = await query;
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data as Customer[];
    },
  });

  // Create a new customer
  const createCustomer = useMutation({
    mutationFn: async (newCustomer: Omit<Customer, 'id'>) => {
      const { data, error } = await supabase
        .from(CUSTOMERS_TABLE)
        .insert([{ ...newCustomer, created_at: new Date().toISOString() }])
        .select()
        .single();

      if (error) throw new Error(error.message);
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
        .from(CUSTOMERS_TABLE)
        .update({ ...customer, updated_at: new Date().toISOString() })
        .eq('id', customer.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Customer;
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
        .from(CUSTOMERS_TABLE)
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
    const { data, error } = await supabase
      .from(CUSTOMERS_TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      toast.error('Failed to fetch customer', { description: error.message });
      return null;
    }

    return data as Customer;
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
