
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
            description,
            customer_id,
            status,
            escalation_date,
            assigned_to,
            case_type,
            amount_owed,
            created_at,
            updated_at
          `);
        
        if (error) {
          console.error('Error fetching legal cases:', error);
          setError(`Failed to load legal cases: ${error.message}`);
          toast.error('Failed to load legal cases');
          return;
        }
        
        // Now fetch the customer data for each case
        const enhancedCases = await Promise.all(
          data.map(async (caseData: any) => {
            let customerName = 'Unknown Customer';
            
            if (caseData.customer_id) {
              const { data: customerData, error: customerError } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', caseData.customer_id)
                .single();
                
              if (!customerError && customerData) {
                customerName = customerData.full_name;
              }
            }
            
            // Transform to match the LegalCase type
            const transformedCase: LegalCase = {
              id: caseData.id,
              case_number: `CASE-${caseData.id.substring(0, 8)}`,
              title: caseData.description ? `Case regarding ${caseData.description.substring(0, 30)}...` : `Case regarding ${caseData.case_type || 'dispute'}`,
              description: caseData.description || '',
              customer_id: caseData.customer_id,
              customer_name: customerName,
              status: caseData.status || 'pending',
              hearing_date: caseData.escalation_date,
              court_location: '',
              assigned_attorney: caseData.assigned_to || '',
              opposing_party: '',
              case_type: caseData.case_type || 'other',
              documents: [],
              amount_claimed: caseData.amount_owed || 0,
              amount_settled: null,
              created_at: caseData.created_at,
              updated_at: caseData.updated_at,
              notes: ''
            };
            
            return transformedCase;
          })
        );
        
        setCases(enhancedCases);
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
