import { supabase } from '@/lib/supabase';
import { 
  Document, 
  CreateDocumentRequest, 
  UpdateDocumentRequest,
  DocumentStatus
} from '@/types/document.types';
import { 
  uploadDocument,
  generateDocumentPath,
  deleteDocumentFromStorage
} from '@/lib/documents/document-storage';

export class DocumentService {
  private static instance: DocumentService;
  
  private constructor() {}
  
  public static getInstance(): DocumentService {
    if (!DocumentService.instance) {
      DocumentService.instance = new DocumentService();
    }
    return DocumentService.instance;
  }
  
  /**
   * Create a new document
   */
  async createDocument(request: CreateDocumentRequest, userId: string): Promise<Document> {
    try {
      const { file, ...metadata } = request;
      
      const storagePath = generateDocumentPath(
        request.entity_type || null,
        request.entity_id || null,
        file.name
      );
      
      const publicUrl = await uploadDocument(file, storagePath);
      
      const { data, error } = await supabase
        .from('documents')
        .insert({
          title: metadata.title,
          description: metadata.description || null,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          storage_path: storagePath,
          public_url: publicUrl,
          category: metadata.category,
          type: metadata.type,
          status: metadata.status || DocumentStatus.ACTIVE,
          entity_type: metadata.entity_type || null,
          entity_id: metadata.entity_id || null,
          created_by: userId
        })
        .select('*')
        .single();
      
      if (error) {
        await deleteDocumentFromStorage(storagePath);
        throw error;
      }
      
      return data as Document;
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }
  
  /**
   * Get a document by ID
   */
  async getDocument(id: string): Promise<Document | null> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        throw error;
      }
      
      return data as Document;
    } catch (error) {
      console.error('Error getting document:', error);
      return null;
    }
  }
  
  /**
   * Update a document
   */
  async updateDocument(request: UpdateDocumentRequest): Promise<Document | null> {
    try {
      const { id, ...updates } = request;
      
      const { data, error } = await supabase
        .from('documents')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('*')
        .single();
      
      if (error) {
        throw error;
      }
      
      return data as Document;
    } catch (error) {
      console.error('Error updating document:', error);
      return null;
    }
  }
  
  /**
   * Delete a document
   */
  async deleteDocument(id: string): Promise<boolean> {
    try {
      const document = await this.getDocument(id);
      
      if (!document) {
        throw new Error('Document not found');
      }
      
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      await deleteDocumentFromStorage(document.storage_path);
      
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      return false;
    }
  }
  
  /**
   * Get documents by entity
   */
  async getDocumentsByEntity(entityType: string, entityId: string): Promise<Document[]> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      return data as Document[];
    } catch (error) {
      console.error('Error getting documents by entity:', error);
      return [];
    }
  }
  
  /**
   * Get documents by category
   */
  async getDocumentsByCategory(category: string): Promise<Document[]> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('category', category)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      return data as Document[];
    } catch (error) {
      console.error('Error getting documents by category:', error);
      return [];
    }
  }
  
  /**
   * Get documents by type
   */
  async getDocumentsByType(type: string): Promise<Document[]> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('type', type)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      return data as Document[];
    } catch (error) {
      console.error('Error getting documents by type:', error);
      return [];
    }
  }
  
  /**
   * Search documents
   */
  async searchDocuments(query: string): Promise<Document[]> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,file_name.ilike.%${query}%`)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      return data as Document[];
    } catch (error) {
      console.error('Error searching documents:', error);
      return [];
    }
  }
}

export default DocumentService.getInstance();
