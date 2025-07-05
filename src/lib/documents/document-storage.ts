import { supabase } from '@/lib/supabase';
import { Document, CreateDocumentRequest, UpdateDocumentRequest } from '@/types/document.types';

const DOCUMENTS_BUCKET = 'documents';

/**
 * Test Supabase Storage connection
 */
export async function testStorageConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔗 Testing Supabase Storage connection...');
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    console.log('✅ Storage connection successful');
    return { success: true };
  } catch (error: any) {
    console.error('❌ Storage connection failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Manually create documents bucket with basic settings
 */
export async function createDocumentsBucketManually(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🛠️ Manually creating documents bucket...');
    
    // First test if we can access storage
    const connectionTest = await testStorageConnection();
    if (!connectionTest.success) {
      return { success: false, error: `Storage connection failed: ${connectionTest.error}` };
    }
    
    const { error } = await supabase.storage.createBucket(DOCUMENTS_BUCKET, {
      public: true,
      fileSizeLimit: 52428800, // 50MB
    });
    
    if (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Bucket already exists');
        return { success: true };
      }
      return { success: false, error: error.message };
    }
    
    console.log('✅ Documents bucket created manually');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function ensureDocumentsBucket(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔍 Checking if documents bucket exists');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      // Try to continue anyway - bucket might exist but we can't list it
      return { success: false, error: `Cannot list buckets: ${listError.message}` };
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === DOCUMENTS_BUCKET);
    
    if (!bucketExists) {
      console.log('📁 Documents bucket not found, attempting to create...');
      const { error: createError } = await supabase.storage
        .createBucket(DOCUMENTS_BUCKET, {
          public: true, // Make public for easier access - can be changed later
          fileSizeLimit: 52428800, // 50MB - increased limit
          allowedMimeTypes: [
            'image/*',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/*'
          ]
        });
      
      if (createError) {
        console.error('❌ Error creating bucket:', createError);
        return { success: false, error: `Cannot create bucket: ${createError.message}` };
      }
      console.log('✅ Documents bucket created successfully');
    } else {
      console.log('✅ Documents bucket already exists');
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('❌ Unexpected error ensuring documents bucket exists:', error);
    return { success: false, error: error.message || 'Unknown error' };
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
  console.log(`📤 Uploading document to ${path}`, { 
    fileName: file.name, 
    fileSize: file.size, 
    fileType: file.type 
  });
  
  try {
    // Validate file first
    if (!file || !file.name) {
      throw new Error('ملف غير صالح. يرجى اختيار ملف صحيح.');
    }

    if (file.size > 52428800) { // 50MB
      throw new Error('حجم الملف كبير جداً. الحد الأقصى 50 ميجابايت.');
    }
    
    // Try to ensure bucket exists
    const bucketResult = await ensureDocumentsBucket();
    
    if (!bucketResult.success) {
      console.warn('⚠️ Could not ensure bucket exists:', bucketResult.error);
      console.log('🔄 Attempting upload anyway - bucket might exist...');
    }
    
    console.log(`📁 Uploading to path: ${path}`);
    
    const { data, error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type,
      });
    
    if (error) {
      console.error('❌ Upload error details:', error);
      
      // More specific error messages
      if (error.message.includes('Bucket not found')) {
        throw new Error('مساحة التخزين غير موجودة. يرجى التواصل مع المسؤول.');
      }
      if (error.message.includes('File size')) {
        throw new Error('حجم الملف كبير جداً.');
      }
      if (error.message.includes('Invalid file type')) {
        throw new Error('نوع الملف غير مدعوم.');
      }
      
      throw new Error(`فشل في رفع الملف: ${error.message}`);
    }
    
    const publicUrl = getDocumentPublicUrl(path);
    console.log('✅ Document uploaded successfully, public URL:', publicUrl);
    return publicUrl;
  } catch (error: any) {
    console.error('❌ Error in uploadDocument:', error);
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
