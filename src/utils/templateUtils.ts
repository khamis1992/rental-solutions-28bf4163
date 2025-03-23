
import { supabase } from "@/lib/supabase";
import { createClient } from '@supabase/supabase-js';
import { ensureStorageBuckets } from './setupBuckets';

/**
 * Uploads a new agreement template to the storage bucket
 */
export const uploadAgreementTemplate = async (
  templateFile: File
): Promise<{ success: boolean; error?: string; url?: string }> => {
  try {
    // First ensure the bucket exists
    const bucketResult = await ensureStorageBuckets();
    if (!bucketResult.success) {
      console.error("Failed to ensure bucket exists:", bucketResult.error);
      return { success: false, error: bucketResult.error || "Failed to ensure storage bucket exists" };
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseServiceKey) {
      return { success: false, error: "Service role key is missing" };
    }
    
    // Create a service client with full permissions
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    
    // Set the filename to agreement_template.docx (with underscore, not space)
    const safeFileName = 'agreement_template.docx';
    
    // Upload the template file with the safe filename using service role client
    const { error: uploadError } = await serviceClient.storage
      .from('agreements')
      .upload(safeFileName, templateFile, { 
        upsert: true,
        cacheControl: '3600'
      });
    
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
    
    console.log("Template uploaded successfully. URL:", publicUrl);
    
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
    // Check if bucket exists first via ensureStorageBuckets
    const bucketCheck = await ensureStorageBuckets();
    if (!bucketCheck.success) {
      console.error("Bucket check failed:", bucketCheck.error);
      return { success: false, error: bucketCheck.error || "Failed to ensure bucket exists" };
    }
    
    // Try different filename formats to handle potential inconsistencies
    const fileOptions = ['agreement_template.docx', 'agreement temp.docx', 'agreement_temp.docx'];
    
    // First check if any template exists
    const { data: files, error: listError } = await supabase.storage
      .from('agreements')
      .list();
    
    if (listError) {
      console.error("Error listing files:", listError);
      
      // Try with service role key as fallback
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
      
      if (supabaseServiceKey) {
        const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
        const { data: serviceFiles, error: serviceListError } = await serviceClient.storage
          .from('agreements')
          .list();
          
        if (serviceListError || !serviceFiles?.length) {
          return { success: false, error: `Failed to list files with service key: ${serviceListError?.message || "No files found"}` };
        }
        
        // Try to download file with service client
        for (const option of fileOptions) {
          if (serviceFiles.some(file => file.name === option)) {
            const { data, error: downloadError } = await serviceClient.storage
              .from('agreements')
              .download(option);
              
            if (!downloadError && data) {
              console.log(`Successfully downloaded template with service client: ${option}`);
              return { success: true, data };
            }
          }
        }
      }
      
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
      console.error("Failed to download with regular client, trying service client...");
      
      // Try with service role key as fallback
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
      
      if (supabaseServiceKey) {
        const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
        const { data: serviceData, error: serviceDownloadError } = await serviceClient.storage
          .from('agreements')
          .download(templateFile);
          
        if (serviceDownloadError || !serviceData) {
          return { success: false, error: `Failed to download with service key: ${serviceDownloadError?.message || "No data returned"}` };
        }
        
        return { success: true, data: serviceData };
      }
      
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
    // Ensure storage bucket exists first
    const bucketCheck = await ensureStorageBuckets();
    if (!bucketCheck.success) {
      console.error("Bucket check failed:", bucketCheck.error);
      return null;
    }
    
    // Check which template file exists
    const { data: files, error: listError } = await supabase.storage
      .from('agreements')
      .list();
    
    if (listError || !files) {
      console.error("Error listing template files:", listError);
      
      // Try with service role key as fallback
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
      
      if (supabaseServiceKey) {
        const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
        const { data: serviceFiles } = await serviceClient.storage
          .from('agreements')
          .list();
          
        if (serviceFiles?.length) {
          // Try to find which template exists - prioritize agreement_template.docx
          const fileOptions = ['agreement_template.docx', 'agreement temp.docx', 'agreement_temp.docx'];
          let templateFile = null;
          
          for (const option of fileOptions) {
            if (serviceFiles.some(file => file.name === option)) {
              templateFile = option;
              break;
            }
          }
          
          if (templateFile) {
            // Get the URL for the template that exists
            const { data } = serviceClient.storage
              .from('agreements')
              .getPublicUrl(templateFile);
            
            // Fix the double slash issue in the URL
            let fixedUrl = data.publicUrl;
            if (fixedUrl.includes('//agreements/')) {
              fixedUrl = fixedUrl.replace('//agreements/', '/agreements/');
            }
            
            return fixedUrl;
          }
        }
      }
      
      return null;
    }
    
    // Try to find which template exists - prioritize agreement_template.docx (with underscore)
    const fileOptions = ['agreement_template.docx', 'agreement temp.docx', 'agreement_temp.docx'];
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
    
    // First ensure the bucket exists
    const bucketCheck = await ensureStorageBuckets();
    if (!bucketCheck.success) {
      issues.push(`Storage bucket setup failed: ${bucketCheck.error}`);
      suggestions.push("Check the service role key in your .env file");
      suggestions.push("Create the 'agreements' bucket manually in the Supabase dashboard");
      
      return { 
        status: "error", 
        issues, 
        suggestions 
      };
    }
    
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
        suggestions.push("Use the service role key for storage operations");
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
      suggestions.push("Create the 'agreements' bucket in the Supabase dashboard or through the app");
      suggestions.push("Make sure to set the bucket to 'public' for file access");
      
      return { 
        status: "error", 
        issues, 
        suggestions 
      };
    }
    
    // Get list of files
    const { data: files, error: listError } = await (serviceClient || supabase).storage
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
    const templateOptions = ['agreement_template.docx', 'agreement temp.docx', 'agreement_temp.docx'];
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
    const { data } = (serviceClient || supabase).storage
      .from('agreements')
      .getPublicUrl(templateName);
    
    let url = data.publicUrl;
    
    // Check URL format for issues
    if (url.includes('//agreements/')) {
      issues.push("Double slash detected in URL path");
      suggestions.push("This is a known formatting issue that will be fixed automatically");
      
      // Provide a fixed URL
      url = url.replace('//agreements/', '/agreements/');
    }
    
    // Try to verify the URL by making a HEAD request to it
    try {
      const testResponse = await fetch(url, { method: 'HEAD' });
      if (!testResponse.ok) {
        issues.push(`Template URL returns ${testResponse.status} status`);
        suggestions.push("Check if the file is publicly accessible in Supabase storage");
      } else {
        console.log("URL validation successful!");
      }
    } catch (fetchError: any) {
      issues.push(`Unable to access template URL: ${fetchError.message}`);
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

/**
 * Attempts a direct URL fetch for the template to validate accessibility 
 */
export const validateTemplateAccess = async (): Promise<{
  accessible: boolean;
  error?: string;
  url?: string;
}> => {
  try {
    // Get the template URL
    const url = await getAgreementTemplateUrl();
    if (!url) {
      return { accessible: false, error: "Could not generate template URL" };
    }
    
    // Try to fetch the template directly
    const response = await fetch(url, {
      method: 'HEAD', // Just check headers, don't download the whole file
      cache: 'no-cache',
    });
    
    if (!response.ok) {
      return { 
        accessible: false, 
        error: `Template URL returns ${response.status} status`, 
        url 
      };
    }
    
    return { accessible: true, url };
  } catch (error: any) {
    return { 
      accessible: false, 
      error: `Error accessing template: ${error.message}`,
    };
  }
};
