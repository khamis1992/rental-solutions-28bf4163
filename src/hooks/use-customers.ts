import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Customer } from '@/lib/validation-schemas/customer';
import { toast } from 'sonner';
import { logOperation } from '@/utils/monitoring-utils';

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

  const { 
    data: customers, 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: ['customers', searchParams],
    queryFn: async () => {
      logOperation(
        'customers.fetchCustomers', 
        'success', 
        { searchParams },
        'Fetching customers with params'
      );
      
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
          logOperation(
            'customers.fetchCustomers', 
            'error', 
            { error: error.message },
            'Supabase query error'
          );
          throw new Error(error.message);
        }
        
        logOperation(
          'customers.fetchCustomers', 
          'success', 
          { dataCount: data?.length || 0 },
          'Raw customer data from profiles table'
        );
        
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
        
        logOperation(
          'customers.fetchCustomers', 
          'success', 
          { customerCount: processedCustomers.length },
          'Processed customers from profiles'
        );
        return processedCustomers as Customer[];
      } catch (catchError) {
        logOperation(
          'customers.fetchCustomers', 
          'error', 
          { error: catchError instanceof Error ? catchError.message : String(catchError) },
          'Unexpected error in customer fetch'
        );
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
      logOperation(
        'customers.createCustomer', 
        'success', 
        { newCustomer },
        'Creating new customer with data'
      );
      
      const formattedPhone = formatQatarPhoneNumber(newCustomer.phone);
      logOperation(
        'customers.createCustomer', 
        'success', 
        { formattedPhone },
        'Formatted phone number'
      );
      
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
        logOperation(
          'customers.createCustomer', 
          'error', 
          { error: error.message },
          'Error creating customer'
        );
        throw new Error(error.message);
      }
      
      logOperation(
        'customers.createCustomer', 
        'success', 
        { customerId: data?.id },
        'Created customer'
      );
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
      logOperation(
        'customers.updateCustomer', 
        'success', 
        { customerId: customer.id, formattedPhone },
        'Updating customer with formatted phone'
      );
      
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

      if (error) {
        logOperation(
          'customers.updateCustomer', 
          'error', 
          { customerId: customer.id, error: error.message },
          'Error updating customer'
        );
        throw new Error(error.message);
      }
      
      logOperation(
        'customers.updateCustomer', 
        'success', 
        { customerId: customer.id },
        'Updated customer'
      );
      
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

      if (error) {
        logOperation(
          'customers.deleteCustomer', 
          'error', 
          { customerId: id, error: error.message },
          'Error deleting customer'
        );
        throw new Error(error.message);
      }
      
      logOperation(
        'customers.deleteCustomer', 
        'success', 
        { customerId: id },
        'Customer deleted successfully'
      );
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
      logOperation(
        'customers.getCustomer', 
        'success', 
        { customerId: id },
        'Fetching customer with ID'
      );
      
      const { data, error } = await supabase
        .from(PROFILES_TABLE)
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        logOperation(
          'customers.getCustomer', 
          'error', 
          { customerId: id, error: error.message },
          'Error fetching customer by ID'
        );
        toast.error('Failed to fetch customer', { description: error.message });
        return null;
      }

      if (!data) {
        logOperation(
          'customers.getCustomer', 
          'warning', 
          { customerId: id },
          'No customer found with ID'
        );
        return null;
      }

      logOperation(
        'customers.getCustomer', 
        'success', 
        { customerId: id },
        'Raw customer data from profiles'
      );

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
      logOperation(
        'customers.getCustomer', 
        'error', 
        { customerId: id, error: error instanceof Error ? error.message : String(error) },
        'Unexpected error fetching customer'
      );
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
