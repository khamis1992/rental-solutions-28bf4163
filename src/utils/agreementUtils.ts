import { Agreement } from "@/lib/validation-schemas/agreement";
import { processAgreementTemplate } from "@/lib/validation-schemas/agreement";
import { supabase } from "@/lib/supabase";

/**
 * Generate the agreement text by processing the template with agreement data
 */
export const generateAgreementText = async (agreement: Agreement): Promise<string> => {
  try {
    // If there's a custom template URL, fetch and process it
    if (agreement.template_url) {
      // Fetch the template file content
      const response = await fetch(agreement.template_url);
      
      if (!response.ok) {
        throw new Error("Failed to fetch template");
      }
      
      // Get template text
      const templateText = await response.text();
      
      // Process template with agreement data
      return processAgreementTemplate(templateText, agreement);
    }
    
    // If no custom template, generate default agreement text
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
