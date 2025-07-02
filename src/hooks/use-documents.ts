
// @ts-nocheck
/* eslint-disable */
import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { 
  Document, 
  CreateDocumentRequest, 
  DocumentEntityType 
} from '@/types/document.types';
import DocumentService from '@/services/DocumentService';
import { downloadDocument } from '@/lib/documents/document-storage';

export const useDocuments = (filters?: {
  entityType?: DocumentEntityType;
  entityId?: string;
  documentType?: string;
}) => {
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading, error } = useQuery({
    queryKey: ['documents', filters],
    queryFn: async () => {
      if (filters?.entityType && filters?.entityId) {
        return await DocumentService.getDocumentsByEntity(filters.entityType, filters.entityId);
      }
      
      let query = supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.documentType) {
        query = query.eq('type', filters.documentType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Document[];
    }
  });

  const createDocument = useMutation({
    mutationFn: async (request: CreateDocumentRequest) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      return await DocumentService.createDocument(request, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document uploaded successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to upload document: ${error.message}`);
    }
  });

  const deleteDocument = useMutation({
    mutationFn: async (id: string) => {
      const success = await DocumentService.deleteDocument(id);
      if (!success) throw new Error('Failed to delete document');
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete document: ${error.message}`);
    }
  });

  const [isDownloading, setIsDownloading] = useState(false);

  const downloadDocumentFile = async (document: Document) => {
    setIsDownloading(true);
    try {
      if (document.public_url) {
        // For public URLs, just open them
        window.open(document.public_url, '_blank');
      } else {
        // For private files, download through storage
        const blob = await downloadDocument(document.storage_path);
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = window.document.createElement('a');
          a.href = url;
          a.download = document.file_name;
          window.document.body.appendChild(a);
          a.click();
          window.document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }
      toast.success('Download started');
    } catch (error: any) {
      toast.error(`Failed to download document: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const generatePDF = async (htmlContent: string, filename: string = 'document.pdf') => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      const tempDiv = window.document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      
      const textContent = tempDiv.textContent || tempDiv.innerText || '';
      doc.text(textContent, 10, 10);
      
      doc.save(filename);
      
      toast.success('PDF generated successfully');
    } catch (err: any) {
      toast.error('Failed to generate PDF');
    }
  };

  return {
    documents,
    isLoading,
    loading: isLoading,
    error: error?.message || null,
    createDocument,
    deleteDocument,
    downloadDocumentFile,
    isDownloading,
    generatePDF
  };
};
