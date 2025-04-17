
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LegalCase } from '@/types/legal-case';

export const useLegalCases = () => {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLegalCases = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('legal_cases')
          .select(`
            id, 
            customer_id,
            case_type,
            status,
            amount_owed,
            priority,
            assigned_to,
            description,
            created_at,
            updated_at,
            resolution_date,
            resolution_notes,
            profiles(full_name, email, phone_number)
          `)
          .order('created_at', { ascending: false });

        if (error) {
          setError(error.message);
          toast.error('Failed to load legal cases', {
            description: error.message
          });
        } else {
          setCases(data || []);
        }
      } catch (err) {
        setError('An unexpected error occurred');
        toast.error('Failed to load legal cases', {
          description: 'An unexpected error occurred while fetching data'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLegalCases();
  }, []);

  return { cases, loading, error };
};
