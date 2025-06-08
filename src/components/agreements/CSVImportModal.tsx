
import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useDropzone } from 'react-dropzone';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any[]) => void;
}

const CSVImportModal: React.FC<CSVImportModalProps> = ({
  isOpen,
  onClose,
  onImport
}) => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const { toast } = useToast();

  const handleFileUpload = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        setUploadError('Please upload a CSV file');
        return;
      }
      
      setCsvFile(file);
      setUploadError(null);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
          const lines = text.split('\n');
          const headers = lines[0].split(',');
          const data: any[] = [];

          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length === headers.length) {
              const item: { [key: string]: string } = {};
              for (let j = 0; j < headers.length; j++) {
                item[headers[j].trim()] = values[j].trim();
              }
              data.push(item);
            }
          }
          setParsedData(data);
        }
      };
      reader.readAsText(file);
    }
  }, []);

  const {getRootProps, getInputProps, isDragActive} = useDropzone({
    onDrop: handleFileUpload,
    accept: {
      'text/csv': ['.csv'],
    },
    multiple: false,
  });

  const handleImport = () => {
    if (parsedData.length > 0) {
      onImport(parsedData);
      toast({
        title: "CSV Imported",
        description: "Data has been successfully imported.",
      });
      onClose();
    } else {
      toast({
        title: "No Data to Import",
        description: "Please upload a CSV file with data.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Agreements from CSV</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div {...getRootProps()} className="dropzone border-2 border-dashed rounded-md p-4 cursor-pointer">
            <input {...getInputProps()} />
            {
              isDragActive ?
                <p>Drop the files here ...</p> :
                <p>Drag 'n' drop a CSV file here, or click to select file</p>
            }
            {uploadError && <p className="text-red-500">{uploadError}</p>}
          </div>
          {csvFile && (
            <div className="mt-4">
              <p>Selected file: {csvFile.name}</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleImport}>
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CSVImportModal;
