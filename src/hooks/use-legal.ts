
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { safelyGetRecordsFromResponse } from '@/types/supabase-helpers';

export type LegalDocument = {
  id: string;
  title: string;
  type: string;
  category: string;
  lastUpdated: Date;
  status: string;
};

export type ComplianceItem = {
  id: string;
  title: string;
  dueDate: Date;
  type: string;
  status: string;
  priority: string;
  description: string;
};

export type LegalCase = {
  id: string;
  customer_id: string;
  customer_name?: string;
  case_number: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'closed' | 'settled';
  created_at: string;
  updated_at: string;
  amount_owed: number;
  hearing_date: string | null;
  assigned_to?: string;
  case_type: string;
  priority?: string;
};

export const useLegalDocuments = () => {
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // This would be replaced with an actual Supabase call in production
        // For now we're using mock data
        
        // Simulate API call
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
        await delay(800);
        
        // Mock documents
        const mockDocuments: LegalDocument[] = [
          { 
            id: '1', 
            title: 'Vehicle Lease Agreement Template', 
            type: 'template', 
            category: 'contracts',
            lastUpdated: new Date(2023, 9, 15),
            status: 'active' 
          },
          { 
            id: '2', 
            title: 'Insurance Policy Requirements', 
            type: 'policy', 
            category: 'insurance',
            lastUpdated: new Date(2023, 11, 3),
            status: 'active' 
          },
          { 
            id: '3', 
            title: 'Driver Conduct Guidelines', 
            type: 'guideline', 
            category: 'operations',
            lastUpdated: new Date(2023, 8, 22),
            status: 'active' 
          },
          { 
            id: '4', 
            title: 'Vehicle Damage Report Form', 
            type: 'form', 
            category: 'reporting',
            lastUpdated: new Date(2023, 10, 7),
            status: 'archived' 
          },
          { 
            id: '5', 
            title: 'Corporate Lease Amendment', 
            type: 'template', 
            category: 'contracts',
            lastUpdated: new Date(2024, 0, 18),
            status: 'draft' 
          },
        ];
        
        setDocuments(mockDocuments);
      } catch (err) {
        console.error('Error fetching legal documents:', err);
        setError('Failed to load legal documents');
        toast.error('Failed to load legal documents');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocuments();
  }, []);

  return { documents, loading, error };
};

export const useComplianceItems = () => {
  const [items, setItems] = useState<ComplianceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchComplianceItems = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // This would be replaced with an actual Supabase call in production
        // For now we're using mock data
        
        // Simulate API call
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
        await delay(800);
        
        // Mock compliance items
        const mockItems: ComplianceItem[] = [
          {
            id: '1',
            title: 'Vehicle Insurance Renewal',
            dueDate: new Date(2024, 2, 15),
            type: 'insurance',
            status: 'pending',
            priority: 'high',
            description: 'Renew insurance policies for fleet vehicles.'
          },
          {
            id: '2',
            title: 'Annual Tax Filing',
            dueDate: new Date(2024, 3, 30),
            type: 'tax',
            status: 'pending',
            priority: 'high',
            description: 'Submit annual tax returns for the company.'
          },
          {
            id: '3',
            title: 'Driver License Verifications',
            dueDate: new Date(2024, 2, 25),
            type: 'license',
            status: 'pending',
            priority: 'medium',
            description: 'Verify all driver licenses are valid and up to date.'
          },
          {
            id: '4',
            title: 'Vehicle Inspection Certificates',
            dueDate: new Date(2024, 4, 10),
            type: 'inspection',
            status: 'pending',
            priority: 'medium',
            description: 'Renew vehicle inspection certificates.'
          }
        ];
        
        setItems(mockItems);
      } catch (err) {
        console.error('Error fetching compliance items:', err);
        setError('Failed to load compliance items');
        toast.error('Failed to load compliance items');
      } finally {
        setLoading(false);
      }
    };
    
    fetchComplianceItems();
  }, []);

  return { items, loading, error };
};

export const useLegalCases = () => {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLegalCases = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch legal cases from Supabase
        const { data: casesData, error: casesError } = await supabase
          .from('legal_cases')
          .select('*')
          .order('created_at', { ascending: false });

        if (casesError) {
          throw casesError;
        }

        // Safely get records using our helper function
        const safeData = safelyGetRecordsFromResponse(casesData ? { data: casesData, error: null } : null);
        
        // For each case, get the customer's name if possible
        const processedCases = await Promise.all(
          safeData.map(async (item) => {
            let customerName = 'Unknown Customer';
            
            try {
              if (item.customer_id) {
                const { data: profileData } = await supabase
                  .from('profiles')
                  .select('full_name')
                  .eq('id', item.customer_id)
                  .single();
                
                if (profileData && profileData.full_name) {
                  customerName = profileData.full_name;
                }
              }
            } catch (err) {
              console.error('Error fetching customer name:', err);
            }
            
            return {
              id: item.id,
              case_number: `CASE-${item.id.substring(0, 8)}`,
              title: item.description ? `Case regarding ${item.description.substring(0, 30)}...` : `Case regarding ${item.case_type || 'dispute'}`,
              description: item.description || '',
              customer_id: item.customer_id,
              customer_name: customerName,
              status: item.status || 'pending',
              hearing_date: item.escalation_date,
              assigned_to: item.assigned_to,
              case_type: item.case_type || 'other',
              amount_owed: item.amount_owed || 0,
              created_at: item.created_at,
              updated_at: item.updated_at,
              priority: item.priority || 'medium'
            };
          })
        );
        
        setCases(processedCases);
      } catch (err) {
        console.error('Error fetching legal cases:', err);
        setError('Failed to load legal cases');
        toast.error('Failed to load legal cases');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLegalCases();
  }, []);

  return { cases, loading, error };
};
