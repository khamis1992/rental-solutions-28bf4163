
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
    
    // Set the filename to avoid path issues (use agreement_template.docx - no spaces)
    const safeFileName = 'agreement_template.docx';
    
    // Upload the template file with the safe filename
    const { error: uploadError } = await serviceClient.storage
      .from('agreements')
      .upload(safeFileName, templateFile, { upsert: true });
    
    if (uploadError) {
      return { success: false, error: `Failed to upload template: ${uploadError.message}` };
    }
    
    // Get the public URL
    const { data: urlData } = serviceClient.storage
      .from('agreements')
      .getPublicUrl(safeFileName);
    
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
    // Try both filename formats
    const fileOptions = ['agreement_template.docx', 'agreement temp.docx', 'agreement temp'];
    
    // First check if any template exists
    const { data: files, error: listError } = await supabase.storage
      .from('agreements')
      .list();
    
    if (listError) {
      return { success: false, error: `Failed to list files: ${listError.message}` };
    }
    
    // Find which template file exists in storage
    let templateFile = null;
    for (const option of fileOptions) {
      if (files?.some(file => file.name === option)) {
        templateFile = option;
        break;
      }
    }
    
    if (!templateFile) {
      return { success: false, error: "Template does not exist in any known format" };
    }
    
    console.log(`Found template file: ${templateFile}`);
    
    // Download the template that was found
    const { data, error: downloadError } = await supabase.storage
      .from('agreements')
      .download(templateFile);
    
    if (downloadError || !data) {
      return { success: false, error: `Failed to download template: ${downloadError?.message || "No data returned"}` };
    }
    
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: `Unexpected error: ${error.message}` };
  }
};

/**
 * Gets the public URL for the agreement template
 */
export const getAgreementTemplateUrl = async (): Promise<string | null> => {
  try {
    // Check which template file exists
    const { data: files, error: listError } = await supabase.storage
      .from('agreements')
      .list();
    
    if (listError || !files) {
      console.error("Error listing template files:", listError);
      return null;
    }
    
    // Try to find which template exists
    const fileOptions = ['agreement_template.docx', 'agreement temp.docx', 'agreement temp'];
    let templateFile = null;
    
    for (const option of fileOptions) {
      if (files.some(file => file.name === option)) {
        templateFile = option;
        break;
      }
    }
    
    if (!templateFile) {
      console.error("No template file found in agreements bucket");
      return null;
    }
    
    // Get the URL for the template that exists
    const { data } = supabase.storage
      .from('agreements')
      .getPublicUrl(templateFile);
    
    return data.publicUrl;
  } catch (error) {
    console.error("Error getting template URL:", error);
    return null;
  }
};

/**
 * Diagnose template issues by checking URL construction
 */
export const diagnoseTemplateUrl = async (): Promise<{
  status: string;
  issues: string[];
  suggestions: string[];
  url?: string;
}> => {
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  try {
    // Get list of files
    const { data: files, error: listError } = await supabase.storage
      .from('agreements')
      .list();
    
    if (listError) {
      issues.push(`Error listing files: ${listError.message}`);
      suggestions.push("Check if the agreements bucket exists in Supabase storage");
      return { status: "error", issues, suggestions };
    }
    
    if (!files || files.length === 0) {
      issues.push("No files found in the agreements bucket");
      suggestions.push("Upload a template file to the agreements bucket");
      return { status: "error", issues, suggestions };
    }
    
    // Check for template files with various names
    const templateOptions = ['agreement_template.docx', 'agreement temp.docx', 'agreement temp'];
    const foundTemplates = files.filter(file => 
      templateOptions.includes(file.name)
    );
    
    if (foundTemplates.length === 0) {
      issues.push("No template files found with expected names");
      suggestions.push("Upload a file named 'agreement_template.docx' to the agreements bucket");
      return { status: "error", issues, suggestions };
    }
    
    // Get URL for the first found template
    const templateName = foundTemplates[0].name;
    const { data } = supabase.storage
      .from('agreements')
      .getPublicUrl(templateName);
    
    const url = data.publicUrl;
    
    // Check URL format
    if (url.includes('//agreements//')) {
      issues.push("Double slash detected in URL path");
      suggestions.push("The URL contains a double slash that may cause issues with loading the template");
    }
    
    return { 
      status: issues.length > 0 ? "warning" : "success",
      issues, 
      suggestions,
      url
    };
  } catch (error: any) {
    issues.push(`Unexpected error: ${error.message}`);
    suggestions.push("Check the browser console for more detailed error information");
    return { status: "error", issues, suggestions };
  }
};
