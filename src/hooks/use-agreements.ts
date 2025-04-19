import { useMutation, useQuery, useQueryClient } from 'react-query';
import { supabase } from '@/lib/supabase';
import { Agreement, AgreementSchema, SimpleAgreement } from '@/lib/validation-schemas/agreement';
import { Customer } from '@/types/customer';
import { Vehicle } from '@/types/vehicle';
import { toast } from 'sonner';

// Remove recursive type and simplify
export function useAgreements() {
  const queryClient = useQueryClient();

  const getAgreements = async (): Promise<SimpleAgreement[]> => {
    const { data, error } = await supabase
      .from('leases')
      .select('*, customers(full_name), vehicles(make, model, license_plate)')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }
    return data || [];
  };

  const useAgreementsQuery = () =>
    useQuery('agreements', getAgreements, {
      placeholderData: [],
    });

  const createAgreement = useMutation(
    async (newAgreement: Agreement) => {
      const result = AgreementSchema.safeParse(newAgreement);
      if (!result.success) {
        console.error("Validation errors:", result.error.format());
        throw new Error("Validation failed. Check console for details.");
      }
      
      const { data, error } = await supabase
        .from('leases')
        .insert([newAgreement])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('agreements');
        toast.success('Agreement created successfully!');
      },
      onError: (error: any) => {
        toast.error(`Failed to create agreement: ${error.message}`);
      },
    }
  );

  const updateAgreement = useMutation(
    async (agreementUpdate: Agreement) => {
      const result = AgreementSchema.safeParse(agreementUpdate);
      if (!result.success) {
        console.error("Validation errors:", result.error.format());
        throw new Error("Validation failed. Check console for details.");
      }
      
      const { data, error } = await supabase
        .from('leases')
        .update(agreementUpdate)
        .eq('id', agreementUpdate.id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('agreements');
        toast.success('Agreement updated successfully!');
      },
      onError: (error: any) => {
        toast.error(`Failed to update agreement: ${error.message}`);
      },
    }
  );

  const deleteAgreement = useMutation(
    async (id: string) => {
      const { data, error } = await supabase
        .from('leases')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('agreements');
        toast.success('Agreement deleted successfully!');
      },
      onError: (error: any) => {
        toast.error(`Failed to delete agreement: ${error.message}`);
      },
    }
  );
  
  const getAgreement = async (id: string) => {
    const { data } = await supabase
      .from('leases')
      .select('*, customers(*), vehicles(*)')
      .eq('id', id)
      .single();
    return data;
  }

  return {
    useAgreementsQuery,
    createAgreement,
    updateAgreement,
    deleteAgreement,
    getAgreement
  };
}
