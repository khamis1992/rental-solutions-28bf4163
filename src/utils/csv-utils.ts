
import { prepareArabicText, containsArabic } from './arabic-text-utils';

/**
 * Utility functions for CSV file operations with proper Arabic text encoding
 */

/**
 * Encode text for CSV, handling Arabic text properly with UTF-8 encoding
 */
export function encodeCSVText(text: string): string {
  if (!text) return '';
  
  // Convert to UTF-8
  const encoder = new TextEncoder();
  const decoder = new TextDecoder('utf-8');
  const bytes = encoder.encode(text);
  const decodedText = decoder.decode(bytes);
  
  const preparedText = containsArabic(decodedText) ? prepareArabicText(decodedText) : decodedText;
  return preparedText;
}

/**
 * Format a value for CSV export
 */
export function formatCSVValue(value: any): string {
  if (value === null || value === undefined) return '';

  const stringValue = String(value);
  const preparedValue = encodeCSVText(stringValue);

  // Escape quotes and handle special characters
  if (preparedValue.includes('"') || preparedValue.includes(',') || preparedValue.includes('\n')) {
    return `"${preparedValue.replace(/"/g, '""')}"`;
  }

  return preparedValue;
}

/**
 * Generate and download a CSV template file with proper encoding
 */
export function downloadCSVTemplate(fields: string[], filename: string): void {
  const headers = fields.map(field => formatCSVValue(field)).join(',');
  const csvContent = '\ufeff' + headers + '\n'; // Add BOM for UTF-8
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

/**
 * Parse a CSV file to an array of objects
 */
export function parseCSVFile<T extends Record<string, any>>(file: File): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const rows = text.split('\n').map(row => 
          row.split(',').map(cell => encodeCSVText(cell.trim()))
        );
        const headers = rows[0];
        const data = rows.slice(1).map(row => {
          const obj: Record<string, any> = {};
          headers.forEach((header, i) => {
            obj[header] = row[i] || '';
          });
          return obj;
        });
        resolve(data as T[]);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, 'utf-8');
  });
}

/**
 * Preview the first few rows of a CSV file
 */
export function previewCSVFile(file: File, maxRows: number = 5): Promise<{headers: string[], rows: string[][]}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const rows = text.split('\n')
          .slice(0, maxRows + 1)
          .map(row => row.split(',').map(cell => encodeCSVText(cell.trim())));
        resolve({
          headers: rows[0],
          rows: rows.slice(1)
        });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, 'utf-8');
  });
}

/**
 * Generate CSV from data
 */
export function generateCSV(data: Record<string, any>[]): string {
  if (!data || data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.map(header => formatCSVValue(header)).join(','),
    ...data.map(row =>
      headers.map(header => formatCSVValue(row[header])).join(',')
    )
  ];

  return '\ufeff' + csvRows.join('\n'); // Add BOM for Excel compatibility
}

/**
 * Download CSV with proper Arabic text encoding
 */
export function downloadCSV(data: Record<string, any>[], filename: string): void {
  const csv = generateCSV(data);
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
