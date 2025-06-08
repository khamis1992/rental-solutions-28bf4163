import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import Dropzone from 'react-dropzone';
import type { DropzoneOptions } from 'react-dropzone';

interface CSVImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

export const CSVImportModal: React.FC<CSVImportModalProps> = ({ open, onOpenChange, onImportComplete }) => {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const [delimiter, setDelimiter] = useState(',');

  const handleSubmit = useCallback(async () => {
    if (!file || !user) {
      toast({
        title: "Error",
        description: "Please select a file to upload.",
      });
      return;
    }

    setProcessing(true);

    try {
      const timestamp = new Date().getTime();
      const fileExt = file.name.split('.').pop();
      const fileName = `agreement-import-${timestamp}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('agreement-imports')
        .upload(fileName, file);
        
      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }
      
      const { data: importData, error: importError } = await supabase
        .from('agreement_imports')
        .insert({
          file_name: fileName,
          original_name: file.name,
          created_by: user.id,
          status: 'pending',
          delimiter: delimiter
        })
        .select()
        .single();
        
      if (importError) {
        throw new Error(`Import log creation failed: ${importError.message}`);
      }
      
      const { data: processData, error: processError } = await supabase.functions.invoke(
        'process-agreement-imports', 
        { 
          body: { importId: importData.id } 
        }
      );
      
      if (processError) {
        throw new Error(`Processing failed: ${processError.message}`);
      }
      
      toast({
        title: "Success",
        description: `Agreements imported successfully. Processed: ${processData.processed}, Errors: ${processData.errors}`,
      });
      
      onImportComplete();
      onOpenChange(false);
      setFile(null);
    } catch (error: any) {
      console.error("Import error:", error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setProcessing(false);
    }
  }, [file, user, delimiter, toast, onImportComplete, onOpenChange]);

  // Update the dropzone options with proper typing
  const dropzoneOptions = {
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv', '.xls']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Agreements from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file containing agreement data to import into the system.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="delimiter" className="text-right">
              Delimiter
            </Label>
            <Input
              id="delimiter"
              defaultValue=","
              className="col-span-3"
              value={delimiter}
              onChange={(e) => setDelimiter(e.target.value)}
            />
          </div>
          <Dropzone {...dropzoneOptions}>
            {({getRootProps, getInputProps}) => (
              <section>
                <div {...getRootProps()} className="border-2 border-dashed rounded-md p-4 cursor-pointer">
                  <input {...getInputProps()} />
                  <p className="text-sm text-muted-foreground">
                    Drag 'n' drop some files here, or click to select files
                  </p>
                  {file && (
                    <aside>
                      <h4>Files</h4>
                      <ul>{file.name}</ul>
                    </aside>
                  )}
                </div>
              </section>
            )}
          </Dropzone>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={processing}>
            {processing ? "Importing..." : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
