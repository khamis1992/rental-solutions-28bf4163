
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { CustomerInfo } from '@/types/customer';
import { castDbId } from '@/utils/database-type-helpers';
import { useState } from 'react';

// Define customer status type
type CustomerStatus = 'active' | 'inactive' | 'pending_review' | 'blacklisted' | 'pending_payment';

export const useCustomers = () => {
  const queryClient = useQueryClient();
  
  // Add search params state
  const [searchParams, setSearchParams] = useState<{
    query: string;
    status: string;
  }>({
    query: '',
    status: 'all'
  });

  // Get all customers
  const { data: customers = [], isLoading, error, refetch } = useQuery({
    queryKey: ['customers', searchParams],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'customer' as any)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Type check and transform data
        return (data || []).map(customer => {
          // Safely access properties with type checking
          if (!customer || typeof customer !== 'object') {
            return null;
          }
          
          return {
            id: customer.id,
            full_name: customer.full_name || '',
            email: customer.email || '',
            phone_number: customer.phone_number || '',
            phone: customer.phone_number || '', // Added for compatibility
            driver_license: customer.driver_license || '',
            nationality: customer.nationality || '',
            address: customer.address || '',
            notes: customer.notes || '',
            status: (customer.status as CustomerStatus) || 'pending_review',
            created_at: customer.created_at || '',
            updated_at: customer.updated_at || ''
          } as CustomerInfo;
        }).filter(Boolean) as CustomerInfo[];
      } catch (error) {
        console.error('Error fetching customers:', error);
        throw error;
      }
    }
  });

  // Get customers by status
  const getCustomersByStatus = (status: CustomerStatus) => {
    return (customers || []).filter(customer => customer.status === status);
  };

  // Add customer
  const addCustomer = useMutation({
    mutationFn: async (newCustomer: CustomerInfo) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .insert([{
            full_name: newCustomer.full_name,
            email: newCustomer.email,
            phone_number: newCustomer.phone_number,
            address: newCustomer.address,
            driver_license: newCustomer.driver_license,
            nationality: newCustomer.nationality,
            notes: newCustomer.notes,
            status: newCustomer.status as any,
            role: 'customer',
            created_at: new Date().toISOString()
          }] as any)
          .select();

        if (error) throw error;

        // Safe access with type checking
        if (Array.isArray(data) && data.length > 0 && data[0]) {
          const customer = data[0];
          return {
            id: customer.id || '',
            full_name: customer.full_name || '',
            email: customer.email || '',
            phone_number: customer.phone_number || '',
            phone: customer.phone_number || '',
            driver_license: customer.driver_license || '',
            nationality: customer.nationality || '',
            address: customer.address || '',
            notes: customer.notes || '',
            status: (customer.status as CustomerStatus) || 'pending_review',
            created_at: customer.created_at || '',
            updated_at: customer.updated_at || ''
          };
        }
        
        throw new Error('Failed to retrieve customer data after creation');
      } catch (error) {
        console.error('Error adding customer:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Error adding customer: ${error.message}`);
    }
  });

  // Update customer
  const updateCustomer = useMutation({
    mutationFn: async (updatedCustomer: CustomerInfo) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .update({
            full_name: updatedCustomer.full_name,
            email: updatedCustomer.email,
            phone_number: updatedCustomer.phone_number,
            address: updatedCustomer.address,
            driver_license: updatedCustomer.driver_license,
            nationality: updatedCustomer.nationality,
            notes: updatedCustomer.notes,
            status: updatedCustomer.status as any,
            updated_at: new Date().toISOString()
          } as any)
          .eq('id', castDbId(updatedCustomer.id))
          .select();

        if (error) throw error;

        // Safe access with type checking
        if (Array.isArray(data) && data.length > 0 && data[0]) {
          const customer = data[0];
          return {
            id: customer.id || '',
            full_name: customer.full_name || '',
            email: customer.email || '',
            phone_number: customer.phone_number || '',
            phone: customer.phone_number || '',
            driver_license: customer.driver_license || '',
            nationality: customer.nationality || '',
            address: customer.address || '',
            notes: customer.notes || '',
            status: (customer.status as CustomerStatus) || 'pending_review',
            created_at: customer.created_at || '',
            updated_at: customer.updated_at || ''
          };
        }
        
        throw new Error('Failed to retrieve customer data after update');
      } catch (error) {
        console.error('Error updating customer:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Error updating customer: ${error.message}`);
    }
  });

  // Delete customer
  const deleteCustomer = useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', castDbId(id));

        if (error) throw error;
        return id;
      } catch (error) {
        console.error('Error deleting customer:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Error deleting customer: ${error.message}`);
    }
  });

  // Get customer by ID - implemented as a standalone function
  const getCustomer = async (customerId: string): Promise<CustomerInfo | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', castDbId(customerId))
        .single();

      if (error) throw error;

      // Type check and transform data
      if (!data || typeof data !== 'object') {
        return null;
      }

      return {
        id: data.id || '',
        full_name: data.full_name || '',
        email: data.email || '',
        phone_number: data.phone_number || '',
        phone: data.phone_number || '', // Added for compatibility
        driver_license: data.driver_license || '',
        nationality: data.nationality || '',
        address: data.address || '',
        notes: data.notes || '',
        status: (data.status as CustomerStatus) || 'pending_review',
        created_at: data.created_at || '',
        updated_at: data.updated_at || ''
      };
    } catch (error) {
      console.error(`Error fetching customer ${customerId}:`, error);
      throw error;
    }
  };

  // Get customer by ID as a query hook
  const useCustomer = (customerId: string) => {
    return useQuery({
      queryKey: ['customer', customerId],
      queryFn: async () => {
        if (!customerId) {
          throw new Error('Customer ID is required');
        }
        
        return getCustomer(customerId);
      },
      enabled: !!customerId
    });
  };

  // Function to refresh customers data
  const refreshCustomers = () => {
    queryClient.invalidateQueries({ queryKey: ['customers'] });
    refetch();
  };

  // Return all functions and state
  return {
    customers,
    isLoading,
    error,
    getCustomersByStatus,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    useCustomer,
    getCustomer,
    searchParams,
    setSearchParams,
    refreshCustomers
  };
};
