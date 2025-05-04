
import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useDropzone } from 'react-dropzone';
import { FileText, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import * as Papa from 'papaparse';

interface CSVImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

// Change from named export to default export
const CSVImportModal = ({ open, onOpenChange, onImportComplete }: CSVImportModalProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [mappings, setMappings] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
  });
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    setSelectedFile(file);

    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          setCsvHeaders(results.data[0] as string[]);
        }
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to parse CSV file. Please ensure it's a valid CSV."
        });
      }
    });
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
  });

  const handleMappingChange = (field: string, header: string) => {
    setMappings(prev => ({ ...prev, [field]: header }));
  };
  
  const handleImport = async () => {
    if (!selectedFile) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a CSV file to import."
      });
      return;
    }
    
    if (!mappings.fullName || !mappings.email || !mappings.phoneNumber) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please map all required fields before importing."
      });
      return;
    }
    
    try {
      setUploading(true);
      
      // Get the current user's ID from Supabase
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'anonymous';

      // Create import log
      const { data: importLog, error: importLogError } = await supabase
        .from('customer_import_logs')
        .insert({
          file_name: selectedFile.name,
          original_file_name: selectedFile.name,
          status: 'pending',
          created_by: userId,
          mapping_used: {
            fullName: mappings.fullName,
            email: mappings.email,
            phoneNumber: mappings.phoneNumber,
          }
        })
        .select()
        .single();
      
      if (importLogError) throw importLogError;
      
      // Process the CSV file
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const csvData = results.data as any[];
          const totalRecords = csvData.length;
          let processedRecords = 0;
          let failedRecords = 0;
          const importId = importLog?.id;
          
          if (!importId) {
            throw new Error('Failed to get import log ID');
          }
          
          for (const row of csvData) {
            try {
              const fullName = row[mappings.fullName];
              const email = row[mappings.email];
              const phoneNumber = row[mappings.phoneNumber];
              
              if (!fullName || !email || !phoneNumber) {
                console.warn('Skipping row due to missing data:', row);
                failedRecords++;
                continue;
              }
              
              const { error: insertError } = await supabase
                .from('customers')
                .insert({
                  full_name: fullName,
                  email: email,
                  phone: phoneNumber,
                  created_by: userId,
                });
              
              if (insertError) {
                console.error('Error inserting customer:', insertError);
                failedRecords++;
              } else {
                processedRecords++;
              }
            } catch (error: any) {
              console.error('Error processing row:', error);
              failedRecords++;
            } finally {
              // Update import log progress
              await supabase
                .from('customer_import_logs')
                .update({
                  processed_records: processedRecords,
                  failed_records: failedRecords,
                })
                .eq('id', importId);
            }
          }
          
          // Finalize import log
          const finalStatus = failedRecords > 0 ? 'failed' : 'completed';
          await supabase
            .from('customer_import_logs')
            .update({
              status: finalStatus,
              total_records: totalRecords,
              processed_records: processedRecords,
              failed_records: failedRecords,
            })
            .eq('id', importId);
            
          toast({
            title: "Import Complete",
            description: `Successfully imported ${processedRecords} customers. ${failedRecords} records failed.`,
          });
          
          if (onImportComplete) {
            onImportComplete();
          }
          
          onOpenChange(false);
        },
        error: (error) => {
          console.error('CSV processing error:', error);
          toast({
            variant: "destructive",
            title: "Import failed",
            description: "Failed to process CSV file. Please ensure it's a valid CSV."
          });
        }
      });
      
      // Upload the file to storage
      if (importLog?.id) {
        const { error: fileUploadError } = await supabase.storage
          .from('import-files')
          .upload(`customers/${importLog.id}/${selectedFile.name}`, selectedFile);
          
        if (fileUploadError) {
          console.error('File upload error:', fileUploadError);
        }
      }
      
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        variant: "destructive",
        title: "Import failed",
        description: error.message || "An unexpected error occurred"
      });
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Import Customers from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file containing customer data.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-border'
            }`}
          >
            <input {...getInputProps()} />
            {selectedFile ? (
              <p className="text-sm">File selected: {selectedFile.name}</p>
            ) : isDragActive ? (
              <p className="text-sm">Drop the file here...</p>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <FileText className="h-6 w-6 text-muted-foreground mb-2" />
                <p className="text-sm">
                  Drag & drop a CSV file here, or click to select
                </p>
              </div>
            )}
          </div>
          {selectedFile && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Map CSV Headers to Fields</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <select
                    id="fullName"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-popover file:text-popover-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={mappings.fullName}
                    onChange={(e) => handleMappingChange('fullName', e.target.value)}
                  >
                    <option value="">Select Header</option>
                    {csvHeaders.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <select
                    id="email"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-popover file:text-popover-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={mappings.email}
                    onChange={(e) => handleMappingChange('email', e.target.value)}
                  >
                    <option value="">Select Header</option>
                    {csvHeaders.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <select
                    id="phoneNumber"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-popover file:text-popover-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={mappings.phoneNumber}
                    onChange={(e) => handleMappingChange('phoneNumber', e.target.value)}
                  >
                    <option value="">Select Header</option>
                    {csvHeaders.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleImport}
            disabled={uploading || !selectedFile}
            className="ml-2"
          >
            {uploading ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              "Import Customers"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Add this default export
export default CSVImportModal;
// Also maintain the named export for flexibility
export { CSVImportModal };
