
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import DocumentService from '@/services/DocumentService';
import { 
  Document, 
  CreateDocumentRequest, 
  DocumentEntityType 
} from '@/types/document.types';
import { downloadDocument } from '@/lib/documents/document-storage';
import { useState } from 'react';

export const useDocumentsEnhanced = (filters?: {
  entityType?: DocumentEntityType;
  entityId?: string;
  documentType?: string;
}) => {
  const queryClient = useQueryClient();
  const [isDownloading, setIsDownloading] = useState(false);

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

  const downloadDocumentFile = async (document: Document) => {
    setIsDownloading(true);
    try {
      if (document.public_url) {
        window.open(document.public_url, '_blank');
      } else {
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

  return {
    documents,
    isLoading,
    error: error?.message || null,
    createDocument,
    deleteDocument,
    downloadDocumentFile,
    isDownloading
  };
};
