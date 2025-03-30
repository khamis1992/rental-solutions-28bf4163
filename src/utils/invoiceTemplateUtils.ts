
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface TemplateVariable {
  id: string;
  name: string;
  description: string;
  defaultValue: string;
  category: 'customer' | 'vehicle' | 'payment' | 'agreement' | 'company';
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  category: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  variables: TemplateVariable[];
}

export const defaultVariables: TemplateVariable[] = [
  // Company information
  { id: "companyName", name: "{{companyName}}", description: "Company name", defaultValue: "ALARAF CAR RENTAL", category: 'company' },
  { id: "companyAddress", name: "{{companyAddress}}", description: "Company address", defaultValue: "Doha, Qatar", category: 'company' },
  { id: "companyPhone", name: "{{companyPhone}}", description: "Company phone", defaultValue: "+974 1234 5678", category: 'company' },
  { id: "companyEmail", name: "{{companyEmail}}", description: "Company email", defaultValue: "info@alarafcarrental.com", category: 'company' },
  
  // Customer information
  { id: "customerName", name: "{{customerName}}", description: "Customer name", defaultValue: "Customer Name", category: 'customer' },
  { id: "customerEmail", name: "{{customerEmail}}", description: "Customer email", defaultValue: "customer@example.com", category: 'customer' },
  { id: "customerPhone", name: "{{customerPhone}}", description: "Customer phone", defaultValue: "+974 5555 5555", category: 'customer' },
  { id: "customerAddress", name: "{{customerAddress}}", description: "Customer address", defaultValue: "Customer Address", category: 'customer' },
  
  // Vehicle information
  { id: "vehicleMake", name: "{{vehicleMake}}", description: "Vehicle make", defaultValue: "Toyota", category: 'vehicle' },
  { id: "vehicleModel", name: "{{vehicleModel}}", description: "Vehicle model", defaultValue: "Land Cruiser", category: 'vehicle' },
  { id: "vehiclePlate", name: "{{vehiclePlate}}", description: "License plate", defaultValue: "ABC-123", category: 'vehicle' },
  { id: "vehicleYear", name: "{{vehicleYear}}", description: "Vehicle year", defaultValue: "2023", category: 'vehicle' },
  
  // Agreement information
  { id: "agreementNumber", name: "{{agreementNumber}}", description: "Agreement number", defaultValue: "AGR-12345", category: 'agreement' },
  { id: "startDate", name: "{{startDate}}", description: "Start date", defaultValue: "2023-07-15", category: 'agreement' },
  { id: "endDate", name: "{{endDate}}", description: "End date", defaultValue: "2023-08-15", category: 'agreement' },
  
  // Payment information
  { id: "invoiceNumber", name: "{{invoiceNumber}}", description: "Invoice number", defaultValue: "INV-001", category: 'payment' },
  { id: "invoiceDate", name: "{{invoiceDate}}", description: "Invoice date", defaultValue: "2023-07-15", category: 'payment' },
  { id: "dueDate", name: "{{dueDate}}", description: "Due date", defaultValue: "2023-08-15", category: 'payment' },
  { id: "totalAmount", name: "{{totalAmount}}", description: "Total amount", defaultValue: "1000.00", category: 'payment' },
  { id: "paidAmount", name: "{{paidAmount}}", description: "Paid amount", defaultValue: "500.00", category: 'payment' },
  { id: "balanceAmount", name: "{{balanceAmount}}", description: "Balance amount", defaultValue: "500.00", category: 'payment' },
  { id: "tax", name: "{{tax}}", description: "Tax amount", defaultValue: "50.00", category: 'payment' },
  { id: "currency", name: "{{currency}}", description: "Currency", defaultValue: "QAR", category: 'payment' },
];

export const templateCategories = [
  { id: "invoice", name: "Invoice" },
  { id: "receipt", name: "Receipt" },
  { id: "agreement", name: "Agreement" },
  { id: "reminder", name: "Payment Reminder" },
  { id: "statement", name: "Account Statement" },
];

// Default templates for different categories
export const getDefaultTemplate = (category: string): string => {
  switch (category) {
    case "invoice":
      return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
    .invoice-header { display: flex; justify-content: space-between; margin-bottom: 20px; }
    .company-info { margin-bottom: 20px; }
    .invoice-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; color: #2c3e50; }
    .invoice-details { margin-bottom: 20px; }
    .customer-info { margin-bottom: 20px; }
    .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .table th { background-color: #f2f2f2; text-align: left; padding: 10px; }
    .table td { padding: 10px; border-bottom: 1px solid #ddd; }
    .totals { margin-left: auto; width: 300px; }
    .total-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
    .grand-total { font-weight: bold; font-size: 18px; }
    .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #777; }
  </style>
</head>
<body>
  <div class="invoice-header">
    <div class="company-info">
      <div class="invoice-title">{{companyName}}</div>
      <div>{{companyAddress}}</div>
      <div>{{companyPhone}}</div>
      <div>{{companyEmail}}</div>
    </div>
    <div class="invoice-details">
      <div class="invoice-title">INVOICE</div>
      <div><strong>Invoice #:</strong> {{invoiceNumber}}</div>
      <div><strong>Date:</strong> {{invoiceDate}}</div>
      <div><strong>Due Date:</strong> {{dueDate}}</div>
    </div>
  </div>
  
  <div class="customer-info">
    <div><strong>Bill To:</strong></div>
    <div>{{customerName}}</div>
    <div>{{customerEmail}}</div>
    <div>{{customerPhone}}</div>
    <div>{{customerAddress}}</div>
  </div>
  
  <table class="table">
    <thead>
      <tr>
        <th>Description</th>
        <th>Vehicle</th>
        <th>Period</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Vehicle Rental</td>
        <td>{{vehicleMake}} {{vehicleModel}} ({{vehiclePlate}})</td>
        <td>{{startDate}} to {{endDate}}</td>
        <td>{{currency}} {{totalAmount}}</td>
      </tr>
    </tbody>
  </table>
  
  <div class="totals">
    <div class="total-row">
      <div>Subtotal:</div>
      <div>{{currency}} {{totalAmount}}</div>
    </div>
    <div class="total-row">
      <div>Tax:</div>
      <div>{{currency}} {{tax}}</div>
    </div>
    <div class="total-row grand-total">
      <div>Total:</div>
      <div>{{currency}} {{totalAmount}}</div>
    </div>
    <div class="total-row">
      <div>Paid:</div>
      <div>{{currency}} {{paidAmount}}</div>
    </div>
    <div class="total-row">
      <div>Balance Due:</div>
      <div>{{currency}} {{balanceAmount}}</div>
    </div>
  </div>
  
  <div class="footer">
    <p>Thank you for your business!</p>
    <p>Agreement #: {{agreementNumber}}</p>
  </div>
</body>
</html>`;
    
    case "receipt":
      return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
    .receipt-header { text-align: center; margin-bottom: 20px; }
    .receipt-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
    .company-info { margin-bottom: 20px; text-align: center; }
    .details { margin-bottom: 20px; }
    .customer-info { margin-bottom: 20px; }
    .payment-info { border: 1px solid #ddd; padding: 15px; margin-bottom: 20px; }
    .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #777; }
  </style>
</head>
<body>
  <div class="receipt-header">
    <div class="receipt-title">PAYMENT RECEIPT</div>
    <div>Receipt #: {{invoiceNumber}}</div>
    <div>Date: {{invoiceDate}}</div>
  </div>
  
  <div class="company-info">
    <div><strong>{{companyName}}</strong></div>
    <div>{{companyAddress}}</div>
    <div>{{companyPhone}} | {{companyEmail}}</div>
  </div>
  
  <div class="customer-info">
    <div><strong>Customer:</strong> {{customerName}}</div>
    <div><strong>Contact:</strong> {{customerPhone}} | {{customerEmail}}</div>
  </div>
  
  <div class="payment-info">
    <div><strong>Payment Details</strong></div>
    <div>Agreement #: {{agreementNumber}}</div>
    <div>Vehicle: {{vehicleMake}} {{vehicleModel}} ({{vehiclePlate}})</div>
    <div>Payment Amount: {{currency}} {{paidAmount}}</div>
    <div>Payment Date: {{invoiceDate}}</div>
  </div>
  
  <div class="details">
    <div><strong>Payment Summary</strong></div>
    <div>Total Amount: {{currency}} {{totalAmount}}</div>
    <div>Previous Balance: {{currency}} {{balanceAmount}}</div>
    <div>Amount Paid: {{currency}} {{paidAmount}}</div>
    <div>Remaining Balance: {{currency}} 0.00</div>
  </div>
  
  <div class="footer">
    <p>Thank you for your payment!</p>
    <p>This is an official receipt of {{companyName}}</p>
  </div>
</body>
</html>`;
    
    case "reminder":
      return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
    .reminder-header { text-align: center; margin-bottom: 20px; }
    .reminder-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; color: #e74c3c; }
    .company-info { margin-bottom: 20px; text-align: center; }
    .message { margin-bottom: 20px; line-height: 1.5; }
    .payment-details { border: 1px solid #ddd; padding: 15px; margin-bottom: 20px; background-color: #f9f9f9; }
    .important { color: #e74c3c; font-weight: bold; }
    .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #777; }
  </style>
</head>
<body>
  <div class="reminder-header">
    <div class="reminder-title">PAYMENT REMINDER</div>
    <div>Reference #: {{invoiceNumber}}</div>
    <div>Date: {{invoiceDate}}</div>
  </div>
  
  <div class="company-info">
    <div><strong>{{companyName}}</strong></div>
    <div>{{companyAddress}}</div>
    <div>{{companyPhone}} | {{companyEmail}}</div>
  </div>
  
  <div class="message">
    <p>Dear {{customerName}},</p>
    <p>Our records indicate that we have not yet received payment for the following invoice that is now past due. If you have already sent your payment, please disregard this notice.</p>
  </div>
  
  <div class="payment-details">
    <div><strong>Payment Details</strong></div>
    <div>Agreement #: {{agreementNumber}}</div>
    <div>Vehicle: {{vehicleMake}} {{vehicleModel}} ({{vehiclePlate}})</div>
    <div>Original Due Date: {{dueDate}}</div>
    <div class="important">Amount Due: {{currency}} {{balanceAmount}}</div>
  </div>
  
  <div class="message">
    <p>Please arrange for this payment as soon as possible. If you have any questions regarding this invoice, please contact our accounting department.</p>
    <p>Thank you for your prompt attention to this matter.</p>
  </div>
  
  <div class="footer">
    <p>{{companyName}}</p>
    <p>{{companyPhone}} | {{companyEmail}}</p>
  </div>
</body>
</html>`;
    
    case "statement":
      return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
    .statement-header { display: flex; justify-content: space-between; margin-bottom: 20px; }
    .company-info { margin-bottom: 20px; }
    .statement-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; color: #2c3e50; }
    .statement-details { margin-bottom: 20px; }
    .customer-info { margin-bottom: 20px; }
    .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .table th { background-color: #f2f2f2; text-align: left; padding: 10px; }
    .table td { padding: 10px; border-bottom: 1px solid #ddd; }
    .summary { margin-left: auto; width: 300px; }
    .summary-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
    .total-due { font-weight: bold; font-size: 18px; }
    .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #777; }
  </style>
</head>
<body>
  <div class="statement-header">
    <div class="company-info">
      <div class="statement-title">{{companyName}}</div>
      <div>{{companyAddress}}</div>
      <div>{{companyPhone}}</div>
      <div>{{companyEmail}}</div>
    </div>
    <div class="statement-details">
      <div class="statement-title">ACCOUNT STATEMENT</div>
      <div><strong>Statement Date:</strong> {{invoiceDate}}</div>
      <div><strong>Account #:</strong> {{customerName}}</div>
    </div>
  </div>
  
  <div class="customer-info">
    <div><strong>Customer:</strong></div>
    <div>{{customerName}}</div>
    <div>{{customerEmail}}</div>
    <div>{{customerPhone}}</div>
    <div>{{customerAddress}}</div>
  </div>
  
  <table class="table">
    <thead>
      <tr>
        <th>Date</th>
        <th>Description</th>
        <th>Reference</th>
        <th>Amount</th>
        <th>Balance</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>{{startDate}}</td>
        <td>Vehicle Rental</td>
        <td>{{agreementNumber}}</td>
        <td>{{currency}} {{totalAmount}}</td>
        <td>{{currency}} {{totalAmount}}</td>
      </tr>
      <tr>
        <td>{{invoiceDate}}</td>
        <td>Payment Received</td>
        <td>{{invoiceNumber}}</td>
        <td>{{currency}} -{{paidAmount}}</td>
        <td>{{currency}} {{balanceAmount}}</td>
      </tr>
    </tbody>
  </table>
  
  <div class="summary">
    <div class="summary-row total-due">
      <div>Total Due:</div>
      <div>{{currency}} {{balanceAmount}}</div>
    </div>
  </div>
  
  <div class="footer">
    <p>This statement reflects the current status of your account with {{companyName}}.</p>
    <p>Please contact us with any questions or concerns.</p>
  </div>
</body>
</html>`;
    
    default:
      return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
  </style>
</head>
<body>
  <h1>{{companyName}}</h1>
  <p>Document #: {{invoiceNumber}}</p>
  <p>Date: {{invoiceDate}}</p>
  
  <div>
    <h2>Customer Information</h2>
    <p>Name: {{customerName}}</p>
    <p>Email: {{customerEmail}}</p>
    <p>Phone: {{customerPhone}}</p>
  </div>
  
  <p>Thank you for your business with {{companyName}}.</p>
</body>
</html>`;
  }
};

// Process template by replacing variables with actual data
export const processTemplate = (template: string, data: Record<string, any>): string => {
  let processedTemplate = template;
  
  // Loop through all keys in data and replace corresponding placeholders
  Object.keys(data).forEach(key => {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    processedTemplate = processedTemplate.replace(placeholder, data[key] || '');
  });
  
  // Remove any remaining placeholders with empty strings
  processedTemplate = processedTemplate.replace(/{{.*?}}/g, '');
  
  return processedTemplate;
};

// Save a template to the database
export const saveTemplate = async (template: Omit<InvoiceTemplate, 'createdAt' | 'updatedAt'>) => {
  try {
    const { data, error } = await supabase
      .from('invoice_templates')
      .upsert({
        id: template.id,
        name: template.name,
        description: template.description,
        content: template.content,
        category: template.category,
        is_default: template.isDefault,
        variables: template.variables,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
      .select('*')
      .single();
    
    if (error) {
      console.error('Error saving template:', error);
      throw new Error(`Failed to save template: ${error.message}`);
    }
    
    return data;
  } catch (error: any) {
    console.error('Error in saveTemplate:', error);
    throw new Error(error.message || 'Failed to save template');
  }
};

// Fetch all templates from the database
export const fetchTemplates = async (): Promise<InvoiceTemplate[]> => {
  try {
    const { data, error } = await supabase
      .from('invoice_templates')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching templates:', error);
      throw new Error(`Failed to fetch templates: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Transform from database format to application format
    return data.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      content: item.content,
      category: item.category,
      isDefault: item.is_default,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
      variables: item.variables || defaultVariables,
    }));
  } catch (error: any) {
    console.error('Error in fetchTemplates:', error);
    throw new Error(error.message || 'Failed to fetch templates');
  }
};

// Delete a template from the database
export const deleteTemplate = async (templateId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('invoice_templates')
      .delete()
      .eq('id', templateId);
    
    if (error) {
      console.error('Error deleting template:', error);
      throw new Error(`Failed to delete template: ${error.message}`);
    }
    
    return true;
  } catch (error: any) {
    console.error('Error in deleteTemplate:', error);
    throw new Error(error.message || 'Failed to delete template');
  }
};

// Generate PDF from a template
export const generatePDF = async (
  templateId: string, 
  data: Record<string, any>
): Promise<Blob> => {
  try {
    // First, get the template
    const { data: template, error } = await supabase
      .from('invoice_templates')
      .select('*')
      .eq('id', templateId)
      .single();
    
    if (error || !template) {
      throw new Error('Template not found');
    }
    
    // Process the template with data
    const processedHTML = processTemplate(template.content, data);
    
    // In a real implementation, we would convert the HTML to PDF
    // For now, we'll create a Blob with the HTML content
    const blob = new Blob([processedHTML], { type: 'text/html' });
    return blob;
  } catch (error: any) {
    console.error('Error generating PDF:', error);
    throw new Error(error.message || 'Failed to generate PDF');
  }
};

// Initialize templates if none exist
export const initializeTemplates = async (): Promise<void> => {
  try {
    // Check if any templates exist
    const { data, error } = await supabase
      .from('invoice_templates')
      .select('id')
      .limit(1);
    
    if (error) {
      throw new Error(`Failed to check templates: ${error.message}`);
    }
    
    // If no templates exist, create default ones
    if (!data || data.length === 0) {
      const defaultTemplates = templateCategories.map(category => ({
        id: `template-${category.id}-${Date.now()}`,
        name: `Default ${category.name}`,
        description: `Standard ${category.name.toLowerCase()} template for all customers`,
        content: getDefaultTemplate(category.id),
        category: category.id,
        isDefault: true,
        variables: defaultVariables
      }));
      
      // Insert all default templates
      for (const template of defaultTemplates) {
        await saveTemplate(template);
      }
      
      toast.success('Default templates initialized');
    }
  } catch (error: any) {
    console.error('Error initializing templates:', error);
    toast.error(error.message || 'Failed to initialize templates');
  }
};
