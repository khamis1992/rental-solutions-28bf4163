import { supabase } from '@/lib/supabase';
import { Document, CreateDocumentRequest, UpdateDocumentRequest } from '@/types/document.types';

const DOCUMENTS_BUCKET = 'documents';

export async function ensureDocumentsBucket(): Promise<boolean> {
  try {
    console.log('Checking if documents bucket exists');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return false;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === DOCUMENTS_BUCKET);
    
    if (!bucketExists) {
      console.log('Creating documents bucket');
      const { error: createError } = await supabase.storage
        .createBucket(DOCUMENTS_BUCKET, {
          public: false, // Private by default for security
          fileSizeLimit: 20971520, // 20MB
        });
      
      if (createError) {
        console.error('Error creating bucket:', createError);
        return false;
      }
      console.log('documents bucket created successfully');
    } else {
      console.log('documents bucket already exists');
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring documents bucket exists:', error);
    return false;
  }
}

export function getDocumentPublicUrl(path: string): string {
  try {
    const { data } = supabase.storage.from(DOCUMENTS_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  } catch (error) {
    console.error('Error getting public URL:', error);
    return '';
  }
}

export async function uploadDocument(file: File, path: string): Promise<string | null> {
  console.log(`Uploading document to ${path}`, file);
  
  try {
    const bucketReady = await ensureDocumentsBucket();
    
    if (!bucketReady) {
      throw new Error('Failed to ensure documents bucket exists. Please contact an administrator.');
    }
    
    if (!file || !file.name) {
      throw new Error('Invalid file provided');
    }
    
    console.log(`Uploading to path: ${path}`);
    
    const { error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });
    
    if (error) {
      console.error('Upload error details:', error);
      throw new Error(`Error uploading document: ${error.message}`);
    }
    
    const publicUrl = getDocumentPublicUrl(path);
    console.log('Document uploaded successfully, public URL:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Error in uploadDocument:', error);
    throw error;
  }
}

export async function downloadDocument(path: string): Promise<Blob | null> {
  try {
    const { data, error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .download(path);
    
    if (error) {
      console.error('Error downloading document:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error downloading document:', error);
    return null;
  }
}

export async function deleteDocumentFromStorage(path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .remove([path]);
    
    if (error) {
      console.error('Error deleting document from storage:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting document from storage:', error);
    return false;
  }
}

export function generateDocumentPath(entityType: string | null, entityId: string | null, fileName: string): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 10);
  
  if (entityType && entityId) {
    return `${entityType}/${entityId}/${timestamp}_${randomId}_${fileName}`;
  }
  
  return `general/${timestamp}_${randomId}_${fileName}`;
}
