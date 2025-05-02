
import { useState } from 'react';
import { toast } from 'sonner';

/**
 * Hook for handling file uploads
 */
export function useUpload() {
  const [uploading, setUploading] = useState(false);

  /**
   * Handle file upload to a specified endpoint
   * @param options Upload options including URL, file, and callback functions
   */
  const handleFileUpload = async ({
    url,
    file,
    onSuccess,
    onError,
    toast: toastInstance
  }: {
    url: string;
    file: File;
    onSuccess?: (data: any) => void;
    onError?: (error: any) => void;
    toast?: any;
  }) => {
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (toastInstance) {
        toastInstance({
          title: 'Upload successful',
          description: 'File has been uploaded successfully',
        });
      } else {
        toast.success('File uploaded successfully');
      }
      
      if (onSuccess) onSuccess(data);
      return data;
    } catch (error) {
      console.error('Upload error:', error);
      
      if (toastInstance) {
        toastInstance({
          title: 'Upload failed',
          description: error instanceof Error ? error.message : 'Unknown error',
          variant: 'destructive',
        });
      } else {
        toast.error(`Failed to upload: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      if (onError) onError(error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploading,
    handleFileUpload
  };
}
