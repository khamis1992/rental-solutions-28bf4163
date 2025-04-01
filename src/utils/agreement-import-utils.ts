import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { Agreement, AgreementStatus } from '@/lib/validation-schemas/agreement';
import { toast } from 'sonner';

// Schema for validating CSV row data
export const agreementImportSchema = z.object({
  customer_id: z.string().uuid('Customer ID must be a valid UUID'),
  vehicle_id: z.string().uuid('Vehicle ID must be a valid UUID'),
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
      .upload(fileName, file);

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
  userId: string
): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('agreement_imports')
      .insert({
        file_name: fileName,
        original_file_name: originalFileName,
        created_by: userId,
        status: 'pending'
      })
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

// Function to download a template CSV file
export const downloadAgreementCSVTemplate = () => {
  const csvContent = agreementCSVFields.join(',') + '\n';
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
