
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileUp, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  accept?: string | Record<string, string[]>;
  onChange: (file: File | null) => void;
  maxSize?: number;
  className?: string;
}

export function FileUploader({ 
  accept = {
    'text/csv': ['.csv'],
    'application/vnd.ms-excel': ['.csv'],
  },
  onChange, 
  maxSize = 5 * 1024 * 1024, // 5MB default
  className
}: FileUploaderProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    if (acceptedFiles.length > 0) {
      onChange(acceptedFiles[0]);
    }
  }, [onChange]);

  const onDropRejected = useCallback((fileRejections: any[]) => {
    const rejection = fileRejections[0];
    if (!rejection) return;

    if (rejection.errors.some((err: any) => err.code === 'file-too-large')) {
      setError(`File is too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB.`);
    } else if (rejection.errors.some((err: any) => err.code === 'file-invalid-type')) {
      setError('Invalid file type. Please upload a CSV file.');
    } else {
      setError('There was an error with the file. Please try again.');
    }
    
    onChange(null);
  }, [maxSize, onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: typeof accept === 'string' ? { 'text/csv': [accept] } : accept,
    maxSize,
    multiple: false
  });

  return (
    <div className={cn("space-y-2", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors",
          isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
          error && "border-destructive hover:border-destructive"
        )}
      >
        <input {...getInputProps()} />
        <FileUp className="w-10 h-10 mx-auto text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          {isDragActive
            ? "Drop the CSV file here"
            : "Drag and drop a CSV file, or click to select"
          }
        </p>
      </div>
      
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
