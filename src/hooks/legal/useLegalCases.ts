
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { LegalCase, LegalCaseType, LegalCaseStatus, CasePriority } from '@/types/legal-case';

export interface UseLegalCasesOptions {
  customerId?: string;
  agreementId?: string;
  status?: string;
}

export function useLegalCases(options?: UseLegalCasesOptions) {
  const [legalCases, setLegalCases] = useState<LegalCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLegalCases = useCallback(async () => {
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
      
      // Apply filters based on options
      if (options?.customerId) {
        query = query.eq('customer_id', options.customerId);
      }
      
      if (options?.status) {
        query = query.eq('status', options.status);
      }
      
      if (options?.agreementId) {
        query = query.eq('agreement_id', options.agreementId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw new Error(error.message);
      }
      
      setLegalCases(data || []);
    } catch (err) {
      console.error('Error fetching legal cases:', err);
      setError(err instanceof Error ? err : new Error('Unknown error fetching legal cases'));
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  // Create a new legal case
  const createLegalCase = async (caseData: Omit<LegalCase, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('legal_cases')
        .insert([{
          ...caseData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select();
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data && data.length > 0) {
        setLegalCases(prevCases => [data[0] as LegalCase, ...prevCases]);
        return data[0] as LegalCase;
      }
      
      return null;
    } catch (err) {
      console.error('Error creating legal case:', err);
      setError(err instanceof Error ? err : new Error('Unknown error creating legal case'));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Update an existing legal case
  const updateLegalCase = async (id: string, updates: Partial<LegalCase>) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('legal_cases')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data && data.length > 0) {
        setLegalCases(prevCases =>
          prevCases.map(c => (c.id === id ? { ...c, ...data[0] } as LegalCase : c))
        );
        return data[0] as LegalCase;
      }
      
      return null;
    } catch (err) {
      console.error('Error updating legal case:', err);
      setError(err instanceof Error ? err : new Error('Unknown error updating legal case'));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a legal case
  const deleteLegalCase = async (id: string) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('legal_cases')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw new Error(error.message);
      }
      
      setLegalCases(prevCases => prevCases.filter(c => c.id !== id));
      return true;
    } catch (err) {
      console.error('Error deleting legal case:', err);
      setError(err instanceof Error ? err : new Error('Unknown error deleting legal case'));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLegalCases();
  }, [fetchLegalCases]);

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
