import { prepareArabicText, containsArabic } from './arabic-text-utils';

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

  // Create a CSV file with headers only
  const csvContent = `${headers}\n`;

  // Add UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

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
 * Parse a CSV file to an array of objects
 * Type-safe version to avoid deep type instantiation errors
 * 
 * @param file The File object to parse
 * @param headerMap Map of CSV headers to object properties
 * @returns Promise resolving to array of parsed objects
 */
export function parseCSVFile<T extends Record<string, any>>(
  file: File, 
  headerMap: Record<string, keyof T & string>
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const csvText = event.target?.result as string;
        const lines = csvText.split('\n').filter(line => line.trim() !== '');

        // Extract and validate headers
        const headers = lines[0].split(',').map(header => header.trim());

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

          // Create object using headerMap
          const obj = {} as any;

          headers.forEach((header, index) => {
            const mappedKey = headerMap[header];
            if (mappedKey && values[index] !== undefined) {
              obj[mappedKey] = values[index].replace(/^"|"$/g, ''); // Remove surrounding quotes
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

    reader.readAsText(file);
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

  const stringValue = String(value);

  // If the value contains quotes, commas, or newlines, wrap it in quotes and escape existing quotes
  if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}


import { prepareArabicText, containsArabic } from './arabic-text-utils';

export function encodeCSVText(text: string): string {
  if (!text) return '';

  // Handle Arabic text
  if (containsArabic(text)) {
    // Ensure proper encoding
    const encoded = new TextEncoder().encode(text);
    return new TextDecoder('utf-8').decode(encoded);
  }
  return text;
}

export function generateCSV(data: Record<string, any>[]): string {
  if (!data || data.length === 0) return '';

  // Add BOM for UTF-8
  let csv = '\ufeff';

  // Get headers
  const headers = Object.keys(data[0]);
  csv += headers.join(',') + '\n';

  // Add data rows
  data.forEach(item => {
    const row = headers.map(header => {
      const value = item[header] === null || item[header] === undefined ? '' : item[header];
      const processedValue = encodeCSVText(String(value));

      // Escape quotes and wrap in quotes if contains comma or quote
      if (processedValue.includes(',') || processedValue.includes('"')) {
        return `"${processedValue.replace(/"/g, '""')}"`;
      }
      return processedValue;
    });

    csv += row.join(',') + '\n';
  });

  return csv;
}

export function downloadCSV(data: Record<string, any>[], filename: string): void {
  const csv = generateCSV(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}