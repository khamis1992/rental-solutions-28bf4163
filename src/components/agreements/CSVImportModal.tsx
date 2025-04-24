
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, AlertTriangle, FileUp, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';

interface CSVImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

export const CSVImportModal = ({ open, onOpenChange, onImportComplete }: CSVImportModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast({
          title: 'Invalid file format',
          description: 'Please select a CSV file',
          variant: 'destructive',
        });
        return;
      }
      setFile(selectedFile);
      setUploadStatus('idle');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please select a CSV file to import',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploading(true);
      setUploadStatus('uploading');
      setProgress(10);

      // Upload file to Supabase storage
      const fileName = `imports/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('agreement-imports')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      setProgress(50);
      setUploadStatus('processing');

      // Trigger the import process
      const { data, error } = await supabase.functions.invoke('process-agreement-imports', {
        body: { filePath: fileName },
      });

      if (error) {
        throw error;
      }

      setProgress(100);
      setUploadStatus('success');
      
      toast({
        title: 'Import started',
        description: 'Your file has been uploaded and the import process has started.',
      });

      setTimeout(() => {
        setUploading(false);
        setFile(null);
        onOpenChange(false);
        if (onImportComplete) onImportComplete();
      }, 2000);
    } catch (error) {
      console.error('Import error:', error);
      setUploadStatus('error');
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import Agreements</DialogTitle>
          <DialogDescription>
            Upload a CSV file containing agreement data to import into the system.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="csvFile">CSV File</Label>
            <div className="flex items-center gap-2">
              <Input
                id="csvFile"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </div>
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {uploadStatus !== 'idle' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {uploadStatus === 'uploading' && 'Uploading...'}
                  {uploadStatus === 'processing' && 'Processing file...'}
                  {uploadStatus === 'success' && 'Import complete!'}
                  {uploadStatus === 'error' && 'Import failed'}
                </span>
                <span className="text-sm text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              
              {uploadStatus === 'success' && (
                <div className="flex items-center gap-2 text-green-600 mt-2">
                  <Check className="h-4 w-4" />
                  <span className="text-sm">File processed successfully</span>
                </div>  
              )}
              
              {uploadStatus === 'error' && (
                <div className="flex items-center gap-2 text-red-600 mt-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">There was an error processing your file</span>
                </div>  
              )}
            </div>
          )}

          <div className="bg-muted rounded-md p-3">
            <h4 className="font-medium text-sm mb-2">CSV Format Requirements:</h4>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>• First row must contain column headers</li>
              <li>• Required columns: customer_id, vehicle_id, start_date, end_date</li>
              <li>• Dates should be in YYYY-MM-DD format</li>
              <li>• Use UTF-8 encoding for the CSV file</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!file || uploading}>
            {uploading ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Uploading...
              </>
            ) : (
              <>
                <FileUp className="mr-2 h-4 w-4" />
                Import
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
