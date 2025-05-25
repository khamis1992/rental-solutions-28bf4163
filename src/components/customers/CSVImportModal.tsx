import React, { useState, useCallback } from 'react';
import { useDropzone, DropzoneOptions } from 'react-dropzone';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { FileUp } from "lucide-react"
import { toast } from 'sonner';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File) => void;
}

export function CSVImportModal({ isOpen, onClose, onImport }: CSVImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const dropzoneOptions: DropzoneOptions = {
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    },
    maxFiles: 1,
    onDrop,
    multiple: false
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone(dropzoneOptions);

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file to upload.");
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Simulate upload progress
      const interval = setInterval(() => {
        setProgress((prevProgress) => {
          const newProgress = prevProgress + 10;
          if (newProgress >= 100) {
            clearInterval(interval);
            return 100;
          }
          return newProgress;
        });
      }, 200);

      // Simulate actual upload process
      await new Promise(resolve => setTimeout(resolve, 2000));

      onImport(file);
      toast.success(`${file.name} uploaded successfully!`);
      onClose();
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      clearInterval(interval);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Customers from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import customer data.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-md p-6 cursor-pointer ${isDragActive ? 'border-primary' : 'border-muted-foreground'
              }`}
          >
            <input {...getInputProps()} />
            <div className="text-center">
              {isDragActive ? (
                <p>Drop the file here ...</p>
              ) : (
                <p>
                  Drag 'n' drop a CSV file here, or click to select a file
                </p>
              )}
            </div>
          </div>

          {file && (
            <div className="flex items-center justify-between">
              <p className="text-sm">Selected File: {file.name}</p>
              <Button variant="outline" size="sm" onClick={() => setFile(null)}>
                Remove
              </Button>
            </div>
          )}

          {uploading && (
            <Progress value={progress} className="w-full" />
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={!file || uploading}
          >
            {uploading ? (
              <>
                <FileUp className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <FileUp className="mr-2 h-4 w-4" />
                Upload File
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
