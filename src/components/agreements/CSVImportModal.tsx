
import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { uploadCSV, createImportLog, downloadAgreementCSVTemplate, checkEdgeFunctionAvailability } from '@/utils/agreement-import-utils';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, FileUp, Download, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface CSVImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

export function CSVImportModal({ open, onOpenChange, onImportComplete }: CSVImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const { user } = useAuth();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
      }
    },
  });

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a CSV file to import');
      return;
    }

    if (!user?.id) {
      toast.error('You must be logged in to import agreements');
      return;
    }

    setIsUploading(true);
    setUploadProgress('uploading');

    try {
      // First check if the edge function is available
      const isEdgeFunctionAvailable = await checkEdgeFunctionAvailability();
      if (!isEdgeFunctionAvailable) {
        toast.error('Import service is currently unavailable. Please try again later.');
        setUploadProgress('error');
        setIsUploading(false);
        return;
      }

      // Generate a unique filename
      const timestamp = new Date().getTime();
      const fileExt = file.name.split('.').pop();
      const fileName = `agreement-import-${timestamp}.${fileExt}`;

      // Upload the file to Supabase Storage
      const filePath = await uploadCSV(file, fileName);
      if (!filePath) {
        setUploadProgress('error');
        setIsUploading(false);
        return;
      }

      // Create an import log entry with overwrite flag
      const importId = await createImportLog(fileName, file.name, user.id, overwriteExisting);
      if (!importId) {
        setUploadProgress('error');
        setIsUploading(false);
        return;
      }

      setUploadProgress('processing');

      console.log('Calling process-agreement-imports function with importId:', importId);
      
      // Call the Edge Function to process the file
      try {
        const { data, error } = await supabase.functions.invoke('process-agreement-imports', {
          body: { 
            importId,
            overwriteExisting 
          },
        });

        if (error) {
          console.error('Error processing import:', error);
          toast.error(`Import processing failed: ${error.message}`);
          setUploadProgress('error');
        } else {
          const resultMessage = `Import submitted for processing: ${data?.processed || 0} agreements will be ${overwriteExisting ? 'imported/updated' : 'imported'}`;
          toast.success(resultMessage);
          console.log('Import result:', data);
          setUploadProgress('success');
          onImportComplete();
        }
      } catch (fnError: any) {
        console.error('Exception calling edge function:', fnError);
        toast.error(`Failed to process import: ${fnError.message}`);
        setUploadProgress('error');
      }
    } catch (err) {
      console.error('Unexpected error during import:', err);
      toast.error('An unexpected error occurred during import');
      setUploadProgress('error');
    } finally {
      setIsUploading(false);
      // Close the modal after a short delay to show the success/error state
      setTimeout(() => {
        onOpenChange(false);
        setFile(null);
        setUploadProgress('idle');
        setOverwriteExisting(false);
      }, 2000);
    }
  };

  const handleDownloadTemplate = () => {
    downloadAgreementCSVTemplate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Agreements from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to create multiple agreements at once.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert variant="default" className="bg-blue-50">
            <Info className="h-4 w-4" />
            <AlertDescription>
              For Customer ID, you can use UUID, Email, Phone Number, or Full Name.
              For Vehicle ID, you can use UUID, License Plate, or VIN.
            </AlertDescription>
          </Alert>
          
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}
          >
            <input {...getInputProps()} disabled={isUploading} />
            {uploadProgress === 'idle' && (
              <>
                <FileUp className="w-10 h-10 mx-auto text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  {isDragActive
                    ? 'Drop the CSV file here'
                    : 'Drag and drop a CSV file, or click to select'}
                </p>
              </>
            )}
            
            {uploadProgress === 'uploading' && (
              <div className="flex flex-col items-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="mt-2">Uploading file...</p>
              </div>
            )}
            
            {uploadProgress === 'processing' && (
              <div className="flex flex-col items-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="mt-2">Processing agreements...</p>
              </div>
            )}
            
            {uploadProgress === 'success' && (
              <div className="flex flex-col items-center">
                <CheckCircle className="w-10 h-10 text-green-500" />
                <p className="mt-2">Import successful!</p>
              </div>
            )}
            
            {uploadProgress === 'error' && (
              <div className="flex flex-col items-center">
                <AlertCircle className="w-10 h-10 text-destructive" />
                <p className="mt-2">Import failed. Please try again.</p>
              </div>
            )}
          </div>

          {file && uploadProgress === 'idle' && (
            <div className="flex items-center justify-between bg-muted p-3 rounded-md">
              <div className="flex-1 truncate">
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setFile(null)}
                disabled={isUploading}
              >
                Remove
              </Button>
            </div>
          )}

          {file && uploadProgress === 'idle' && (
            <div className="flex items-center space-x-2 mt-4">
              <Checkbox 
                id="overwrite" 
                checked={overwriteExisting}
                onCheckedChange={(checked) => setOverwriteExisting(checked === true)}
              />
              <Label htmlFor="overwrite" className="text-sm text-muted-foreground cursor-pointer">
                Overwrite existing agreements with matching identifiers
              </Label>
            </div>
          )}

          <div className="text-sm mt-2">
            <p className="text-muted-foreground">
              Need a template? 
              <Button
                variant="link"
                size="sm"
                className="px-2 h-auto"
                onClick={handleDownloadTemplate}
              >
                <Download className="h-3 w-3 mr-1" /> Download Template
              </Button>
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:justify-between mt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={!file || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Import Agreements'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
