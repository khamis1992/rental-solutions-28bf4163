
import React, { useState } from 'react';
import { FileUploader } from '@/components/FileUploader';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';

interface CSVImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

export const CSVImportModal = ({
  open,
  onOpenChange,
  onImportComplete,
}: CSVImportModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { user } = useAuth();

  const handleFileChange = (file: File | null) => {
    setFile(file);
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    setIsUploading(true);
    setUploadProgress(10);

    try {
      // Upload the file to storage
      const timestamp = new Date().getTime();
      const fileExt = file.name.split('.').pop();
      const fileName = `imports/${timestamp}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('csv-imports')
        .upload(fileName, file);

      if (uploadError) throw uploadError;
      setUploadProgress(40);

      // Get the file URL
      const { data: urlData } = supabase.storage
        .from('csv-imports')
        .getPublicUrl(fileName);

      setUploadProgress(60);

      // Create import record 
      const importData = {
        file_name: fileName,
        original_file_name: file.name,
        status: 'pending', 
        created_by: user.id,
        mapping_used: {} // Empty object as placeholder
      }; 

      const { data: importRecord, error: importError } = await supabase
        .from('customer_import_logs')
        .insert(importData)
        .select()
        .single();

      if (importError) throw importError;
      setUploadProgress(100);

      toast.success('File uploaded successfully, processing will begin shortly');
      
      // Optional callback when import is complete
      if (onImportComplete) {
        onImportComplete();
      }
      
      // Close the modal
      onOpenChange(false);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
      setFile(null);
      setUploadProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Customer CSV</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {isUploading ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <Progress value={uploadProgress} />
              <p className="text-center text-sm text-muted-foreground">
                Uploading and processing your file...
              </p>
            </div>
          ) : (
            <>
              <FileUploader
                accept=".csv"
                onChange={handleFileChange}
                maxSize={5 * 1024 * 1024} // 5MB
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleUpload}
                  disabled={!file || isUploading}
                >
                  Upload & Process
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
