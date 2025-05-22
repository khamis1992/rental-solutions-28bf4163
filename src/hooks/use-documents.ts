import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import DocumentService from '@/services/DocumentService';
import { 
  Document, 
  CreateDocumentRequest, 
  UpdateDocumentRequest, 
  DocumentEntityType 
} from '@/types/document.types';
import { useAuth } from '@/contexts/AuthContext';
import { downloadDocument } from '@/lib/documents/document-storage';

export function useDocuments() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  
  const {
    data: documents,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Document[];
    },
  });
  
  const createDocument = useMutation({
    mutationFn: async (request: CreateDocumentRequest) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      return DocumentService.createDocument(request, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document created successfully');
    },
    onError: (error: any) => {
      console.error('Error creating document:', error);
      toast.error(`Failed to create document: ${error.message}`);
    }
  });
  
  const updateDocument = useMutation({
    mutationFn: (request: UpdateDocumentRequest) => {
      return DocumentService.updateDocument(request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document updated successfully');
    },
    onError: (error: any) => {
      console.error('Error updating document:', error);
      toast.error(`Failed to update document: ${error.message}`);
    }
  });
  
  const deleteDocument = useMutation({
    mutationFn: (id: string) => {
      return DocumentService.deleteDocument(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document deleted successfully');
    },
    onError: (error: any) => {
      console.error('Error deleting document:', error);
      toast.error(`Failed to delete document: ${error.message}`);
    }
  });
  
  const getDocumentsByEntity = useCallback((entityType: DocumentEntityType, entityId: string) => {
    return useQuery({
      queryKey: ['documents', entityType, entityId],
      queryFn: () => DocumentService.getDocumentsByEntity(entityType, entityId),
    });
  }, []);
  
  const downloadDocumentFile = useCallback(async (document: Document) => {
    try {
      setIsDownloading(true);
      
      const blob = await downloadDocument(document.storage_path);
      
      if (!blob) {
        throw new Error('Failed to download document');
      }
      
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = document.file_name;
      document.body.appendChild(a);
      a.click();
      
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Document downloaded successfully');
    } catch (error: any) {
      console.error('Error downloading document:', error);
      toast.error(`Failed to download document: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  }, []);
  
  const searchDocuments = useCallback((query: string) => {
    return useQuery({
      queryKey: ['documents', 'search', query],
      queryFn: () => DocumentService.searchDocuments(query),
      enabled: query.length > 2, // Only search when query is at least 3 characters
    });
  }, []);
  
  return {
    documents,
    isLoading,
    error,
    refetch,
    createDocument,
    updateDocument,
    deleteDocument,
    getDocumentsByEntity,
    downloadDocumentFile,
    isDownloading,
    searchDocuments
  };
}
