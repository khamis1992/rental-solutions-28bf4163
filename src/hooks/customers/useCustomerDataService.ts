
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Customer } from '@/lib/validation-schemas/customer';
import { toast } from 'sonner';
import { CacheSynchronization } from '@/utils/cache-synchronization';

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

export const useCustomerDataService = () => {
  const queryClient = useQueryClient();

  // Set the query client for cache synchronization
  CacheSynchronization.setQueryClient(queryClient);

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
      
      if (!data) {
        throw new Error('No data returned after customer creation');
      }
      
      return {
        ...data,
        phone: data.phone_number ? stripCountryCode(data.phone_number) : ''
      } as Customer;
    },
    onSuccess: async () => {
      await CacheSynchronization.invalidateCustomerCaches();
      toast.success('Customer created successfully');
    },
    onError: (error: Error) => {
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
      
      if (!data || data.length === 0) {
        throw new Error('No data returned after customer update');
      }
      
      return {
        ...data[0],
        phone: data[0].phone_number ? stripCountryCode(data[0].phone_number) : ''
      } as Customer;
    },
    onSuccess: async () => {
      await CacheSynchronization.invalidateCustomerCaches();
      toast.success('Customer updated successfully');
    },
    onError: (error: Error) => {
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
    onSuccess: async () => {
      await CacheSynchronization.invalidateCustomerCaches();
      toast.success('Customer deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete customer', { description: error.message });
    },
  });

  return {
    createCustomer,
    updateCustomer,
    deleteCustomer,
  };
};
