
import { useState } from 'react';
import { toast } from 'sonner';

/**
 * Hook for handling file downloads
 */
export function useDownload() {
  const [downloading, setDownloading] = useState(false);

  /**
   * Download a file from a blob
   * @param blob The blob to download
   * @param filename The filename to save as
   */
  const downloadBlob = (blob: Blob, filename: string) => {
    setDownloading(true);
    
    try {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Downloaded ${filename}`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Failed to download: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDownloading(false);
    }
  };

  /**
   * Download data as a JSON file
   * @param data The data to download
   * @param filename The filename to save as
   */
  const downloadJSON = (data: any, filename: string) => {
    try {
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      downloadBlob(blob, `${filename}.json`);
    } catch (error) {
      console.error('JSON download error:', error);
      toast.error(`Failed to prepare JSON for download: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  /**
   * Download data as a CSV file
   * @param data Array of objects to convert to CSV
   * @param filename The filename to save as
   */
  const downloadCSV = (data: Record<string, any>[], filename: string) => {
    try {
      if (!data.length) {
        toast.error('No data to download');
        return;
      }

      // Get headers from first object
      const headers = Object.keys(data[0]);
      
      // Convert objects to CSV rows
      const csvRows = [
        // Header row
        headers.join(','),
        // Data rows
        ...data.map(row => 
          headers.map(header => {
            const cell = row[header];
            // Handle special cases (quotes, commas) for CSV format
            if (cell === null || cell === undefined) return '';
            const value = cell.toString();
            // Escape quotes and wrap in quotes if contains comma or quote
            if (value.includes(',') || value.includes('"')) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ];
      
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      downloadBlob(blob, `${filename}.csv`);
    } catch (error) {
      console.error('CSV download error:', error);
      toast.error(`Failed to prepare CSV for download: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return {
    downloading,
    downloadBlob,
    downloadJSON,
    downloadCSV
  };
}
