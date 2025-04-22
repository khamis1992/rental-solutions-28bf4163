
import { supabase } from '@/lib/supabase';

// Allowed types for CSV imports
const ALLOWED_CSV_EXTENSIONS = ['.csv'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Upload a CSV file to Supabase storage
 */
export const uploadCSV = async (file: File, fileName: string): Promise<string | null> => {
  try {
    // Validate file type
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_CSV_EXTENSIONS.includes(fileExtension)) {
      throw new Error('Invalid file type. Please upload a CSV file.');
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size exceeds the maximum allowed limit (10 MB).');
    }

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('csv-imports')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading file:', error);
      throw error;
    }

    return data.path;
  } catch (error) {
    console.error('Error in uploadCSV:', error);
    throw error;
  }
};

/**
 * Create an import log record in the database
 */
export const createImportLog = async (
  fileName: string,
  originalFileName: string,
  userId: string,
  overwriteExisting: boolean
): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('agreement_imports')
      .insert({
        file_name: fileName,
        original_file_name: originalFileName,
        created_by: userId,
        status: 'pending',
        row_count: 0,
        processed_count: 0,
        error_count: 0,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating import log:', error);
      throw error;
    }

    return data?.id || null;
  } catch (error) {
    console.error('Error in createImportLog:', error);
    throw error;
  }
};

/**
 * Parse and preview the first few rows of a CSV file
 */
export const previewAgreementCSV = async (file: File): Promise<{ headers: string[]; rows: string[][] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        if (!event.target || typeof event.target.result !== 'string') {
          throw new Error('Failed to read file');
        }

        const csvContent = event.target.result;
        const lines = csvContent.split('\n');
        
        if (lines.length <= 1) {
          throw new Error('CSV file appears to be empty or invalid');
        }

        const headers = lines[0].split(',').map(header => header.trim().replace(/^"(.*)"$/, '$1'));
        
        // Get up to 5 rows for preview
        const previewRowCount = Math.min(5, lines.length - 1);
        const rows: string[][] = [];
        
        for (let i = 1; i <= previewRowCount; i++) {
          if (lines[i].trim()) {
            // Basic CSV parsing (doesn't handle quoted commas properly)
            const cells = lines[i].split(',').map(cell => cell.trim().replace(/^"(.*)"$/, '$1'));
            rows.push(cells);
          }
        }

        resolve({ headers, rows });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read the file'));
    };

    reader.readAsText(file);
  });
};

/**
 * Download a CSV file with agreement data
 */
export const downloadCSV = (data: any[], filename: string = "export.csv"): void => {
  // Return early if no data
  if (!data || data.length === 0) {
    console.error('No data provided for CSV download');
    return;
  }

  try {
    // Get headers from the first object
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    const csvContent = [
      // Headers row
      headers.join(','),
      // Data rows
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle null, undefined, and format other values
          if (value === null || value === undefined) return '';
          
          // Format dates
          if (value instanceof Date) {
            return `"${value.toISOString()}"`;
          }
          
          // Escape strings with commas
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          
          return String(value);
        }).join(',')
      )
    ].join('\n');

    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error creating CSV download:', error);
  }
};
