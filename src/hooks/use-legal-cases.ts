
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LegalCase } from '@/types/legal-case';

export const useLegalCases = () => {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLegalCases = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase
          .from('legal_cases')
          .select(`
            id,
            case_number,
            title,
            description,
            customer_id,
            customer_name,
            status,
            hearing_date,
            court_location,
            assigned_attorney,
            opposing_party,
            case_type,
            documents,
            amount_claimed,
            amount_settled,
            created_at,
            updated_at,
            notes
          `)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching legal cases:', error);
          setError(`Failed to load legal cases: ${error.message}`);
          toast.error('Failed to load legal cases');
          return;
        }
        
        // Transform data if needed
        const legalCases = data as LegalCase[];
        setCases(legalCases);
      } catch (err) {
        console.error('Unexpected error fetching legal cases:', err);
        setError('An unexpected error occurred while fetching legal cases');
        toast.error('Failed to load legal cases');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLegalCases();
  }, []);

  return { cases, loading, error };
};
