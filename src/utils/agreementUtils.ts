
import { Agreement } from "@/lib/validation-schemas/agreement";
import { processAgreementTemplate } from "@/lib/validation-schemas/agreement";
import { supabase } from "@/lib/supabase";

/**
 * Generate the agreement text by processing the template with agreement data
 */
export const generateAgreementText = async (agreement: Agreement): Promise<string> => {
  try {
    // Get the table structure first to understand what columns exist
    const { data: tableInfo, error: tableError } = await supabase
      .from("agreement_templates")
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error("Error fetching template table structure:", tableError);
      return generateDefaultAgreementText(agreement);
    }
    
    // Log the table structure to understand available columns
    console.log("Template table structure:", tableInfo);
    
    // Determine which column contains the template name (assuming it might be 'name' instead of 'template_name')
    const nameColumn = tableInfo && tableInfo[0] && 
      ('template_name' in tableInfo[0] ? 'template_name' : 
        ('name' in tableInfo[0] ? 'name' : null));
    
    if (!nameColumn) {
      console.error("Could not determine template name column in the database");
      return generateDefaultAgreementText(agreement);
    }
    
    console.log(`Using column "${nameColumn}" for template name lookup`);
    
    // Fetch the template using the determined name column
    const { data, error } = await supabase
      .from("agreement_templates")
      .select("*")
      .eq(nameColumn, "agreement temp.docx")
      .maybeSingle();
    
    if (error || !data) {
      console.error("Error fetching template from database:", error);
      // Try fallback to the regular template name
      const fallbackResult = await supabase
        .from("agreement_templates")
        .select("*")
        .eq(nameColumn, "agreement temp")
        .maybeSingle();
        
      if (fallbackResult.error || !fallbackResult.data) {
        console.error("Error fetching fallback template:", fallbackResult.error);
        return generateDefaultAgreementText(agreement);
      }
      
      // Determine which column contains the content
      const contentColumn = 'content' in fallbackResult.data ? 'content' : 
        ('template_content' in fallbackResult.data ? 'template_content' : null);
      
      if (!contentColumn || !fallbackResult.data[contentColumn]) {
        console.error("Could not determine template content column");
        return generateDefaultAgreementText(agreement);
      }
      
      // Use the fallback template if found
      console.log(`Using fallback template: agreement temp (content column: ${contentColumn})`);
      return processAgreementTemplate(fallbackResult.data[contentColumn], agreement);
    }
    
    // Determine which column contains the content
    const contentColumn = 'content' in data ? 'content' : 
      ('template_content' in data ? 'template_content' : null);
    
    if (!contentColumn || !data[contentColumn]) {
      console.error("Could not determine template content column");
      return generateDefaultAgreementText(agreement);
    }
    
    // Process standard template with agreement data
    console.log(`Using template: agreement temp.docx (content column: ${contentColumn})`);
    return processAgreementTemplate(data[contentColumn], agreement);
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
 * This allows manual registration of templates when bucket upload fails
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
 * Check if the standard agreement template exists in the database
 */
export const checkStandardTemplateExists = async (): Promise<boolean> => {
  try {
    console.log("Checking for template 'agreement temp.docx'");
    
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
    
    // Determine which column contains the template name (assuming it might be 'name' instead of 'template_name')
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
    console.error("Exception checking templates:", error);
    return false;
  }
};
