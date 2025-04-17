
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, FileUp, Download, Check, Loader2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { customerCSVFields, customerCSVMap } from '@/lib/validation-schemas/customer';
import { downloadCSVTemplate } from '@/utils/csv-utils';

interface CSVImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

export function CSVImportModal({ open, onOpenChange, onImportComplete }: CSVImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
      'application/csv': ['.csv'],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
        setError(null);
      }
    },
  });

  const handleDownloadTemplate = () => {
    downloadCSVTemplate(customerCSVFields, 'customer_import_template.csv');
    toast.success('Template downloaded successfully');
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a CSV file to import');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // Upload the file to Supabase Storage
      const fileName = `${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('customer-imports')
        .upload(fileName, file);

      if (uploadError) {
        throw new Error(`Error uploading file: ${uploadError.message}`);
      }

      // Create import log entry
      const { data: importLog, error: logError } = await supabase
        .from('customer_import_logs')
        .insert({
          file_name: fileName,
          original_file_name: file.name,
          status: 'pending',
          created_by: (await supabase.auth.getUser()).data.user?.id,
          mapping_used: customerCSVMap
        })
        .select()
        .single();

      if (logError) {
        throw new Error(`Error creating import log: ${logError.message}`);
      }

      // Call the process-customer-imports function to start processing
      const { error: processError } = await supabase.functions.invoke('process-customer-imports', {
        body: { importId: importLog.id }
      });

      if (processError) {
        console.warn('Error invoking function, but import is queued:', processError);
        // We'll still consider this a success as the record is created and will be processed by scheduler
      }
      
      toast.success('File uploaded successfully', {
        description: 'Your file is being processed. You will be notified when complete.'
      });
      
      onImportComplete();
      onOpenChange(false);
      setFile(null);
    } catch (err) {
      console.error('Import error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setFile(null);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Customers</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import customer data in bulk.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Button
            variant="outline"
            onClick={handleDownloadTemplate}
            className="w-full flex items-center justify-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Download CSV Template
          </Button>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/30'
            }`}
          >
            <input {...getInputProps()} />
            <FileUp className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {isDragActive
                ? 'Drop the file here...'
                : 'Drag & drop a CSV file here, or click to select'}
            </p>
            {file && (
              <div className="mt-4 flex items-center justify-center px-3 py-2 bg-muted rounded">
                <Check className="h-4 w-4 mr-2 text-green-500" />
                <span className="text-sm font-medium">{file.name}</span>
              </div>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex space-x-2 sm:justify-between">
          <Button variant="outline" onClick={handleCancel} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!file || uploading}>
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              'Import Customers'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
