
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  driving_license: string;
  address: string | null;
  customer_type: "individual" | "corporate";
  company_name: string | null;
  tax_number: string | null;
  status: "active" | "pending" | "inactive";
  notes: string | null;
  created_at: string;
}

export const useCustomers = () => {
  const queryClient = useQueryClient();

  // Fetch all customers
  const useGetCustomers = (filters?: Record<string, any>) => {
    return useQuery({
      queryKey: ['customers', filters],
      queryFn: async () => {
        let query = supabase.from('customers').select('*');
        
        // Apply filters if provided
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value) {
              if (typeof value === 'string' && key === 'search') {
                // Handle search across multiple fields
                query = query.or(`first_name.ilike.%${value}%,last_name.ilike.%${value}%,email.ilike.%${value}%`);
              } else {
                query = query.eq(key, value);
              }
            }
          });
        }
        
        const { data, error } = await query;
        
        if (error) {
          throw new Error(error.message);
        }
        
        return data as Customer[];
      }
    });
  };

  // Fetch a single customer by ID
  const useGetCustomer = (id?: string) => {
    return useQuery({
      queryKey: ['customers', id],
      queryFn: async () => {
        if (!id) return null;
        
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) {
          throw new Error(error.message);
        }
        
        return data as Customer;
      },
      enabled: !!id, // Only run query if id exists
    });
  };

  // Create a new customer
  const useCreateCustomer = () => {
    return useMutation({
      mutationFn: async (newCustomer: Omit<Customer, 'id' | 'created_at'>) => {
        const { data, error } = await supabase
          .from('customers')
          .insert([newCustomer])
          .select()
          .single();
        
        if (error) {
          throw new Error(error.message);
        }
        
        return data as Customer;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['customers'] });
        toast.success('Customer created successfully');
      },
      onError: (error: Error) => {
        toast.error('Failed to create customer', { description: error.message });
      }
    });
  };

  // Update an existing customer
  const useUpdateCustomer = () => {
    return useMutation({
      mutationFn: async ({ id, ...customerData }: Partial<Customer> & { id: string }) => {
        const { data, error } = await supabase
          .from('customers')
          .update(customerData)
          .eq('id', id)
          .select()
          .single();
        
        if (error) {
          throw new Error(error.message);
        }
        
        return data as Customer;
      },
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['customers'] });
        queryClient.invalidateQueries({ queryKey: ['customers', variables.id] });
        toast.success('Customer updated successfully');
      },
      onError: (error: Error) => {
        toast.error('Failed to update customer', { description: error.message });
      }
    });
  };

  // Delete an existing customer
  const useDeleteCustomer = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase
          .from('customers')
          .delete()
          .eq('id', id);
        
        if (error) {
          throw new Error(error.message);
        }
        
        return id;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['customers'] });
        toast.success('Customer deleted successfully');
      },
      onError: (error: Error) => {
        toast.error('Failed to delete customer', { description: error.message });
      }
    });
  };

  return {
    useGetCustomers,
    useGetCustomer,
    useCreateCustomer,
    useUpdateCustomer,
    useDeleteCustomer
  };
};
