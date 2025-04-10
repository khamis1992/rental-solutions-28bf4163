
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
