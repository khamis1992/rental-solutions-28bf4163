
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Customer } from '@/lib/validation-schemas/customer';
import { formatQatarPhoneNumber } from './customer-utils';
import { toast } from 'sonner';

export const useCustomerMutations = () => {
  const queryClient = useQueryClient();

  const createCustomer = useMutation({
    mutationFn: async (newCustomer: Omit<Customer, 'id'>) => {
      console.log('Creating new customer with data:', newCustomer);
      
      const formattedPhone = formatQatarPhoneNumber(newCustomer.phone);
      console.log('Formatted phone number:', formattedPhone);
      
      const { data, error } = await supabase
        .from('profiles')
        .insert([{ 
          full_name: newCustomer.full_name,
          email: newCustomer.email,
          phone_number: formattedPhone,
          address: newCustomer.address,
          driver_license: newCustomer.driver_license,
          nationality: newCustomer.nationality,
          notes: newCustomer.notes,
          status: newCustomer.status || 'active',
          role: 'customer',
          created_at: new Date().toISOString() 
        }])
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
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
      
      const { data, error } = await supabase
        .from('profiles')
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
      return data[0];
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
        .from('profiles')
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

  return {
    createCustomer,
    updateCustomer,
    deleteCustomer,
  };
};
