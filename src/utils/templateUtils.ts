import { supabase } from "@/lib/supabase";
import { createClient } from '@supabase/supabase-js';
import { ensureStorageBuckets } from './setupBuckets';

/**
 * Fixes double slash issues in URLs
 */
export const fixTemplateUrl = (url: string): string => {
  // Fix the specific double slash issue in agreements path
  let fixedUrl = url.replace(/\/\/agreements\//, '/agreements/');
  
  // Also check for other potential double slashes in the path (but not in the protocol)
  const protocolSeparator = '://';
  if (fixedUrl.includes(protocolSeparator)) {
    const parts = fixedUrl.split(protocolSeparator);
    const protocol = parts[0];
    let path = parts[1];
    
    // Replace any double slashes in the path portion
    while (path.includes('//')) {
      path = path.replace('//', '/');
    }
    
    fixedUrl = `${protocol}${protocolSeparator}${path}`;
  }
  
  return fixedUrl;
};

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
    
    // Create a service client with full permissions and direct control settings
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
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
      
      // Special handling for RLS policy violations
      if (uploadError.message.includes('violates row-level security policy')) {
        return { 
          success: false, 
          error: `Row-level security policy violation. Please check the storage bucket permissions in Supabase Dashboard. 
                 You may need to add policies to allow this operation or create the bucket manually.` 
        };
      }
      
      return { success: false, error: `Failed to upload template: ${uploadError.message}` };
    }
    
    // Get the public URL using service client
    const { data: urlData } = serviceClient.storage
      .from('agreements')
      .getPublicUrl(safeFileName);
    
    // Fix double slash issue in URL if it exists
    let publicUrl = urlData.publicUrl;
    publicUrl = fixTemplateUrl(publicUrl);
    
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
    
    // Primary filename with underscore (standardized format)
    const primaryFileName = 'agreement_template.docx';
    
    // First attempt with service role client (more reliable)
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    
    if (supabaseServiceKey) {
      try {
        const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        });
        
        // Try direct download with primary filename
        const { data: fileData, error: downloadError } = await serviceClient.storage
          .from('agreements')
          .download(primaryFileName);
          
        if (!downloadError && fileData) {
          console.log(`Successfully downloaded template: ${primaryFileName} with service client`);
          return { success: true, data: fileData };
        }
        
        // If primary file not found, try secondary variations
        const alternateFiles = ['agreement temp.docx', 'agreement_temp.docx'];
        
        for (const fileName of alternateFiles) {
          const { data: altData, error: altError } = await serviceClient.storage
            .from('agreements')
            .download(fileName);
            
          if (!altError && altData) {
            console.log(`Successfully downloaded alternate template: ${fileName} with service client`);
            return { success: true, data: altData };
          }
        }
        
        // If we reach here, none of the templates were found with service client
        console.error("No template file found with service client");
      } catch (serviceErr) {
        console.error("Error with service client download:", serviceErr);
      }
    }
    
    // Fallback to regular client if service client failed
    try {
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('agreements')
        .download(primaryFileName);
        
      if (!downloadError && fileData) {
        console.log(`Successfully downloaded template: ${primaryFileName} with regular client`);
        return { success: true, data: fileData };
      }
      
      // If primary file not found, try secondary variations
      const alternateFiles = ['agreement temp.docx', 'agreement_temp.docx'];
      
      for (const fileName of alternateFiles) {
        const { data: altData, error: altError } = await supabase.storage
          .from('agreements')
          .download(fileName);
          
        if (!altError && altData) {
          console.log(`Successfully downloaded alternate template: ${fileName} with regular client`);
          return { success: true, data: altData };
        }
      }
    } catch (err) {
      console.error("Error downloading template with regular client:", err);
    }
    
    // If we reach here, all download attempts failed
    return { success: false, error: "Template file not found or cannot be accessed" };
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
    
    // Primary filename (standardized format)
    const primaryFileName = 'agreement_template.docx';
    
    // Try with service role client first (more reliable)
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    
    if (supabaseServiceKey) {
      try {
        const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        });
        
        // First check if the primary file exists
        const { data: fileList, error: listError } = await serviceClient.storage
          .from('agreements')
          .list();
          
        if (!listError && fileList) {
          let templateFileName = null;
          
          // Check for primary file first
          if (fileList.some(file => file.name === primaryFileName)) {
            templateFileName = primaryFileName;
          } else {
            // Fall back to alternate filenames
            const alternateFiles = ['agreement temp.docx', 'agreement_temp.docx'];
            for (const fileName of alternateFiles) {
              if (fileList.some(file => file.name === fileName)) {
                templateFileName = fileName;
                break;
              }
            }
          }
          
          if (templateFileName) {
            // Get the URL for the template
            const { data } = serviceClient.storage
              .from('agreements')
              .getPublicUrl(templateFileName);
            
            // Fix the double slash issue in the URL
            let fixedUrl = data.publicUrl;
            fixedUrl = fixTemplateUrl(fixedUrl);
            
            console.log(`Successfully got template URL: ${fixedUrl}`);
            return fixedUrl;
          }
        }
      } catch (serviceErr) {
        console.error("Error with service client for URL:", serviceErr);
      }
    }
    
    // Fallback to regular client
    try {
      // Check if the primary file exists
      const { data: fileList, error: listError } = await supabase.storage
        .from('agreements')
        .list();
        
      if (!listError && fileList) {
        let templateFileName = null;
        
        // Check for primary file first
        if (fileList.some(file => file.name === primaryFileName)) {
          templateFileName = primaryFileName;
        } else {
          // Fall back to alternate filenames
          const alternateFiles = ['agreement temp.docx', 'agreement_temp.docx'];
          for (const fileName of alternateFiles) {
            if (fileList.some(file => file.name === fileName)) {
              templateFileName = fileName;
              break;
            }
          }
        }
        
        if (templateFileName) {
          // Get the URL for the template
          const { data } = supabase.storage
            .from('agreements')
            .getPublicUrl(templateFileName);
          
          // Fix the double slash issue in the URL
          let fixedUrl = data.publicUrl;
          fixedUrl = fixTemplateUrl(fixedUrl);
          
          console.log(`Successfully got template URL with regular client: ${fixedUrl}`);
          return fixedUrl;
        }
      }
    } catch (err) {
      console.error("Error getting template URL with regular client:", err);
    }
    
    return null;
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
    
    // Create service client for bucket operations with proper auth options
    const serviceClient = supabaseServiceKey 
      ? createClient(supabaseUrl, supabaseServiceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        })
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
    
    // Get list of files with properly configured client
    const { data: files, error: listError } = serviceClient 
      ? await serviceClient.storage.from('agreements').list()
      : await supabase.storage.from('agreements').list();
    
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
    
    // Primary filename is agreement_template.docx (with underscore)
    const primaryFileName = 'agreement_template.docx';
    
    // Check for template files with various names, prioritizing primary filename
    const templateFiles = files.filter(file => 
      file.name === primaryFileName || 
      file.name === 'agreement temp.docx' || 
      file.name === 'agreement_temp.docx'
    );
    
    if (templateFiles.length === 0) {
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
    let templateName = templateFiles[0].name;
    
    // If primary file exists, prioritize it
    const primaryFile = templateFiles.find(file => file.name === primaryFileName);
    if (primaryFile) {
      templateName = primaryFile.name;
    }
    
    // Get the URL with properly configured client
    const { data } = (serviceClient || supabase).storage
      .from('agreements')
      .getPublicUrl(templateName);
    
    // Fix the double slash issue in the URL
    let url = fixTemplateUrl(data.publicUrl);
    
    const originalUrl = data.publicUrl;
    if (originalUrl !== url) {
      issues.push("Double slash detected in URL path and fixed");
      suggestions.push("The URL was automatically corrected from double slash to single slash");
    }
    
    // Try to verify the URL by making a HEAD request to it
    try {
      const testResponse = await fetch(url, { 
        method: 'HEAD',
        cache: 'no-store' // Avoid caching issues
      });
      
      if (!testResponse.ok) {
        issues.push(`Template URL returns ${testResponse.status} status`);
        suggestions.push("Check if the file is publicly accessible in Supabase storage");
      } else {
        console.log("URL validation successful!");
      }
    } catch (fetchError: any) {
      issues.push(`Unable to access template URL: ${fetchError.message}`);
      suggestions.push("Check network connectivity and CORS settings");
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
    
    // Fix any double slash issues
    const fixedUrl = fixTemplateUrl(url);
    
    // Try to fetch the template directly
    const response = await fetch(fixedUrl, {
      method: 'HEAD', // Just check headers, don't download the whole file
      cache: 'no-cache', // Avoid caching issues
    });
    
    if (!response.ok) {
      return { 
        accessible: false, 
        error: `Template URL returns ${response.status} status`, 
        url: fixedUrl
      };
    }
    
    return { accessible: true, url: fixedUrl };
  } catch (error: any) {
    return { 
      accessible: false, 
      error: `Error accessing template: ${error.message}`,
    };
  }
};

/**
 * Direct check for the template at the specific URL provided
 */
export const checkSpecificTemplateUrl = async (url: string): Promise<{
  accessible: boolean;
  fixedUrl: string;
  error?: string;
}> => {
  try {
    // First, fix any double slash issues
    const fixedUrl = fixTemplateUrl(url);
    
    // Check if URL was actually fixed
    const wasFixed = fixedUrl !== url;
    
    console.log(`Checking specific template URL: ${url}`);
    if (wasFixed) {
      console.log(`URL fixed to: ${fixedUrl}`);
    }
    
    // Try to fetch the template directly
    const response = await fetch(fixedUrl, {
      method: 'HEAD',
      cache: 'no-cache',
    });
    
    if (!response.ok) {
      console.log(`Template fetch failed: ${response.status}`);
      return { 
        accessible: false, 
        fixedUrl,
        error: `URL returns ${response.status} status`
      };
    }
    
    console.log("Template fetch successful!");
    return { 
      accessible: true, 
      fixedUrl 
    };
  } catch (error: any) {
    console.error("Error checking template URL:", error);
    return { 
      accessible: false, 
      fixedUrl: fixTemplateUrl(url),
      error: error.message
    };
  }
};

