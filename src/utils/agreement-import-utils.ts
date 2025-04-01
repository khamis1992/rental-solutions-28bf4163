import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { Agreement, AgreementStatus } from '@/lib/validation-schemas/agreement';
import { toast } from 'sonner';
import { previewCSVFile } from '@/utils/csv-utils';

// Schema for validating CSV row data
export const agreementImportSchema = z.object({
  customer_id: z.string().min(1, 'Customer ID is required'),
  vehicle_id: z.string().min(1, 'Vehicle ID is required'),
  start_date: z.string().refine(
    (date) => {
      const parsedDate = new Date(date);
      return !isNaN(parsedDate.getTime());
    },
    { message: 'Start date must be a valid date (YYYY-MM-DD)' }
  ),
  end_date: z.string().refine(
    (date) => {
      const parsedDate = new Date(date);
      return !isNaN(parsedDate.getTime());
    },
    { message: 'End date must be a valid date (YYYY-MM-DD)' }
  ),
  rent_amount: z.string().refine(
    (value) => !isNaN(parseFloat(value)) && parseFloat(value) >= 0,
    { message: 'Rent amount must be a valid number' }
  ),
  deposit_amount: z.string().optional().refine(
    (value) => value === undefined || value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0),
    { message: 'Deposit amount must be a valid number or empty' }
  ),
  agreement_type: z.string().optional(),
  notes: z.string().optional(),
});

export type AgreementImportRow = z.infer<typeof agreementImportSchema>;

// CSV field names for agreement import
export const agreementCSVFields = [
  'Customer ID',
  'Vehicle ID',
  'Start Date',
  'End Date',
  'Rent Amount',
  'Deposit Amount',
  'Agreement Type',
  'Notes'
];

// Map from CSV column names to agreement schema field names
export const agreementCSVMap: Record<string, keyof AgreementImportRow> = {
  'Customer ID': 'customer_id',
  'Vehicle ID': 'vehicle_id',
  'Start Date': 'start_date',
  'End Date': 'end_date',
  'Rent Amount': 'rent_amount',
  'Deposit Amount': 'deposit_amount',
  'Agreement Type': 'agreement_type',
  'Notes': 'notes'
};

// Function to check if the Edge Function is available
export const checkEdgeFunctionAvailability = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('process-agreement-imports', {
      body: { test: true },
    });
    
    if (error) {
      console.error('Edge Function check failed:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Error checking Edge Function:', err);
    return false;
  }
};

// Function to upload a CSV file to storage
export const uploadCSV = async (file: File, fileName: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase.storage
      .from('agreement-imports')
      .upload(fileName, file, {
        contentType: 'text/csv',
        upsert: true // Allow overwriting existing files
      });

    if (error) {
      console.error('Error uploading CSV:', error);
      toast.error(`Failed to upload file: ${error.message}`);
      return null;
    }

    return data.path;
  } catch (err) {
    console.error('Unexpected error uploading CSV:', err);
    toast.error('An unexpected error occurred while uploading the file');
    return null;
  }
};

// Function to create an import log entry
export const createImportLog = async (
  fileName: string,
  originalFileName: string,
  userId: string,
  overwriteExisting: boolean = false
): Promise<string | null> => {
  try {
    // Check if the overwrite_existing column exists in the table
    const { data: columnInfo, error: columnCheckError } = await supabase
      .rpc('column_exists', { table_name: 'agreement_imports', column_name: 'overwrite_existing' });
    
    const hasOverwriteColumn = columnInfo === true;
    
    if (columnCheckError) {
      console.warn("Unable to check for column existence:", columnCheckError);
      // Proceed anyway with a basic insert without the overwrite flag
    }

    // If overwriteExisting is true and the column exists, handle existing imports
    if (overwriteExisting && hasOverwriteColumn) {
      const { data: existingImports } = await supabase
        .from('agreement_imports')
        .select('id')
        .eq('original_file_name', originalFileName)
        .eq('created_by', userId)
        .neq('status', 'reverted');
      
      // If existing imports found, mark them for replacement
      if (existingImports && existingImports.length > 0) {
        console.log(`Found ${existingImports.length} existing imports to replace`);
        
        // Update existing imports to mark them as being replaced
        await supabase
          .from('agreement_imports')
          .update({ 
            status: 'pending_replacement',
            updated_at: new Date().toISOString()
          })
          .in('id', existingImports.map(imp => imp.id));
      }
    }

    // Create insert object dynamically based on column existence
    const insertObj: any = {
      file_name: fileName,
      original_file_name: originalFileName,
      created_by: userId,
      status: 'pending'
    };
    
    // Only add overwrite_existing if the column exists
    if (hasOverwriteColumn) {
      insertObj.overwrite_existing = overwriteExisting;
    }

    const { data, error } = await supabase
      .from('agreement_imports')
      .insert(insertObj)
      .select('id')
      .single();

    if (error) {
      console.error('Error creating import log:', error);
      toast.error(`Failed to create import log: ${error.message}`);
      return null;
    }

    return data.id;
  } catch (err) {
    console.error('Unexpected error creating import log:', err);
    toast.error('An unexpected error occurred while logging the import');
    return null;
  }
};

// Function to preview CSV data
export const previewAgreementCSV = async (file: File): Promise<{headers: string[], rows: string[][]}> => {
  try {
    const preview = await previewCSVFile(file, 5);
    return preview;
  } catch (err) {
    console.error('Error previewing CSV file:', err);
    toast.error('Failed to preview CSV file');
    throw err;
  }
};

// Function to download a template CSV file
export const downloadAgreementCSVTemplate = () => {
  // Create a more comprehensive template with comments and example data
  const csvHeader = `# Agreement Import Template\n# For Customer ID, you can use:\n# - UUID\n# - Email\n# - Phone Number\n# - Full Name\n# For Vehicle ID, you can use:\n# - UUID\n# - License Plate\n# - VIN\n# Dates should be in YYYY-MM-DD format\n\n`;
  
  // Add the header row
  const headerRow = agreementCSVFields.join(',');
  
  // Add an example row
  const exampleRow = [
    'john.doe@example.com', // Customer ID (email)
    'ABC123', // Vehicle ID (license plate)
    '2025-01-01', // Start Date
    '2025-12-31', // End Date
    '1000', // Rent Amount
    '500', // Deposit Amount
    'long_term', // Agreement Type
    'Example agreement note' // Notes
  ].join(',');
  
  const csvContent = csvHeader + headerRow + '\n' + exampleRow + '\n';
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', 'agreement_import_template.csv');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

// Function to track the status of an import
export const getImportStatus = async (importId: string) => {
  const { data, error } = await supabase
    .from('agreement_imports')
    .select('*')
    .eq('id', importId)
    .single();

  if (error) {
    console.error('Error fetching import status:', error);
    return null;
  }

  return data;
};

// Function to get import errors
export const getImportErrors = async (importId: string) => {
  const { data, error } = await supabase
    .from('agreement_import_errors')
    .select('*')
    .eq('import_log_id', importId)
    .order('row_number', { ascending: true });

  if (error) {
    console.error('Error fetching import errors:', error);
    return [];
  }

  return data;
};
