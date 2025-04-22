import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { uploadCSV, createImportLog, previewAgreementCSV } from '@/utils/agreement-import-utils';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"

interface CSVImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

export function CSVImportModal({ open, onOpenChange, onImportComplete }: CSVImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewData, setPreviewData] = useState<{headers: string[], rows: string[][]}>({headers: [], rows: []});
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const { getUser } = useAuth();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      try {
        const preview = await previewAgreementCSV(selectedFile);
        setPreviewData(preview);
      } catch (error) {
        console.error("Error previewing CSV:", error);
        toast.error("Failed to preview CSV file");
      }
    }
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(10);

    try {
      const user = await getUser();
      if (!user) {
        toast.error("You must be logged in to upload files");
        return;
      }

      setUploadProgress(20);
      
      // Generate a unique file name
      const timestamp = Date.now();
      const safeOriginalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${timestamp}-${safeOriginalName}`;
      
      setUploadProgress(40);
      
      // Upload the file to Supabase storage
      const filePath = await uploadCSV(file, fileName);
      if (!filePath) {
        throw new Error("Failed to upload file");
      }
      
      setUploadProgress(60);

      // Create a record in the import logs table
      const importId = await createImportLog(
        fileName,
        file.name,
        user.id,
        overwriteExisting
      );
      
      if (!importId) {
        throw new Error("Failed to create import log");
      }
      
      setUploadProgress(80);
      
      // Trigger the Edge Function to process the CSV
      const { error: functionError } = await supabase.functions.invoke('process-agreement-imports', {
        body: { importId, filePath }
      });
      
      if (functionError) {
        throw new Error(`Failed to start import process: ${functionError.message}`);
      }
      
      setUploadProgress(100);
      toast.success("File uploaded successfully. Processing has started...");
      
      // Close the modal and trigger the callback
      onClose();
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (error) {
      console.error("Error during file upload:", error);
      // Update this line to handle the unknown error type
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }
    await uploadFile(file);
  };

  const onClose = () => {
    onOpenChange(false);
    setFile(null);
    setUploadProgress(0);
    setPreviewData({headers: [], rows: []});
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Import Agreements from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import agreements.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="file" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed">
              CSV File
            </Label>
            <Input
              id="file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>
          {uploadProgress > 0 && (
            <Progress value={uploadProgress} className="w-full" />
          )}
          {previewData.headers.length > 0 && (
            <div className="border rounded-md">
              <Table>
                <TableCaption>Preview of the first 5 rows</TableCaption>
                <TableHeader>
                  <TableRow>
                    {previewData.headers.map((header) => (
                      <TableHead key={header}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.rows.map((row, i) => (
                    <TableRow key={i}>
                      {row.map((cell, j) => (
                        <TableCell key={j}>{cell}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="overwrite" 
              checked={overwriteExisting}
              onCheckedChange={(checked) => setOverwriteExisting(!!checked)}
              disabled={isUploading}
            />
            <Label htmlFor="overwrite">Overwrite existing agreements</Label>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isUploading || !file}>
              {isUploading ? 'Uploading...' : 'Upload CSV'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
