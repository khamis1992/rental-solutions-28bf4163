import { Agreement } from "@/lib/validation-schemas/agreement";
import { processAgreementTemplate } from "@/lib/validation-schemas/agreement";
import { supabase } from "@/lib/supabase";
import { createClient } from '@supabase/supabase-js';

/**
 * Generate the agreement text by processing the template with agreement data
 */
export const generateAgreementText = async (agreement: Agreement): Promise<string> => {
  try {
    console.log("Generating agreement text from template for agreement:", agreement.id);
    
    // Try to get the template from storage first (prioritize storage bucket)
    const templateText = await getTemplateFromStorage();
    
    if (templateText) {
      console.log("Successfully retrieved template from storage");
      return processAgreementTemplate(templateText, agreement);
    }
    
    // Fall back to database template if storage fails
    console.log("Storage template not found, checking database");
    const dbTemplate = await getTemplateFromDatabase();
    
    if (dbTemplate) {
      console.log("Successfully retrieved template from database");
      return processAgreementTemplate(dbTemplate, agreement);
    }
    
    // If both storage and database fail, use default template
    console.log("No templates found, using default template");
    return generateDefaultAgreementText(agreement);
  } catch (error) {
    console.error("Error generating agreement text:", error);
    return generateDefaultAgreementText(agreement); // Fallback to default
  }
};

/**
 * Generate default agreement text
 */
const generateDefaultAgreementText = (agreement: Agreement): string => {
  const customerData = agreement.customers;
  const vehicleData = agreement.vehicles;
  
  // Format dates
  const startDate = new Date(agreement.start_date).toLocaleDateString();
  const endDate = new Date(agreement.end_date).toLocaleDateString();
  const currentDate = new Date().toLocaleDateString();
  
  return `
VEHICLE RENTAL AGREEMENT
=======================

Agreement Number: ${agreement.agreement_number}
Date: ${currentDate}

PARTIES
-------
LESSOR: [Your Company Name]
LESSEE: ${customerData?.full_name || "Customer"}
        ${customerData?.email || ""}
        ${customerData?.phone || ""}
        Driver License: ${customerData?.driver_license || ""}
        Nationality: ${customerData?.nationality || ""}

VEHICLE DETAILS
--------------
Make: ${vehicleData?.make || ""}
Model: ${vehicleData?.model || ""}
Year: ${vehicleData?.year || ""}
Color: ${vehicleData?.color || ""}
License Plate: ${vehicleData?.license_plate || ""}
VIN: ${vehicleData?.vin || ""}

AGREEMENT TERMS
--------------
Start Date: ${startDate}
End Date: ${endDate}
Rent Amount: ${agreement.total_amount / 12} QAR per month
Security Deposit: ${agreement.deposit_amount || 0} QAR
Total Contract Value: ${agreement.total_amount} QAR

TERMS AND CONDITIONS
-------------------
1. The Lessee agrees to pay the monthly rent on time.
2. The Lessee will maintain the vehicle in good condition.
3. The Lessee will not use the vehicle for illegal purposes.
4. The Lessee will be responsible for any traffic violations.
5. The Lessee will return the vehicle on the end date in good condition.

SIGNATURES
---------
Lessor: ______________________     Date: _____________

Lessee: ______________________     Date: _____________
  `;
};

/**
 * Helper function to download agreement as PDF
 */
export const downloadAgreementAsPdf = async (agreement: Agreement): Promise<void> => {
  // This is a placeholder - in a real implementation, you would use
  // a library like jsPDF to convert the agreement text to PDF
  alert("PDF generation would happen here. This requires additional libraries.");
  
  // Example implementation with jsPDF would look like:
  /*
  import { jsPDF } from "jspdf";
  
  const agreementText = await generateAgreementText(agreement);
  const doc = new jsPDF();
  
  doc.setFontSize(12);
  doc.text(agreementText, 10, 10);
  doc.save(`agreement_${agreement.agreement_number}.pdf`);
  */
};

/**
 * Register an external template URL for an agreement
 */
export const registerExternalTemplateUrl = async (
  agreementId: string, 
  templateUrl: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!agreementId || !templateUrl) {
      return { success: false, error: "Missing agreement ID or template URL" };
    }
    
    // Validate the URL
    try {
      new URL(templateUrl);
    } catch (e) {
      return { success: false, error: "Invalid URL format" };
    }
    
    // Update the agreement with the template URL
    const { error } = await supabase
      .from("leases")
      .update({ template_url: templateUrl })
      .eq("id", agreementId);
    
    if (error) {
      throw error;
    }
    
    return { success: true };
  } catch (error: any) {
    console.error("Error registering external template URL:", error);
    return { success: false, error: error.message || "Failed to register template URL" };
  }
};

/**
 * Check if storage is configured and working correctly
 */
export const isStorageConfigured = async (): Promise<boolean> => {
  try {
    // Check if the agreements bucket exists
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error("Error checking storage configuration:", error);
      return false;
    }
    
    return buckets?.some(bucket => bucket.name === 'agreements') || false;
  } catch (error) {
    console.error("Exception checking storage configuration:", error);
    return false;
  }
};

/**
 * Check if the standard agreement template exists in the database or storage
 */
export const checkStandardTemplateExists = async (): Promise<boolean> => {
  try {
    console.log("Checking for template files");
    
    // First check if template exists in storage (prioritize storage)
    console.log("Checking if template exists in storage...");
    const storageTemplateExists = await checkTemplateInStorage();
    if (storageTemplateExists) {
      console.log("Template found in storage");
      return true;
    }
    
    // If storage check fails, try database
    console.log("Template not found in storage, checking database...");
    const dbTemplateExists = await checkTemplateInDatabase();
    if (dbTemplateExists) {
      console.log("Template found in database");
      return true;
    }
    
    // If template doesn't exist in either location, create it
    console.log("Template not found in database or storage, attempting to create default template");
    const created = await createAgreementsBucketAndTemplate();
    return created;
  } catch (error) {
    console.error("Exception checking templates:", error);
    return false;
  }
};

/**
 * Check if the template exists in the database
 */
async function checkTemplateInDatabase(): Promise<boolean> {
  try {
    // Get the table structure first to understand what columns exist
    const { data: tableInfo, error: tableError } = await supabase
      .from("agreement_templates")
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error("Error fetching template table structure:", tableError);
      return false;
    }
    
    // Log the table structure to understand available columns
    console.log("Template table structure:", tableInfo);
    
    // Determine which column contains the template name
    const nameColumn = tableInfo && tableInfo[0] && 
      ('template_name' in tableInfo[0] ? 'template_name' : 
        ('name' in tableInfo[0] ? 'name' : null));
    
    if (!nameColumn) {
      console.error("Could not determine template name column in the database");
      return false;
    }
    
    console.log(`Using column "${nameColumn}" for template name lookup`);
    
    // First try with the .docx extension using the determined name column
    const { data, error } = await supabase
      .from("agreement_templates")
      .select("id")
      .eq(nameColumn, "agreement temp.docx")
      .maybeSingle();
    
    if (error) {
      console.error("Error checking template with .docx extension:", error);
      
      // Try fallback to the regular template name
      console.log("Checking fallback template 'agreement temp'");
      const fallbackResult = await supabase
        .from("agreement_templates")
        .select("id")
        .eq(nameColumn, "agreement temp")
        .maybeSingle();
        
      if (fallbackResult.error) {
        console.error("Error checking fallback template:", fallbackResult.error);
        return false;
      }
      
      const fallbackExists = !!fallbackResult.data;
      console.log("Fallback template exists:", fallbackExists, fallbackResult.data);
      return fallbackExists;
    }
    
    const exists = !!data;
    console.log("Template with .docx exists:", exists, data);
    return exists;
  } catch (error) {
    console.error("Error checking database for template:", error);
    return false;
  }
}

/**
 * Check if the template exists in the storage bucket
 */
async function checkTemplateInStorage(): Promise<boolean> {
  try {
    console.log("Checking for template in storage bucket 'agreements'");
    
    // First check if the bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error("Error listing storage buckets:", bucketsError);
      return false;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === 'agreements');
    if (!bucketExists) {
      console.log("The 'agreements' bucket does not exist");
      return false;
    }
    
    // List all files in the bucket to check for template
    console.log("Listing files in agreements bucket");
    const { data: files, error: listError } = await supabase.storage
      .from('agreements')
      .list();
      
    if (listError) {
      console.error("Error listing files in agreements bucket:", listError);
      return false;
    }
    
    console.log("Files in agreements bucket:", files);
    
    // Check if any template name exists (using both space and underscore variants)
    const templateExists = files?.some(file => 
      file.name === 'agreement_template.docx' || 
      file.name === 'agreement temp.docx' ||
      file.name === 'agreement_temp.docx'
    );
    
    console.log("Template exists in storage:", templateExists);
    return templateExists;
  } catch (error) {
    console.error("Error checking template in storage:", error);
    return false;
  }
}

/**
 * Create the agreements bucket and upload a default template if it doesn't exist
 */
async function createAgreementsBucketAndTemplate(): Promise<boolean> {
  try {
    console.log("Creating agreements bucket and default template");
    
    // Check if bucket exists first
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return false;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === 'agreements');
    let bucketCreated = bucketExists;
    
    // Create the bucket if it doesn't exist
    if (!bucketExists) {
      console.log("Creating 'agreements' bucket");
      
      // Use service role key to create bucket (prioritize this method)
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
      
      if (supabaseServiceKey) {
        try {
          console.log("Using service role key to create bucket");
          const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
          
          const { error: createError } = await serviceClient.storage.createBucket('agreements', {
            public: true,
            fileSizeLimit: 10485760, // 10MB
          });
          
          if (createError) {
            console.error("Error creating bucket with service role key:", createError);
          } else {
            console.log("Agreements bucket created successfully with service role key");
            bucketCreated = true;
          }
        } catch (e) {
          console.error('Error creating bucket with service role key:', e);
        }
      }
      
      // Only try anon key as fallback if service key fails
      if (!bucketCreated) {
        try {
          console.log("Falling back to anon key to create bucket");
          const { error: anonError } = await supabase.storage.createBucket('agreements', {
            public: true,
            fileSizeLimit: 10485760, // 10MB
          });
          
          if (anonError) {
            console.error("Error creating bucket with anon key:", anonError);
            return false;
          } else {
            console.log("Agreements bucket created successfully with anon key");
            bucketCreated = true;
          }
        } catch (e) {
          console.error('Error creating bucket with anon key:', e);
          return false;
        }
      }
      
      if (!bucketCreated) {
        console.error("Failed to create agreements bucket with both service and anon key");
        return false;
      }
    }
    
    // Check if the template already exists before uploading
    if (bucketCreated || bucketExists) {
      const { data: files, error: listFilesError } = await supabase.storage
        .from('agreements')
        .list();
        
      if (listFilesError) {
        console.error("Error listing files to check for template:", listFilesError);
      } else {
        const templateExists = files?.some(file => 
          file.name === 'agreement_template.docx' || 
          file.name === 'agreement temp.docx' ||
          file.name === 'agreement_temp.docx'
        );
        
        if (templateExists) {
          console.log("Template already exists in bucket, skipping upload");
          return true;
        }
      }
    }
    
    // Now upload the default template
    console.log("Uploading default agreement template");
    
    // Create a default template content
    const defaultTemplate = generateDefaultTemplateContent();
    
    // Convert to Blob
    const blob = new Blob([defaultTemplate], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    
    // Always use agreement_template.docx (with underscore) as the filename
    const safeFileName = 'agreement_template.docx';
    
    // Try to upload with service role client first
    let uploadSuccess = false;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    
    if (supabaseServiceKey) {
      try {
        const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
        const { error: uploadError } = await serviceClient.storage
          .from('agreements')
          .upload(safeFileName, blob, { 
            upsert: true,
            cacheControl: '3600'
          });
          
        if (uploadError) {
          console.error("Error uploading template with service role key:", uploadError);
        } else {
          console.log("Default template uploaded successfully with service role key");
          uploadSuccess = true;
          
          // Make the template publicly accessible
          const { data: publicUrlData } = serviceClient.storage
            .from('agreements')
            .getPublicUrl(safeFileName);
            
          console.log("Template public URL:", publicUrlData.publicUrl);
        }
      } catch (e) {
        console.error("Exception uploading template with service role key:", e);
      }
    }
    
    // Fall back to anon key if service key upload fails
    if (!uploadSuccess) {
      try {
        const { error: uploadError } = await supabase.storage
          .from('agreements')
          .upload(safeFileName, blob, { 
            upsert: true,
            cacheControl: '3600'
          });
          
        if (uploadError) {
          console.error("Error uploading default template with anon key:", uploadError);
          return false;
        }
        
        console.log("Default template uploaded successfully with anon key");
        uploadSuccess = true;
      } catch (e) {
        console.error("Exception uploading template with anon key:", e);
        return false;
      }
    }
    
    return uploadSuccess;
  } catch (error) {
    console.error("Error creating agreements bucket and template:", error);
    return false;
  }
}

/**
 * Generate default template content
 */
function generateDefaultTemplateContent(): string {
  return `
VEHICLE RENTAL AGREEMENT
=======================

Agreement Number: {{agreement.agreement_number}}
Date: {{current_date}}

PARTIES
-------
LESSOR: [Your Company Name]
LESSEE: {{customer.full_name}}
        {{customer.email}}
        {{customer.phone_number}}
        Driver License: {{customer.driver_license}}
        Nationality: {{customer.nationality}}

VEHICLE DETAILS
--------------
Make: {{vehicle.make}}
Model: {{vehicle.model}}
Year: {{vehicle.year}}
Color: {{vehicle.color}}
License Plate: {{vehicle.license_plate}}
VIN: {{vehicle.vin}}

AGREEMENT TERMS
--------------
Start Date: {{agreement.start_date}}
End Date: {{agreement.end_date}}
Rent Amount: {{agreement.rent_amount}} QAR per month
Security Deposit: {{agreement.deposit_amount}} QAR
Total Contract Value: {{agreement.total_amount}} QAR

TERMS AND CONDITIONS
-------------------
1. The Lessee agrees to pay the monthly rent on time.
2. The Lessee will maintain the vehicle in good condition.
3. The Lessee will not use the vehicle for illegal purposes.
4. The Lessee will be responsible for any traffic violations.
5. The Lessee will return the vehicle on the end date in good condition.

SIGNATURES
---------
Lessor: ______________________     Date: _____________

Lessee: ______________________     Date: _____________
`;
}

/**
 * Diagnostic function to check all template access points
 * and verify which ones are working
 */
export const diagnosisTemplateAccess = async (): Promise<{
  storageAccess: boolean;
  databaseAccess: boolean;
  bucketExists: boolean;
  templateExists: boolean;
  templateContent: string | null;
  errors: any[];
}> => {
  const errors: any[] = [];
  let storageAccess = false;
  let databaseAccess = false;
  let bucketExists = false;
  let templateExists = false;
  let templateContent: string | null = null;
  
  try {
    // 1. Check if bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      errors.push({ location: "list_buckets", error: bucketsError });
    } else {
      bucketExists = buckets?.some(bucket => bucket.name === 'agreements') || false;
      
      // 2. Check if we can list files in the bucket
      if (bucketExists) {
        const { data: files, error: listError } = await supabase.storage
          .from('agreements')
          .list();
          
        if (listError) {
          errors.push({ location: "list_files", error: listError });
        } else {
          storageAccess = true;
          templateExists = files?.some(file => 
            file.name === 'agreement_template.docx' || file.name === 'agreement temp.docx' || file.name === 'agreement_temp.docx'
          ) || false;
          
          // 3. Try to download template content
          if (templateExists) {
            const { data: fileData, error: downloadError } = await supabase.storage
              .from('agreements')
              .download('agreement temp.docx');
              
            if (downloadError || !fileData) {
              errors.push({ location: "download_template", error: downloadError });
              
              // Try fallback without extension
              const { data: fallbackData, error: fallbackError } = await supabase.storage
                .from('agreements')
                .download('agreement temp');
                
              if (fallbackError || !fallbackData) {
                errors.push({ location: "download_fallback", error: fallbackError });
              } else {
                templateContent = await fallbackData.text();
              }
            } else {
              templateContent = await fileData.text();
            }
          }
        }
      }
    }
    
    // 4. Try to access template from database
    const { data: tableInfo, error: tableError } = await supabase
      .from("agreement_templates")
      .select('*')
      .limit(1);
    
    if (tableError) {
      errors.push({ location: "database_table_info", error: tableError });
    } else {
      databaseAccess = true;
    }
    
    return {
      storageAccess,
      databaseAccess,
      bucketExists,
      templateExists,
      templateContent,
      errors
    };
  } catch (error) {
    errors.push({ location: "diagnosis", error });
    return {
      storageAccess: false,
      databaseAccess: false,
      bucketExists: false,
      templateExists: false,
      templateContent: null,
      errors
    };
  }
};

/**
 * Try to get template from storage bucket
 */
async function getTemplateFromStorage(): Promise<string | null> {
  try {
    console.log("Attempting to get template from storage bucket");
    
    // First check if the bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error("Error listing storage buckets:", bucketsError);
      return null;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === 'agreements');
    if (!bucketExists) {
      console.log("The 'agreements' bucket does not exist");
      
      // Try to create the bucket using service role
      const created = await createAgreementsBucketAndTemplate();
      if (!created) {
        return null;
      }
    }
    
    // Try to download the template file - check multiple filename formats
    console.log("Attempting to download template from storage");
    
    // Try with various possible filenames, prioritizing the underscore version
    const fileOptions = ['agreement_template.docx', 'agreement temp.docx', 'agreement_temp.docx'];
    
    for (const filename of fileOptions) {
      console.log(`Trying to download template: ${filename}`);
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('agreements')
        .download(filename);
        
      if (!downloadError && fileData) {
        console.log(`Successfully downloaded template: ${filename}`);
        return await fileData.text();
      }
      
      console.log(`Error or no data for ${filename}:`, downloadError);
    }
    
    console.log("Could not find any template file");
    return null;
  } catch (error) {
    console.error("Error getting template from storage:", error);
    return null;
  }
}

/**
 * Try to get template from database
 */
async function getTemplateFromDatabase(): Promise<string | null> {
  try {
    console.log("Attempting to get template from database");
    
    // First check if the template table exists
    const { data: tableExists, error: tableError } = await supabase
      .from("agreement_templates")
      .select('id')
      .limit(1);
      
    if (tableError || !tableExists || tableExists.length === 0) {
      console.log("Agreement templates table may not exist or is empty:", tableError);
      return null;
    }
    
    // Try to get the active template
    const { data: template, error: templateError } = await supabase
      .from("agreement_templates")
      .select('content')
      .eq('is_active', true)
      .maybeSingle();
      
    if (templateError) {
      console.error("Error fetching template from database:", templateError);
      return null;
    }
    
    if (!template || !template.content) {
      console.log("No active template found in database");
      
      // Try any template as fallback
      const { data: anyTemplate, error: anyError } = await supabase
        .from("agreement_templates")
        .select('content')
        .limit(1)
        .maybeSingle();
        
      if (anyError || !anyTemplate || !anyTemplate.content) {
        console.log("No templates found in database at all");
        return null;
      }
      
      console.log("Found non-active template in database");
      return anyTemplate.content;
    }
    
    console.log("Successfully retrieved active template from database");
    return template.content;
  } catch (error) {
    console.error("Error getting template from database:", error);
    return null;
  }
}
