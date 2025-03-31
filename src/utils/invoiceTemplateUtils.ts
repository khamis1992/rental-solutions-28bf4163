import { v4 as uuidv4 } from 'uuid';
import { supabase } from "@/integrations/supabase/client";

export interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  category: string;
  variables: TemplateVariable[];
  isDefault: boolean;
  created_at: string;
  updated_at: string;
}

export interface TemplateVariable {
  id: string;
  name: string;
  description: string;
  defaultValue: string;
}

export const defaultVariables: TemplateVariable[] = [
  { id: "companyName", name: "Company Name", description: "Your company's name", defaultValue: "Your Company" },
  { id: "companyAddress", name: "Company Address", description: "Your company's address", defaultValue: "123 Main St, Anytown" },
  { id: "clientName", name: "Client Name", description: "Client's name", defaultValue: "Client Name" },
  { id: "clientAddress", name: "Client Address", description: "Client's address", defaultValue: "456 Elm St, Anytown" },
  { id: "invoiceNumber", name: "Invoice Number", description: "Invoice number", defaultValue: "INV-001" },
  { id: "invoiceDate", name: "Invoice Date", description: "Invoice date", defaultValue: new Date().toLocaleDateString() },
  { id: "dueDate", name: "Due Date", description: "Due date", defaultValue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString() },
  { id: "amountDue", name: "Amount Due", description: "Total amount due", defaultValue: "$1,000.00" },
  { id: "paymentTerms", name: "Payment Terms", description: "Payment terms", defaultValue: "Net 30 days" },
  { id: "itemDescription", name: "Item Description", description: "Description of the item or service", defaultValue: "Service Description" },
  { id: "itemQuantity", name: "Item Quantity", description: "Quantity of the item or service", defaultValue: "1" },
  { id: "itemUnitPrice", name: "Item Unit Price", description: "Unit price of the item or service", defaultValue: "$1,000.00" },
  { id: "itemTotal", name: "Item Total", description: "Total cost of the item or service", defaultValue: "$1,000.00" }
];

export const templateCategories = [
  { value: "invoice", label: "Invoice" },
  { value: "receipt", label: "Receipt" },
  { value: "estimate", label: "Estimate" },
  { value: "credit-memo", label: "Credit Memo" },
  { value: "statement", label: "Statement" },
];

export const getDefaultTemplate = (category: string): string => {
  switch (category) {
    case 'invoice':
      return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invoice</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .invoice { width: 80%; margin: auto; border: 1px solid #ccc; padding: 20px; }
            .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #ccc; }
            .details { margin-top: 20px; display: flex; justify-content: space-between; }
            .item-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .item-table th, .item-table td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            .total { text-align: right; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="invoice">
            <div class="header">
              <h1>Invoice</h1>
              <p>{{companyName}}</p>
              <p>{{companyAddress}}</p>
            </div>
            <div class="details">
              <div>
                <p><strong>Client:</strong> {{clientName}}</p>
                <p>{{clientAddress}}</p>
              </div>
              <div>
                <p><strong>Invoice #:</strong> {{invoiceNumber}}</p>
                <p><strong>Date:</strong> {{invoiceDate}}</p>
                <p><strong>Due Date:</strong> {{dueDate}}</p>
              </div>
            </div>
            <table class="item-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{{itemDescription}}</td>
                  <td>{{itemQuantity}}</td>
                  <td>{{itemUnitPrice}}</td>
                  <td>{{itemTotal}}</td>
                </tr>
              </tbody>
            </table>
            <div class="total">
              <strong>Amount Due:</strong> {{amountDue}}
            </div>
            <div class="payment-terms">
              <p><strong>Payment Terms:</strong> {{paymentTerms}}</p>
            </div>
          </div>
        </body>
        </html>
      `;
    case 'receipt':
      return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .receipt { width: 60%; margin: auto; border: 1px solid #ccc; padding: 20px; }
            .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #ccc; }
            .details { margin-top: 20px; display: flex; justify-content: space-between; }
            .item-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .item-table th, .item-table td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            .total { text-align: right; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h1>Receipt</h1>
              <p>{{companyName}}</p>
              <p>{{companyAddress}}</p>
            </div>
            <div class="details">
              <div>
                <p><strong>Client:</strong> {{clientName}}</p>
                <p>{{clientAddress}}</p>
              </div>
              <div>
                <p><strong>Receipt #:</strong> {{invoiceNumber}}</p>
                <p><strong>Date:</strong> {{invoiceDate}}</p>
              </div>
            </div>
            <table class="item-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{{itemDescription}}</td>
                  <td>{{itemQuantity}}</td>
                  <td>{{itemUnitPrice}}</td>
                  <td>{{itemTotal}}</td>
                </tr>
              </tbody>
            </table>
            <div class="total">
              <strong>Amount Paid:</strong> {{amountDue}}
            </div>
          </div>
        </body>
        </html>
      `;
    default:
      return `<h1>Default Template</h1><p>No template available for this category.</p>`;
  }
};

export const processTemplate = (templateContent: string, data: Record<string, string>): string => {
  let processedHtml = templateContent;
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    processedHtml = processedHtml.replace(regex, data[key]);
  });
  return processedHtml;
};

export const saveTemplate = async (template: InvoiceTemplate): Promise<InvoiceTemplate> => {
  try {
    // Generate a proper UUID instead of using a timestamp-based ID
    const templateId = template.id || uuidv4();
    
    const { data, error } = await supabase
      .from('invoice_templates')
      .upsert(
        {
          id: templateId,
          name: template.name,
          description: template.description,
          content: template.content,
          category: template.category,
          variables: template.variables || defaultVariables,
          is_default: template.isDefault || false,
          updated_at: new Date().toISOString(),
          created_at: template.created_at || new Date().toISOString()
        },
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (error) {
      console.error("Error saving template:", error);
      throw new Error(`Failed to save template: ${error.message}`);
    }

    console.log("Template saved successfully:", data);
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      content: data.content,
      category: data.category,
      variables: data.variables || defaultVariables,
      isDefault: data.is_default || false,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  } catch (error) {
    console.error("Error in saveTemplate:", error);
    throw error;
  }
};

export const fetchTemplates = async (): Promise<InvoiceTemplate[]> => {
  try {
    const { data, error } = await supabase
      .from('invoice_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching templates:", error);
      throw new Error(`Failed to fetch templates: ${error.message}`);
    }

    if (!data) {
      console.warn("No templates found, returning empty array");
      return [];
    }

    return data.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description,
      content: template.content,
      category: template.category,
      variables: template.variables || defaultVariables,
      isDefault: template.is_default || false,
      created_at: template.created_at,
      updated_at: template.updated_at
    }));
  } catch (error) {
    console.error("Error in fetchTemplates:", error);
    throw error;
  }
};

export const deleteTemplate = async (templateId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('invoice_templates')
      .delete()
      .eq('id', templateId);

    if (error) {
      console.error("Error deleting template:", error);
      throw new Error(`Failed to delete template: ${error.message}`);
    }

    console.log(`Template with ID ${templateId} deleted successfully`);
  } catch (error) {
    console.error("Error in deleteTemplate:", error);
    throw error;
  }
};

export const initializeTemplates = async (): Promise<void> => {
  try {
    // First check if there are any templates in the database
    const { data: existingTemplates, error: checkError } = await supabase
      .from('invoice_templates')
      .select('*');

    if (checkError) {
      console.error("Error checking templates:", checkError);
      throw new Error(`Failed to check templates: ${checkError.message}`);
    }

    // If no templates exist, create default ones
    if (!existingTemplates || existingTemplates.length === 0) {
      console.log("No templates found, creating defaults");
      const defaultInvoiceTemplate: InvoiceTemplate = {
        id: uuidv4(), // Use UUID instead of timestamp
        name: "Standard Invoice",
        description: "Default invoice template",
        category: "invoice",
        content: getDefaultTemplate('invoice'),
        variables: defaultVariables,
        isDefault: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const defaultReceiptTemplate: InvoiceTemplate = {
        id: uuidv4(), // Use UUID instead of timestamp
        name: "Standard Receipt",
        description: "Default receipt template",
        category: "receipt",
        content: getDefaultTemplate('receipt'),
        variables: defaultVariables,
        isDefault: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save default templates
      await saveTemplate(defaultInvoiceTemplate);
      await saveTemplate(defaultReceiptTemplate);
      console.log("Default templates created");
    } else {
      console.log("Templates already exist, skipping initialization");
    }
  } catch (error) {
    console.error("Error initializing templates:", error);
    throw error;
  }
};

export const isValidTemplate = (templateContent: string): boolean => {
  try {
    // Basic check for HTML structure
    if (!templateContent.trim().startsWith("<!DOCTYPE html>")) {
      console.warn("Template does not start with <!DOCTYPE html>");
      return false;
    }

    // Check for essential tags
    if (!templateContent.includes("<html") || !templateContent.includes("<body")) {
      console.warn("Template missing essential <html> or <body> tags");
      return false;
    }

    // Try to create a DOM element from the template content
    const parser = new DOMParser();
    const doc = parser.parseFromString(templateContent, 'text/html');

    // Check for parsing errors
    const errorNode = doc.querySelector('parsererror');
    if (errorNode) {
      console.error("Template parsing error:", errorNode.textContent);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error validating template:", error);
    return false;
  }
};
