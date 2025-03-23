
import { supabase } from "@/lib/supabase";
import { createClient } from '@supabase/supabase-js';

/**
 * Uploads a new agreement template to the storage bucket
 */
export const uploadAgreementTemplate = async (
  templateFile: File
): Promise<{ success: boolean; error?: string; url?: string }> => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseServiceKey) {
      return { success: false, error: "Service role key is missing" };
    }
    
    // Create a service client with full permissions
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    
    // Ensure the agreements bucket exists
    const { data: buckets, error: bucketsError } = await serviceClient.storage.listBuckets();
    
    if (bucketsError) {
      return { success: false, error: `Failed to list buckets: ${bucketsError.message}` };
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === 'agreements');
    
    if (!bucketExists) {
      // Create the bucket if it doesn't exist
      const { error: createError } = await serviceClient.storage.createBucket('agreements', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });
      
      if (createError) {
        return { success: false, error: `Failed to create bucket: ${createError.message}` };
      }
    }
    
    // Upload the template file (always use agreement temp.docx as the filename)
    const { error: uploadError } = await serviceClient.storage
      .from('agreements')
      .upload('agreement temp.docx', templateFile, { upsert: true });
    
    if (uploadError) {
      return { success: false, error: `Failed to upload template: ${uploadError.message}` };
    }
    
    // Get the public URL
    const { data: urlData } = serviceClient.storage
      .from('agreements')
      .getPublicUrl('agreement temp.docx');
    
    return { 
      success: true, 
      url: urlData.publicUrl 
    };
  } catch (error: any) {
    return { 
      success: false, 
      error: `Unexpected error: ${error.message}` 
    };
  }
};

/**
 * Downloads the current agreement template from storage
 */
export const downloadAgreementTemplate = async (): Promise<{
  success: boolean;
  data?: Blob;
  error?: string;
}> => {
  try {
    // First check if the template exists
    const { data: files, error: listError } = await supabase.storage
      .from('agreements')
      .list();
    
    if (listError) {
      return { success: false, error: `Failed to list files: ${listError.message}` };
    }
    
    const templateExists = files?.some(file => 
      file.name === 'agreement temp.docx' || file.name === 'agreement temp'
    );
    
    if (!templateExists) {
      return { success: false, error: "Template does not exist" };
    }
    
    // Try to download the template
    const { data, error: downloadError } = await supabase.storage
      .from('agreements')
      .download('agreement temp.docx');
    
    if (downloadError || !data) {
      // Try fallback name if primary fails
      const { data: fallbackData, error: fallbackError } = await supabase.storage
        .from('agreements')
        .download('agreement temp');
      
      if (fallbackError || !fallbackData) {
        return { success: false, error: "Failed to download template" };
      }
      
      return { success: true, data: fallbackData };
    }
    
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: `Unexpected error: ${error.message}` };
  }
};

/**
 * Gets the public URL for the agreement template
 */
export const getAgreementTemplateUrl = (): string => {
  const { data } = supabase.storage
    .from('agreements')
    .getPublicUrl('agreement temp.docx');
  
  return data.publicUrl;
};
