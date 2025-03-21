
import { useState } from 'react';
import { useApiMutation, useApiQuery } from '@/hooks/use-api';
import { ComplianceDocument, ComplianceDocumentFormData } from '@/types/compliance';

export const useCompliance = () => {
  // Mock data for demonstration - replace with actual API calls
  const mockDocuments: ComplianceDocument[] = [
    {
      id: '1',
      document_type: 'insurance',
      entity_id: 'v-123',
      entity_type: 'vehicle',
      upload_date: '2023-01-15',
      expiry_date: '2024-01-15',
      status: 'valid',
      document_url: '/documents/insurance-123.pdf',
      verified_by: 'admin',
      created_at: '2023-01-15T10:30:00Z',
      updated_at: '2023-01-15T10:30:00Z'
    },
    {
      id: '2',
      document_type: 'rental_agreement',
      entity_id: 'a-456',
      entity_type: 'agreement',
      upload_date: '2023-05-20',
      status: 'valid',
      document_url: '/documents/agreement-456.pdf',
      created_at: '2023-05-20T14:45:00Z',
      updated_at: '2023-05-20T14:45:00Z'
    }
  ];

  // List documents
  const useList = (filter?: { entityType?: string; entityId?: string; documentType?: string }) => {
    return useApiQuery(
      ['compliance', filter ? JSON.stringify(filter) : 'all'], 
      async () => {
        // This would be an API call in a real implementation
        let filtered = [...mockDocuments];
        
        if (filter?.entityType) {
          filtered = filtered.filter(d => d.entity_type === filter.entityType);
        }
        
        if (filter?.entityId) {
          filtered = filtered.filter(d => d.entity_id === filter.entityId);
        }
        
        if (filter?.documentType) {
          filtered = filtered.filter(d => d.document_type === filter.documentType);
        }
        
        return filtered;
      }
    );
  };

  // Get single document
  const useItem = (id: string) => {
    return useApiQuery(
      ['compliance', id], 
      async () => {
        // This would be an API call in a real implementation
        return mockDocuments.find(d => d.id === id) as ComplianceDocument;
      }
    );
  };

  // Create document
  const useCreate = () => 
    useApiMutation(
      async (data: ComplianceDocumentFormData) => {
        // This would be an API call in a real implementation
        console.log('Creating compliance document:', data);
        return { 
          id: 'new-id', 
          ...data, 
          created_at: new Date().toISOString(), 
          updated_at: new Date().toISOString() 
        } as ComplianceDocument;
      }
    );

  // Update document
  const useUpdate = () => 
    useApiMutation(
      async ({ id, data }: { id: string, data: Partial<ComplianceDocumentFormData> }) => {
        // This would be an API call in a real implementation
        console.log(`Updating compliance document ${id}:`, data);
        return { 
          id, 
          ...data, 
          updated_at: new Date().toISOString() 
        } as ComplianceDocument;
      }
    );

  // Delete document
  const useDelete = () => 
    useApiMutation(
      async (id: string) => {
        // This would be an API call in a real implementation
        console.log(`Deleting compliance document ${id}`);
        return id;
      }
    );

  // Check for expiring documents
  const useExpiringDocuments = (daysThreshold: number = 30) => {
    return useApiQuery(
      ['compliance', 'expiring', daysThreshold.toString()], // Convert number to string for queryKey
      async () => {
        // This would be an API call in a real implementation
        const today = new Date();
        const thresholdDate = new Date();
        thresholdDate.setDate(today.getDate() + daysThreshold);
        
        return mockDocuments.filter(doc => {
          if (!doc.expiry_date) return false;
          const expiryDate = new Date(doc.expiry_date);
          return expiryDate <= thresholdDate && expiryDate >= today;
        });
      }
    );
  };

  return {
    useList,
    useItem,
    useCreate,
    useUpdate,
    useDelete,
    useExpiringDocuments
  };
};
