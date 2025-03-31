
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Customer } from '@/lib/validation-schemas/customer';
import { toast } from 'sonner';

// Change the table name from 'customers' to 'profiles'
const PROFILES_TABLE = 'profiles';
const CUSTOMER_ROLE = 'customer';

// Function to format Qatar phone number - ensure it has the +974 prefix
const formatQatarPhoneNumber = (phone: string): string => {
  // Remove any existing country code if present
  const cleanPhone = phone.replace(/^\+974/, '').trim();
  
  // Add the +974 prefix if it's a valid 8-digit Qatar number
  if (/^[3-9]\d{7}$/.test(cleanPhone)) {
    return `+974${cleanPhone}`;
  }
  
  // Return original if not matching format (validation will catch this)
  return phone;
};

// Function to strip country code for display/edit
const stripCountryCode = (phone: string): string => {
  return phone.replace(/^\+974/, '').trim();
};

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
          // Cast the status to a valid value for the query
          query = query.eq('status', searchParams.status as "active" | "inactive" | "pending_review" | "blacklisted");
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
          phone: stripCountryCode(profile.phone_number || ''), // Strip +974 for UI display
          driver_license: profile.driver_license || '',
          nationality: profile.nationality || '',
          address: profile.address || '',
          notes: profile.notes || '',
          status: (profile.status || 'active') as "active" | "inactive" | "pending_review" | "blacklisted",
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
      
      // Format phone number to include +974 country code
      const formattedPhone = formatQatarPhoneNumber(newCustomer.phone);
      console.log('Formatted phone number:', formattedPhone);
      
      const { data, error } = await supabase
        .from(PROFILES_TABLE)
        .insert([{ 
          full_name: newCustomer.full_name,
          email: newCustomer.email,
          phone_number: formattedPhone, // Store with +974 prefix
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
      
      // Return customer with country code stripped from phone for UI consistency
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

  // Update a customer
  const updateCustomer = useMutation({
    mutationFn: async (customer: Customer) => {
      // Format phone number to include +974 country code
      const formattedPhone = formatQatarPhoneNumber(customer.phone);
      console.log('Updating customer with formatted phone:', formattedPhone);
      
      const { data, error } = await supabase
        .from(PROFILES_TABLE)
        .update({ 
          full_name: customer.full_name,
          email: customer.email,
          phone_number: formattedPhone, // Store with +974 prefix
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
      
      // Return customer with country code stripped for UI consistency
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
        phone: stripCountryCode(data.phone_number || ''), // Strip country code for UI
        driver_license: data.driver_license || '',
        nationality: data.nationality || '',
        address: data.address || '',
        notes: data.notes || '',
        status: (data.status || 'active') as "active" | "inactive" | "pending_review" | "blacklisted",
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
