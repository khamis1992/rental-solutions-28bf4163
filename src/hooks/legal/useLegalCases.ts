
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { LegalCase, LegalCaseType, LegalCaseStatus, CasePriority } from '@/types/legal-case';
import { toast } from 'sonner';

export const useLegalCases = () => {
  const queryClient = useQueryClient();

  const fetchLegalCases = async (): Promise<LegalCase[]> => {
    const { data, error } = await supabase
      .from('legal_cases')
      .select(`
        *,
        profiles:customer_id (
          full_name,
          email,
          phone_number
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching legal cases:', error);
      throw new Error(error.message);
    }

    return data as LegalCase[];
  };

  const fetchLegalCaseById = async (id: string): Promise<LegalCase> => {
    const { data, error } = await supabase
      .from('legal_cases')
      .select(`
        *,
        profiles:customer_id (
          full_name,
          email,
          phone_number
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching legal case ${id}:`, error);
      throw new Error(error.message);
    }

    return data as LegalCase;
  };

  const createLegalCase = async (caseData: Omit<LegalCase, 'id' | 'created_at' | 'updated_at' | 'resolution_date' | 'resolution_notes'>): Promise<LegalCase> => {
    // Validate that customer_id exists in profiles table
    const { data: profileCheck, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', caseData.customer_id)
      .single();

    if (profileError || !profileCheck) {
      const errorMsg = 'Invalid customer ID. Customer does not exist in database.';
      console.error(errorMsg, profileError);
      throw new Error(errorMsg);
    }

    // Insert new legal case
    const { data, error } = await supabase
      .from('legal_cases')
      .insert([
        {
          ...caseData,
          status: caseData.status || 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          resolution_date: null,
          resolution_notes: null
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating legal case:', error);
      throw new Error(error.message);
    }

    toast.success('Legal case created successfully');
    queryClient.invalidateQueries({ queryKey: ['legalCases'] });
    return data as LegalCase;
  };

  const updateLegalCase = async ({ id, ...updates }: Partial<LegalCase> & { id: string }): Promise<LegalCase> => {
    const { data, error } = await supabase
      .from('legal_cases')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating legal case ${id}:`, error);
      throw new Error(error.message);
    }

    toast.success('Legal case updated successfully');
    queryClient.invalidateQueries({ queryKey: ['legalCases'] });
    queryClient.invalidateQueries({ queryKey: ['legalCase', id] });
    return data as LegalCase;
  };

  const deleteLegalCase = async (id: string): Promise<void> => {
    // Check for related records first
    const { data: historyCheck, error: historyError } = await supabase
      .from('legal_case_history')
      .select('id')
      .eq('case_id', id)
      .limit(1);

    if (historyCheck && historyCheck.length > 0) {
      throw new Error('Cannot delete legal case with associated history records');
    }

    // Check for settlements
    const { data: settlementCheck, error: settlementError } = await supabase
      .from('legal_settlements')
      .select('id')
      .eq('case_id', id)
      .limit(1);

    if (settlementCheck && settlementCheck.length > 0) {
      throw new Error('Cannot delete legal case with associated settlement records');
    }

    const { error } = await supabase
      .from('legal_cases')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting legal case ${id}:`, error);
      throw new Error(error.message);
    }

    toast.success('Legal case deleted successfully');
    queryClient.invalidateQueries({ queryKey: ['legalCases'] });
  };

  const getLegalCasesByCustomerId = async (customerId: string): Promise<LegalCase[]> => {
    try {
      console.log("Fetching legal cases for customer ID:", customerId);
      
      const { data, error } = await supabase
        .from('legal_cases')
        .select(`
          *,
          profiles:customer_id (
            full_name,
            email,
            phone_number
          )
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error(`Error fetching legal cases for customer ${customerId}:`, error);
        throw new Error(error.message);
      }

      console.log(`Found ${data?.length || 0} legal cases for customer ${customerId}`);
      return data || [];
    } catch (error) {
      console.error(`Failed to get legal cases for customer ${customerId}:`, error);
      // Return empty array instead of throwing to handle gracefully
      return [];
    }
  };

  const resolveLegalCase = async ({ id, resolution_notes }: { id: string, resolution_notes: string }): Promise<LegalCase> => {
    const { data, error } = await supabase
      .from('legal_cases')
      .update({
        status: LegalCaseStatus.RESOLVED,
        resolution_date: new Date().toISOString(),
        resolution_notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error resolving legal case ${id}:`, error);
      throw new Error(error.message);
    }

    toast.success('Legal case resolved successfully');
    queryClient.invalidateQueries({ queryKey: ['legalCases'] });
    queryClient.invalidateQueries({ queryKey: ['legalCase', id] });
    return data as LegalCase;
  };

  // Queries
  const { data: legalCases, isLoading, error } = useQuery({
    queryKey: ['legalCases'],
    queryFn: fetchLegalCases
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createLegalCase
  });

  const updateMutation = useMutation({
    mutationFn: updateLegalCase
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLegalCase
  });

  const resolveMutation = useMutation({
    mutationFn: resolveLegalCase
  });

  return {
    legalCases: legalCases || [],
    isLoading,
    error,
    fetchLegalCaseById,
    getLegalCasesByCustomerId,
    createLegalCase: createMutation.mutateAsync,
    updateLegalCase: updateMutation.mutateAsync,
    deleteLegalCase: deleteMutation.mutateAsync,
    resolveLegalCase: resolveMutation.mutateAsync,
    caseTypes: Object.values(LegalCaseType),
    caseStatuses: Object.values(LegalCaseStatus),
    casePriorities: Object.values(CasePriority),
  };
};
