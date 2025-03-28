
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
  
  // Create a blob with the CSV content
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
 * Parse a CSV file to an array of objects
 * @param file The File object to parse
 * @param headerMap Map of CSV headers to object properties
 * @returns Promise resolving to array of parsed objects
 */
export function parseCSVFile<T>(file: File, headerMap: Record<string, string>): Promise<T[]> {
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
