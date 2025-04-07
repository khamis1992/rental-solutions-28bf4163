
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TrafficFine } from '@/types/models';

// Create a simplified agreement type to avoid recursion issues
export interface SimpleAgreement {
  id: string;
  start_date?: string | Date | null;
  end_date?: string | Date | null;
  status?: string;
  vehicle_id?: string;
  customer_id?: string;
  total_amount?: number;
  payment_status?: string;
  created_at?: string | null;
  updated_at?: string | null;
  deposit_amount?: number;
  notes?: string;
  lease_number?: string;
}

export function useAgreements() {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  // Fetch all agreements
  const { data: agreements, isLoading, error } = useQuery({
    queryKey: ['agreements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leases')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data as SimpleAgreement[];
    }
  });

  // Get agreement details
  const getAgreementDetails = async (id: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leases')
        .select(`
          *,
          vehicles (*),
          customers (*)
        `)
        .eq('id', id)
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching agreement details:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Create new agreement
  const createAgreement = useMutation({
    mutationFn: async (agreementData: Partial<SimpleAgreement>) => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('leases')
          .insert([agreementData])
          .select();
          
        if (error) throw error;
        return data[0];
      } finally {
        setLoading(false);
      }
    },
    onSuccess: () => {
      toast.success('Agreement created successfully');
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
    },
    onError: (error) => {
      console.error('Error creating agreement:', error);
      toast.error('Failed to create agreement');
    }
  });

  // Update agreement
  const updateAgreement = useMutation({
    mutationFn: async ({ id, ...agreementData }: { id: string } & Partial<SimpleAgreement>) => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('leases')
          .update(agreementData)
          .eq('id', id)
          .select();
          
        if (error) throw error;
        return data[0];
      } finally {
        setLoading(false);
      }
    },
    onSuccess: () => {
      toast.success('Agreement updated successfully');
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
    },
    onError: (error) => {
      console.error('Error updating agreement:', error);
      toast.error('Failed to update agreement');
    }
  });

  // Delete agreement
  const deleteAgreement = useMutation({
    mutationFn: async (id: string) => {
      setLoading(true);
      try {
        const { error } = await supabase
          .from('leases')
          .delete()
          .eq('id', id);
          
        if (error) throw error;
        return id;
      } finally {
        setLoading(false);
      }
    },
    onSuccess: () => {
      toast.success('Agreement deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
    },
    onError: (error) => {
      console.error('Error deleting agreement:', error);
      toast.error('Failed to delete agreement');
    }
  });

  return {
    agreements,
    isLoading: isLoading || loading,
    error,
    getAgreementDetails,
    createAgreement,
    updateAgreement,
    deleteAgreement
  };
}
