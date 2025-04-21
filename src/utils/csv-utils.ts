/**
 * Utility functions for CSV file operations
 */

/**
 * Generate and download a CSV template file
 * @param fields Array of field names to use as headers
 * @param filename Name of the file to download
 */
export function downloadCSVTemplate(fields: string[], filename: string): void {
  // Generate CSV headers
  const headers = fields.join(',');
  
  // Create a CSV file with headers only and UTF-8 BOM for proper Arabic support
  const BOM = '\uFEFF'; // UTF-8 BOM
  const csvContent = `${BOM}${headers}\n`;
  
  // Create a blob with the CSV content with UTF-8 encoding
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create a URL for the blob
  const url = URL.createObjectURL(blob);
  
  // Create a temporary link to trigger the download
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  
  // Add to document, click and remove to trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  URL.revokeObjectURL(url);
}

/**
 * Helper function to detect Arabic text
 */
export function containsArabicText(text: string): boolean {
  // Arabic Unicode ranges
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return arabicPattern.test(text);
}

/**
 * Helper function to normalize Arabic text for CSV
 */
export function normalizeArabicText(text: string): string {
  // Basic normalization to improve display in CSV readers
  if (typeof text !== 'string') return String(text);
  
  return text
    .replace(/[\u064B-\u065F]/g, ''); // Remove diacritics
}

/**
 * Parse a CSV file to an array of objects
 * Type-safe version to avoid deep type instantiation errors
 * 
 * @param file The File object to parse
 * @param headerMap Map of CSV headers to object properties
 * @returns Promise resolving to array of parsed objects
 */
export function parseCSVFile<T extends Record<string, any>>(
  file: File, 
  headerMap: Record<string, keyof T>
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const csvText = event.target?.result as string;
        const lines = csvText.split('\n').filter(line => line.trim() !== '');
        
        // Handle BOM if present
        let firstLine = lines[0];
        if (firstLine.charCodeAt(0) === 0xFEFF) {
          firstLine = firstLine.substring(1);
          lines[0] = firstLine;
        }
        
        // Extract and validate headers
        const headers = firstLine.split(',').map(header => header.trim());
        
        // Process data rows
        const results: T[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          // Handle quoted values properly
          const values: string[] = [];
          let current = '';
          let inQuotes = false;
          
          for (let j = 0; j < line.length; j++) {
            const char = line[j];
            
            if (char === '"' && (j === 0 || line[j-1] !== '\\')) {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              values.push(current);
              current = '';
            } else {
              current += char;
            }
          }
          
          // Push the last value
          values.push(current);
          
          // Create object using headerMap - handle Arabic text correctly
          const obj = {} as Record<string, any>;
          
          headers.forEach((header, index) => {
            const mappedKey = headerMap[header];
            if (mappedKey && values[index] !== undefined) {
              const value = values[index].replace(/^"|"$/g, ''); // Remove quotes
              obj[mappedKey as string] = value;
            }
          });
          
          results.push(obj as T);
        }
        
        resolve(results);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    // Read file as text with UTF-8 encoding
    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * Preview the first few rows of a CSV file
 * @param file The File object to preview
 * @param maxRows Maximum number of rows to return (default: 5)
 * @returns Promise resolving to array with headers and rows
 */
export function previewCSVFile(file: File, maxRows: number = 5): Promise<{headers: string[], rows: string[][]}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const csvText = event.target?.result as string;
        const lines = csvText.split('\n').filter(line => line.trim() !== '');
        
        if (lines.length === 0) {
          throw new Error('CSV file is empty');
        }
        
        // Extract headers
        const headers = lines[0].split(',').map(header => header.trim());
        
        // Process only the first few rows
        const previewRows: string[][] = [];
        const rowsToProcess = Math.min(maxRows, lines.length - 1);
        
        for (let i = 1; i <= rowsToProcess; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          // Handle quoted values properly
          const values: string[] = [];
          let current = '';
          let inQuotes = false;
          
          for (let j = 0; j < line.length; j++) {
            const char = line[j];
            
            if (char === '"' && (j === 0 || line[j-1] !== '\\')) {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              values.push(current);
              current = '';
            } else {
              current += char;
            }
          }
          
          // Push the last value
          values.push(current);
          
          // Remove surrounding quotes from values
          const cleanedValues = values.map(val => val.replace(/^"|"$/g, ''));
          previewRows.push(cleanedValues);
        }
        
        resolve({
          headers,
          rows: previewRows
        });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsText(file);
  });
}

/**
 * Format a value for CSV export
 * @param value The value to format
 * @returns Properly formatted CSV value
 */
export function formatCSVValue(value: any): string {
  if (value === null || value === undefined) return '';
  
  // Convert to string safely
  const stringValue = String(value);
  
  // Special handling for Arabic text
  if (containsArabicText(stringValue)) {
    const normalizedValue = normalizeArabicText(stringValue);
    // Double escaping quotes is important for Arabic text
    return `"${normalizedValue.replace(/"/g, '""')}"`;
  }
  
  // Regular handling for other values
  if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

/**
 * Generate a CSV file from an array of objects
 * @param data Array of objects to convert to CSV
 * @param headers Optional custom headers (defaults to Object.keys of first item)
 * @returns CSV content as a string
 */
export function generateCSV(data: Record<string, any>[], headers?: string[]): string {
  if (data.length === 0) return '';
  
  // Add UTF-8 BOM for proper Arabic text rendering in Excel
  const BOM = '\uFEFF';
  
  // Use provided headers or extract from first object
  const csvHeaders = headers || Object.keys(data[0]);
  
  // Generate CSV content
  const headerRow = csvHeaders.join(',');
  const rows = data.map(item => 
    csvHeaders.map(header => formatCSVValue(item[header])).join(',')
  );
  
  return BOM + [headerRow, ...rows].join('\n');
}

/**
 * Download data as a CSV file
 * @param data Array of objects to convert to CSV
 * @param filename Name of the file to download
 * @param headers Optional custom headers (defaults to Object.keys of first item)
 */
export function downloadCSV(data: Record<string, any>[], filename: string, headers?: string[]): void {
  const csvContent = generateCSV(data, headers);
  
  // Ensure UTF-8 encoding with BOM for Arabic text support
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}
