
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { LegalCase, LegalCaseType, LegalCaseStatus, CasePriority } from '@/types/legal-case';

interface UseLegalCasesOptions {
  customerId?: string;
  caseStatus?: LegalCaseStatus;
  priority?: CasePriority;
}

export function useLegalCases(options: UseLegalCasesOptions = {}) {
  const [legalCases, setLegalCases] = useState<LegalCase[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLegalCases = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      let query = supabase
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
      
      if (options.customerId) {
        query = query.eq('customer_id', options.customerId);
      }
      
      if (options.caseStatus) {
        query = query.eq('status', options.caseStatus);
      }
      
      if (options.priority) {
        query = query.eq('priority', options.priority);
      }
      
      const { data, error: supabaseError } = await query;
      
      if (supabaseError) {
        throw new Error(supabaseError.message);
      }
      
      setLegalCases(data as LegalCase[]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      console.error('Error fetching legal cases:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createLegalCase = async (caseData: Omit<LegalCase, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('legal_cases')
        .insert([caseData])
        .select();
      
      if (supabaseError) {
        throw new Error(supabaseError.message);
      }
      
      await fetchLegalCases();
      return data ? data[0] : null;
    } catch (err) {
      console.error('Error creating legal case:', err);
      throw err;
    }
  };

  const updateLegalCase = async (id: string, updates: Partial<LegalCase>) => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('legal_cases')
        .update(updates)
        .eq('id', id)
        .select();
      
      if (supabaseError) {
        throw new Error(supabaseError.message);
      }
      
      await fetchLegalCases();
      return data ? data[0] : null;
    } catch (err) {
      console.error('Error updating legal case:', err);
      throw err;
    }
  };

  const deleteLegalCase = async (id: string) => {
    try {
      const { error: supabaseError } = await supabase
        .from('legal_cases')
        .delete()
        .eq('id', id);
      
      if (supabaseError) {
        throw new Error(supabaseError.message);
      }
      
      await fetchLegalCases();
      return true;
    } catch (err) {
      console.error('Error deleting legal case:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchLegalCases();
  }, [options.customerId, options.caseStatus, options.priority]);

  return {
    legalCases,
    isLoading,
    error,
    fetchLegalCases,
    createLegalCase,
    updateLegalCase,
    deleteLegalCase
  };
}
