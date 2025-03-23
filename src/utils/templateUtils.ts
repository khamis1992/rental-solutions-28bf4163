
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
    
    // Check if the agreements bucket exists
    const { data: buckets, error: bucketsError } = await serviceClient.storage.listBuckets();
    
    if (bucketsError) {
      console.error("Failed to list buckets:", bucketsError);
      return { success: false, error: `Failed to list buckets: ${bucketsError.message}` };
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === 'agreements');
    
    // If bucket doesn't exist, create it with the service role key
    if (!bucketExists) {
      try {
        const { error: createError } = await serviceClient.storage.createBucket('agreements', {
          public: true,
          fileSizeLimit: 10485760 // 10MB
        });
        
        if (createError) {
          console.error("Failed to create bucket with service role:", createError);
          
          // Special message for RLS errors
          if (createError.message.includes('violates row-level security')) {
            return { 
              success: false, 
              error: "RLS policy error. Please create the 'agreements' bucket manually in the Supabase dashboard." 
            };
          }
          
          return { success: false, error: `Failed to create bucket: ${createError.message}` };
        }
        
        console.log("Successfully created agreements bucket");
      } catch (createErr: any) {
        console.error("Error creating bucket:", createErr);
        return { 
          success: false, 
          error: "Please create the 'agreements' bucket manually in the Supabase dashboard." 
        };
      }
    }
    
    // Set the filename to avoid path issues (use agreement_template.docx - no spaces)
    const safeFileName = 'agreement_template.docx';
    
    // Upload the template file with the safe filename using service role client
    const { error: uploadError } = await serviceClient.storage
      .from('agreements')
      .upload(safeFileName, templateFile, { upsert: true });
    
    if (uploadError) {
      console.error("Upload error:", uploadError);
      return { success: false, error: `Failed to upload template: ${uploadError.message}` };
    }
    
    // Get the public URL using service role client
    const { data: urlData } = serviceClient.storage
      .from('agreements')
      .getPublicUrl(safeFileName);
    
    // Fix double slash issue in URL if it exists
    let publicUrl = urlData.publicUrl;
    publicUrl = publicUrl.replace(/\/\/agreements\//, '/agreements/');
    
    return { 
      success: true, 
      url: publicUrl
    };
  } catch (error: any) {
    console.error("Unexpected error in uploadAgreementTemplate:", error);
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
    const fileOptions = ['agreement_template.docx', 'agreement_temp.docx'];
    
    // First check if any template exists
    const { data: files, error: listError } = await supabase.storage
      .from('agreements')
      .list();
    
    if (listError) {
      console.error("Error listing files:", listError);
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
    console.error("Error in downloadAgreementTemplate:", error);
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
    const fileOptions = ['agreement_template.docx', 'agreement_temp.docx'];
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
    
    // Fix the double slash issue in the URL
    let fixedUrl = data.publicUrl;
    if (fixedUrl.includes('//agreements/')) {
      fixedUrl = fixedUrl.replace('//agreements/', '/agreements/');
    }
    
    return fixedUrl;
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
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    
    // Create service client for bucket operations
    const serviceClient = supabaseServiceKey 
      ? createClient(supabaseUrl, supabaseServiceKey)
      : null;
    
    // Check if bucket exists using service role if available
    const { data: buckets, error: bucketsError } = serviceClient 
      ? await serviceClient.storage.listBuckets()
      : await supabase.storage.listBuckets();
      
    if (bucketsError) {
      issues.push(`Error checking buckets: ${bucketsError.message}`);
      
      if (bucketsError.message.includes('violates row-level security')) {
        suggestions.push("You need to create the 'agreements' bucket manually in the Supabase dashboard due to RLS restrictions");
        suggestions.push("Go to Storage in the Supabase dashboard and create the 'agreements' bucket with public read access");
      }
      
      return { 
        status: "error", 
        issues, 
        suggestions 
      };
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === 'agreements');
    
    if (!bucketExists) {
      issues.push("The 'agreements' bucket does not exist");
      suggestions.push("Create the 'agreements' bucket in the Supabase dashboard");
      suggestions.push("Make sure to set the bucket to 'public' for file access");
      
      return { 
        status: "error", 
        issues, 
        suggestions 
      };
    }
    
    // Get list of files
    const { data: files, error: listError } = await supabase.storage
      .from('agreements')
      .list();
    
    if (listError) {
      issues.push(`Error listing files: ${listError.message}`);
      
      if (listError.message.includes('The resource was not found')) {
        suggestions.push("The 'agreements' bucket exists but may have access issues");
        suggestions.push("Check the bucket's RLS policies in the Supabase dashboard");
      }
      
      return { 
        status: "error", 
        issues, 
        suggestions 
      };
    }
    
    if (!files || files.length === 0) {
      issues.push("No files found in the agreements bucket");
      suggestions.push("Upload a template file named 'agreement_template.docx' to the agreements bucket");
      
      return { 
        status: "error", 
        issues, 
        suggestions 
      };
    }
    
    // Check for template files with various names
    const templateOptions = ['agreement_template.docx', 'agreement_temp.docx'];
    const foundTemplates = files.filter(file => 
      templateOptions.includes(file.name)
    );
    
    if (foundTemplates.length === 0) {
      issues.push("No template files found with expected names");
      
      const fileNames = files.map(file => file.name).join(", ");
      issues.push(`Files in bucket: ${fileNames}`);
      
      suggestions.push("Upload a file named 'agreement_template.docx' to the agreements bucket");
      suggestions.push("Or rename an existing file to 'agreement_template.docx'");
      
      return { 
        status: "error", 
        issues, 
        suggestions 
      };
    }
    
    // Get URL for the first found template
    const templateName = foundTemplates[0].name;
    const { data } = supabase.storage
      .from('agreements')
      .getPublicUrl(templateName);
    
    const url = data.publicUrl;
    
    // Check URL format for issues
    if (url.includes('//agreements/')) {
      issues.push("Double slash detected in URL path");
      suggestions.push("This is a known formatting issue that will be fixed automatically");
      
      // Provide a fixed URL
      const fixedUrl = url.replace('//agreements/', '/agreements/');
      
      return { 
        status: "warning",
        issues, 
        suggestions,
        url: fixedUrl
      };
    }
    
    return { 
      status: "success",
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
