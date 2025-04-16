
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LegalCase } from '@/types/legal-case';

export const useLegalCases = () => {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Using hardcoded data instead of fetching from Supabase
    const hardcodedCases: LegalCase[] = [
      {
        id: '1',
        case_number: 'CASE-2023001',
        title: 'Contract dispute with customer',
        description: 'Customer claims vehicle was in poor condition upon delivery',
        customer_id: '101',
        customer_name: 'Ahmed Al-Farsi',
        status: 'active',
        hearing_date: '2024-05-20',
        court_location: 'Doha Central Court',
        assigned_attorney: 'Fatima Hassan',
        opposing_party: 'Customer',
        case_type: 'contract_dispute',
        documents: ['contract.pdf', 'complaint.pdf'],
        amount_claimed: 15000,
        created_at: '2024-03-15',
        updated_at: '2024-04-01'
      },
      {
        id: '2',
        case_number: 'CASE-2023002',
        title: 'Insurance claim dispute',
        description: 'Insurance company denied coverage for accident damage',
        customer_id: '102',
        customer_name: 'Mohammed Al-Thani',
        status: 'pending',
        hearing_date: '2024-06-10',
        court_location: 'Doha Commercial Court',
        assigned_attorney: 'Yousef Al-Mahmoud',
        opposing_party: 'Insurance Company',
        case_type: 'insurance_claim',
        documents: ['policy.pdf', 'damage_report.pdf'],
        amount_claimed: 32000,
        created_at: '2024-02-22',
        updated_at: '2024-03-30'
      },
      {
        id: '3',
        case_number: 'CASE-2023003',
        title: 'Traffic violation dispute',
        description: 'Customer refusing to pay traffic fine incurred during rental period',
        customer_id: '103',
        customer_name: 'Sara Al-Mansouri',
        status: 'active',
        hearing_date: '2024-05-28',
        opposing_party: 'Customer',
        case_type: 'traffic_violation',
        documents: ['rental_agreement.pdf', 'fine_notice.pdf'],
        amount_claimed: 3500,
        created_at: '2024-04-02',
        updated_at: '2024-04-10'
      },
      {
        id: '4',
        case_number: 'CASE-2023004',
        title: 'Customer complaint about fees',
        description: 'Customer disputing late return fees applied to account',
        customer_id: '104',
        customer_name: 'Khalid Al-Sulaiti',
        status: 'closed',
        hearing_date: '2024-03-15',
        assigned_attorney: 'Maryam Al-Khater',
        opposing_party: 'Customer',
        case_type: 'customer_complaint',
        documents: ['agreement.pdf', 'fee_structure.pdf', 'correspondence.pdf'],
        amount_claimed: 7800,
        amount_settled: 5000,
        created_at: '2024-01-20',
        updated_at: '2024-03-25'
      },
      {
        id: '5',
        case_number: 'CASE-2023005',
        title: 'Vehicle damage dispute',
        description: 'Disagreement over extent of damage caused by customer',
        customer_id: '105',
        customer_name: 'Aisha Al-Emadi',
        status: 'pending',
        hearing_date: '2024-06-22',
        court_location: 'Doha Central Court',
        assigned_attorney: 'Hassan Al-Kuwari',
        opposing_party: 'Customer',
        case_type: 'contract_dispute',
        documents: ['damage_assessment.pdf', 'photos.pdf', 'repair_quote.pdf'],
        amount_claimed: 22500,
        created_at: '2024-03-28',
        updated_at: '2024-04-12'
      }
    ];
    
    // Simulate loading for better UX
    setLoading(true);
    setTimeout(() => {
      setCases(hardcodedCases);
      setLoading(false);
    }, 800);
    
  }, []);

  return { cases, loading, error };
};
