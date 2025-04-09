
import { useState, useCallback } from 'react';

interface UseDownloadReturn {
  download: (blob: Blob, filename: string) => void;
  isDownloading: boolean;
}

export const useDownload = (): UseDownloadReturn => {
  const [isDownloading, setIsDownloading] = useState(false);
  
  const download = useCallback((blob: Blob, filename: string) => {
    setIsDownloading(true);
    try {
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary anchor element
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      
      // Append to the document and trigger download
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setIsDownloading(false);
    }
  }, []);
  
  return { download, isDownloading };
};
