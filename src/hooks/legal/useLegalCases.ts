
import { useState } from 'react';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Case types, statuses, and priorities for dropdowns
  const caseTypes = Object.values(LegalCaseType);
  const caseStatuses = Object.values(LegalCaseStatus);
  const casePriorities = Object.values(CasePriority);

  const createLegalCase = async (caseData: Omit<LegalCase, 'id' | 'created_at' | 'updated_at' | 'resolution_notes' | 'resolution_date'>) => {
    setLoading(true);
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
      return data;
    } catch (err) {
      console.error("Error creating legal case:", err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(new Error(`Failed to create legal case: ${errorMessage}`));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createLegalCase,
    caseTypes,
    caseStatuses,
    casePriorities
  };
};
