
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CSVImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

const CSVImportModal: React.FC<CSVImportModalProps> = ({
  open,
  onOpenChange,
  onImportComplete
}) => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile);
    } else {
      toast({
        title: "Invalid file format",
        description: "Please select a CSV file",
        variant: "destructive",
      });
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to import",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Upload the file to storage
      const fileName = `imports/customers/${Date.now()}-${file.name}`;
      const { data: fileData, error: fileError } = await supabase.storage
        .from('customer-imports')
        .upload(fileName, file);

      if (fileError) {
        throw fileError;
      }

      // Get the URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('customer-imports')
        .getPublicUrl(fileName);

      const fileUrl = urlData.publicUrl;

      // Create a record in the database
      const { data: importLog, error: importLogError } = await supabase
        .from('customer_import_logs')
        .insert({
          file_name: fileName,
          original_file_name: file.name,
          status: 'pending',
          created_by: supabase.auth.getUser().data?.user?.id || null,
          mapping_used: {
            fullName: 'Full Name',
            email: 'Email',
            phoneNumber: 'Phone Number',
          }
        })
        .select()
        .single();

      if (importLogError) {
        throw importLogError;
      }

      toast({
        title: "File uploaded successfully",
        description: "Your file is being processed. You'll be notified once it's complete.",
      });

      // Trigger the Edge Function to process the CSV
      const { data: functionData, error: functionError } = await supabase.functions
        .invoke('process-customer-imports', {
          body: {
            importId: importLog?.id,
            fileUrl
          }
        });

      if (functionError) {
        console.error("Error invoking function:", functionError);
      }

      // Close the modal and refresh the list
      onOpenChange(false);
      if (onImportComplete) {
        onImportComplete();
      }

    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "There was an error uploading your file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setFile(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import Customers</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import customer data. The file should have columns for name, email, and phone number.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="csvFile">CSV File</Label>
            <Input 
              id="csvFile"
              type="file" 
              accept=".csv"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Make sure your CSV has the following columns: Full Name, Email, Phone Number
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={isUploading || !file}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CSVImportModal;
