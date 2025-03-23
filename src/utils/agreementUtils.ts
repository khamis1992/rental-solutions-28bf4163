import { Agreement } from "@/lib/validation-schemas/agreement";
import { processAgreementTemplate } from "@/lib/validation-schemas/agreement";
import { supabase } from "@/lib/supabase";
import { createClient } from '@supabase/supabase-js';
import { getAgreementTemplateUrl } from './templateUtils';
import { jsPDF } from "jspdf";

/**
 * Generate PDF document from agreement data
 */
export const generatePdfDocument = async (agreement: Agreement): Promise<boolean> => {
  try {
    console.log("Starting PDF generation for agreement:", agreement.id);
    
    // Get the template text
    const agreementText = await generateAgreementText(agreement);
    console.log("Generated agreement text length:", agreementText.length);
    
    // Debug: Show first 100 chars to check if variables were replaced
    console.log("First 100 chars of agreement text:", agreementText.substring(0, 100));
    
    // Create PDF document
    const doc = new jsPDF();
    
    // Set font and size
    doc.setFont("helvetica");
    doc.setFontSize(10);
    
    // Split text into lines that fit the PDF page width
    const textLines = doc.splitTextToSize(agreementText, 180);
    
    // Add text to the PDF
    doc.text(textLines, 15, 15);
    
    // Save the PDF with a descriptive filename
    const filename = `Agreement_${agreement.agreement_number || agreement.id}.pdf`;
    doc.save(filename);
    
    console.log("PDF generation completed successfully");
    return true;
  } catch (error) {
    console.error("Error in generatePdfDocument:", error);
    return false;
  }
};

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
      return processAgreementText(templateText, agreement);
    }
    
    // Fall back to database template if storage fails
    console.log("Storage template not found, checking database");
    const dbTemplate = await getTemplateFromDatabase();
    
    if (dbTemplate) {
      console.log("Successfully retrieved template from database");
      return processAgreementText(dbTemplate, agreement);
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
 * Process agreement template text with actual data
 */
const processAgreementText = (templateText: string, agreement: Agreement): string => {
  console.log("Processing agreement template with data");
  
  let processedText = templateText;
  
  // Safely access nested data with fallbacks
  const customerData = agreement.customers || {};
  const vehicleData = agreement.vehicles || {};
  
  // Format dates for better readability
  const startDate = agreement.start_date ? new Date(agreement.start_date).toLocaleDateString() : 'N/A';
  const endDate = agreement.end_date ? new Date(agreement.end_date).toLocaleDateString() : 'N/A';
  const currentDate = new Date().toLocaleDateString();
  
  console.log("Formatting data for template:", {
    agreementNumber: agreement.agreement_number,
    customerName: customerData.full_name,
    vehicleInfo: `${vehicleData.make} ${vehicleData.model}`,
    startDate,
    endDate
  });
  
  // Enhanced replacement with multiple format options for maximum compatibility
  
  // Agreement data replacements
  processedText = processedText
    // Agreement number - multiple formats
    .replace(/\{\{agreement\.agreement_number\}\}/g, agreement.agreement_number || '')
    .replace(/\{\{agreement_number\}\}/g, agreement.agreement_number || '')
    .replace(/\{\{AGREEMENT_NUMBER\}\}/g, agreement.agreement_number || '')
    
    // Dates - multiple formats
    .replace(/\{\{agreement\.start_date\}\}/g, startDate)
    .replace(/\{\{start_date\}\}/g, startDate)
    .replace(/\{\{START_DATE\}\}/g, startDate)
    .replace(/\{\{agreement\.end_date\}\}/g, endDate)
    .replace(/\{\{end_date\}\}/g, endDate)
    .replace(/\{\{END_DATE\}\}/g, endDate)
    .replace(/\{\{current_date\}\}/g, currentDate)
    .replace(/\{\{CURRENT_DATE\}\}/g, currentDate)
    
    // Financial terms - multiple formats
    .replace(/\{\{agreement\.total_amount\}\}/g, (agreement.total_amount || 0).toString())
    .replace(/\{\{total_amount\}\}/g, (agreement.total_amount || 0).toString())
    .replace(/\{\{TOTAL_AMOUNT\}\}/g, (agreement.total_amount || 0).toString())
    .replace(/\{\{agreement\.deposit_amount\}\}/g, (agreement.deposit_amount || 0).toString())
    .replace(/\{\{deposit_amount\}\}/g, (agreement.deposit_amount || 0).toString())
    .replace(/\{\{DEPOSIT_AMOUNT\}\}/g, (agreement.deposit_amount || 0).toString());
  
  // Customer data replacements
  processedText = processedText
    .replace(/\{\{customer\.full_name\}\}/g, customerData.full_name || 'N/A')
    .replace(/\{\{CUSTOMER_NAME\}\}/g, customerData.full_name || 'N/A')
    .replace(/\{\{customer\.email\}\}/g, customerData.email || 'N/A')
    .replace(/\{\{CUSTOMER_EMAIL\}\}/g, customerData.email || 'N/A')
    .replace(/\{\{customer\.phone\}\}/g, customerData.phone || 'N/A')
    .replace(/\{\{customer\.phone_number\}\}/g, customerData.phone || 'N/A')
    .replace(/\{\{CUSTOMER_PHONE\}\}/g, customerData.phone || 'N/A')
    .replace(/\{\{customer\.driver_license\}\}/g, customerData.driver_license || 'N/A')
    .replace(/\{\{CUSTOMER_LICENSE\}\}/g, customerData.driver_license || 'N/A')
    .replace(/\{\{customer\.nationality\}\}/g, customerData.nationality || 'N/A')
    .replace(/\{\{CUSTOMER_NATIONALITY\}\}/g, customerData.nationality || 'N/A')
    .replace(/\{\{customer\.address\}\}/g, customerData.address || 'N/A')
    .replace(/\{\{CUSTOMER_ADDRESS\}\}/g, customerData.address || 'N/A');
  
  // Vehicle data replacements
  processedText = processedText
    .replace(/\{\{vehicle\.make\}\}/g, vehicleData.make || 'N/A')
    .replace(/\{\{VEHICLE_MAKE\}\}/g, vehicleData.make || 'N/A')
    .replace(/\{\{vehicle\.model\}\}/g, vehicleData.model || 'N/A')
    .replace(/\{\{VEHICLE_MODEL\}\}/g, vehicleData.model || 'N/A')
    .replace(/\{\{vehicle\.year\}\}/g, vehicleData.year?.toString() || 'N/A')
    .replace(/\{\{VEHICLE_YEAR\}\}/g, vehicleData.year?.toString() || 'N/A')
    .replace(/\{\{vehicle\.color\}\}/g, vehicleData.color || 'N/A')
    .replace(/\{\{VEHICLE_COLOR\}\}/g, vehicleData.color || 'N/A')
    .replace(/\{\{vehicle\.license_plate\}\}/g, vehicleData.license_plate || 'N/A')
    .replace(/\{\{VEHICLE_PLATE\}\}/g, vehicleData.license_plate || 'N/A')
    .replace(/\{\{vehicle\.vin\}\}/g, vehicleData.vin || 'N/A')
    .replace(/\{\{VEHICLE_VIN\}\}/g, vehicleData.vin || 'N/A');
  
  // Additional variant format replacements for all fields (without dots, underscores, etc.)
  processedText = processedText
    // Common alternative formats without dot notation
    .replace(/\{\{agreementNumber\}\}/g, agreement.agreement_number || '')
    .replace(/\{\{startDate\}\}/g, startDate)
    .replace(/\{\{endDate\}\}/g, endDate)
    .replace(/\{\{totalAmount\}\}/g, (agreement.total_amount || 0).toString())
    .replace(/\{\{depositAmount\}\}/g, (agreement.deposit_amount || 0).toString())
    
    // Customer alternative formats
    .replace(/\{\{customerName\}\}/g, customerData.full_name || 'N/A')
    .replace(/\{\{customerEmail\}\}/g, customerData.email || 'N/A')
    .replace(/\{\{customerPhone\}\}/g, customerData.phone || 'N/A')
    .replace(/\{\{customerLicense\}\}/g, customerData.driver_license || 'N/A')
    .replace(/\{\{customerNationality\}\}/g, customerData.nationality || 'N/A')
    .replace(/\{\{customerAddress\}\}/g, customerData.address || 'N/A')
    
    // Vehicle alternative formats
    .replace(/\{\{vehicleMake\}\}/g, vehicleData.make || 'N/A')
    .replace(/\{\{vehicleModel\}\}/g, vehicleData.model || 'N/A')
    .replace(/\{\{vehicleYear\}\}/g, vehicleData.year?.toString() || 'N/A')
    .replace(/\{\{vehicleColor\}\}/g, vehicleData.color || 'N/A')
    .replace(/\{\{vehiclePlate\}\}/g, vehicleData.license_plate || 'N/A')
    .replace(/\{\{vehicleVin\}\}/g, vehicleData.vin || 'N/A');
  
  console.log("Template processing completed");
  
  // Check for any remaining template variables and log them for debugging
  const remainingVariables = processedText.match(/\{\{.*?\}\}/g);
  if (remainingVariables && remainingVariables.length > 0) {
    console.warn("Unprocessed template variables:", remainingVariables);
  }
  
  return processedText;
};

/**
 * Generate default agreement text
 */
const generateDefaultAgreementText = (agreement: Agreement): string => {
  const customerData = agreement.customers;
  const vehicleData = agreement.vehicles;
  
  // Format dates
  const startDate = agreement.start_date ? new Date(agreement.start_date).toLocaleDateString() : 'N/A';
  const endDate = agreement.end_date ? new Date(agreement.end_date).toLocaleDateString() : 'N/A';
  const currentDate = new Date().toLocaleDateString();
  
  return `
VEHICLE RENTAL AGREEMENT
=======================

Agreement Number: ${agreement.agreement_number || ''}
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
Rent Amount: ${agreement.total_amount ? (agreement.total_amount / 12).toFixed(2) : '0.00'} QAR per month
Security Deposit: ${agreement.deposit_amount || 0} QAR
Total Contract Value: ${agreement.total_amount || 0} QAR

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
  try {
    const agreementText = await generateAgreementText(agreement);
    
    // Create new PDF document
    const doc = new jsPDF();
    
    // Set properties
    doc.setFont("helvetica");
    doc.setFontSize(10);
    
    // Split the text into lines that fit in the PDF
    const textLines = doc.splitTextToSize(agreementText, 180);
    
    // Add text to the PDF
    doc.text(textLines, 15, 15);
    
    // Save the PDF
    doc.save(`agreement_${agreement.agreement_number}.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Failed to generate PDF document");
  }
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
    console.log("Checking if agreement template exists...");
    
    // First try direct URL validation - most reliable method
    const templateUrl = await getAgreementTemplateUrl();
    if (templateUrl) {
      try {
        // Try to fetch the template directly to verify accessibility
        const response = await fetch(templateUrl, {
          method: 'HEAD',
          cache: 'no-cache' // Avoid caching issues
        });
        
        if (response.ok) {
          console.log("Template URL validated successfully:", templateUrl);
          return true;
        } else {
          console.error(`Template URL validation failed with status ${response.status}`);
        }
      } catch (fetchError) {
        console.error("Error validating template URL:", fetchError);
      }
    }
    
    // If URL validation failed, check if template exists in storage
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
    
    // If template doesn't exist in either location, attempt to create it
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
    
    // Use service role client for more reliable access
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    let serviceClient = null;
    
    if (supabaseServiceKey) {
      serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
    }
    
    // First check if the bucket exists
    const { data: buckets, error: bucketsError } = serviceClient
      ? await serviceClient.storage.listBuckets()
      : await supabase.storage.listBuckets();
    
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
    const { data: files, error: listError } = serviceClient
      ? await serviceClient.storage.from('agreements').list()
      : await supabase.storage.from('agreements').list();
      
    if (listError) {
      console.error("Error listing files in agreements bucket:", listError);
      return false;
    }
    
    console.log("Files in agreements bucket:", files);
    
    // Primary filename is agreement_template.docx (with underscore)
    const primaryFileName = 'agreement_template.docx';
    
    // Check if any template name exists (prioritizing the primary filename)
    const templateExists = files?.some(file => 
      file.name === primaryFileName || 
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
    
    // Use service role client for more reliable access
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    let serviceClient = null;
    
    if (supabaseServiceKey) {
      serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
    }
    
    // Check if bucket exists first
    const { data: buckets, error: listError } = serviceClient
      ? await serviceClient.storage.listBuckets()
      : await supabase.storage.listBuckets();
    
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
      if (serviceClient) {
        try {
          console.log("Using service role key to create bucket");
          
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
      const client = serviceClient || supabase;
      const { data: files, error: listFilesError } = await client.storage
        .from('agreements')
        .list();
        
      if (listFilesError) {
        console.error("Error listing files to check for template:", listFilesError);
      } else {
        // Primary filename is agreement_template.docx (with underscore)
        const primaryFileName = 'agreement_template.docx';
        
        const templateExists = files?.some(file => 
          file.name === primaryFileName || 
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
    
    // Always use agreement_template.docx (with underscore) as the standardized filename
    const safeFileName = 'agreement_template.docx';
    
    // Try to upload with service role client first
    let uploadSuccess = false;
    
    if (serviceClient) {
      try {
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
          
          // Make the template publicly accessible and verify URL
          const { data: publicUrlData } = serviceClient.storage
            .from('agreements')
            .getPublicUrl(safeFileName);
            
          // Fix double slash issue if present
          let fixedUrl = publicUrlData.publicUrl;
          fixedUrl = fixedUrl.replace(/\/\/agreements\//, '/agreements/');
            
          console.log("Template public URL:", fixedUrl);
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
        
        // Verify URL
        const { data: publicUrlData } = supabase.storage
          .from('agreements')
          .getPublicUrl(safeFileName);
          
        // Fix double slash issue if present
        let fixedUrl = publicUrlData.publicUrl;
        fixedUrl = fixedUrl.replace(/\/\/agreements\//, '/agreements/');
          
        console.log("Template public URL (anon client):", fixedUrl);
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
      console.error("
