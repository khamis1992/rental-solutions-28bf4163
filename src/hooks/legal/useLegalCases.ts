
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { LegalCaseType, LegalCaseStatus, CasePriority } from '@/types/legal-case';

export interface LegalCase {
  id?: string;
  customer_id: string;
  case_type: LegalCaseType;
  status: LegalCaseStatus;
  amount_owed?: number;
  description?: string;
  priority?: CasePriority;
  assigned_to?: string;
  created_at?: string;
  updated_at?: string;
  resolution_notes?: string;
  resolution_date?: string;
}

export const useLegalCases = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [legalCases, setLegalCases] = useState<LegalCase[]>([]);

  // Case types, statuses, and priorities for dropdowns
  const caseTypes = Object.values(LegalCaseType);
  const caseStatuses = Object.values(LegalCaseStatus);
  const casePriorities = Object.values(CasePriority);

  // Fetch legal cases
  const fetchLegalCases = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('legal_cases')
        .select('*, profiles(full_name)');

      if (error) throw new Error(error.message);
      setLegalCases(data || []);
    } catch (err) {
      console.error("Error fetching legal cases:", err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(new Error(`Failed to fetch legal cases: ${errorMessage}`));
    } finally {
      setIsLoading(false);
    }
  };

  // Load legal cases on component mount
  useEffect(() => {
    fetchLegalCases();
  }, []);

  const createLegalCase = async (caseData: Omit<LegalCase, 'id' | 'created_at' | 'updated_at' | 'resolution_notes' | 'resolution_date'>) => {
    setIsLoading(true);
    setError(null);

    try {
      // Make sure status is provided with a default if not included
      const dataToInsert = {
        ...caseData,
        status: caseData.status || LegalCaseStatus.PENDING
      };

      const { data, error } = await supabase
        .from('legal_cases')
        .insert(dataToInsert)
        .select();

      if (error) throw new Error(error.message);
      
      // Refresh the legal cases
      fetchLegalCases();
      
      return data;
    } catch (err) {
      console.error("Error creating legal case:", err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(new Error(`Failed to create legal case: ${errorMessage}`));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    legalCases,
    createLegalCase,
    caseTypes,
    caseStatuses,
    casePriorities
  };
};
