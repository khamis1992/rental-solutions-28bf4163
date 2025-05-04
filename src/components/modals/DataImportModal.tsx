
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { useDropzone } from 'react-dropzone';
import { Upload, File, AlertTriangle, Check } from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../ui/table';
import { Progress } from '../ui/progress';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Papa from 'papaparse';
import { useNavigate } from 'react-router-dom';

interface DataImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  importType: 'vehicles' | 'customers';
}

interface ImportBatchData {
  original_filename: string;
  processed_by: string;
  status: string;
  import_type: 'vehicles' | 'customers';
  record_count: number;
  metadata: {
    columns: string[];
    preview: any[];
  };
}

interface ImportResponse {
  id?: string;
  status: string;
  message?: string;
}

const DataImportModal: React.FC<DataImportModalProps> = ({
  open,
  onOpenChange,
  importType
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [mappedFields, setMappedFields] = useState<Record<string, string>>({});
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();
  
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls', '.xlsx']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      const selectedFile = acceptedFiles[0];
      if (selectedFile) {
        setFile(selectedFile);
        parseCSV(selectedFile);
      }
    }
  });
  
  const parseCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      preview: 5, // Parse only a few rows for preview
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          setPreviewData(results.data);
          
          // Extract column headers
          if (results.meta && results.meta.fields) {
            setColumns(results.meta.fields);
            
            // Initialize field mappings with empty values
            const initialMapping: Record<string, string> = {};
            results.meta.fields.forEach(field => {
              initialMapping[field] = '';
            });
            setMappedFields(initialMapping);
          }
        }
      },
      error: (error) => {
        toast.error(`Error parsing CSV: ${error.message}`);
      }
    });
  };
  
  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file to import');
      return;
    }
    
    setImportStatus('loading');
    setProgress(10);
    
    try {
      // First create an import batch record
      const metadata = {
        columns,
        preview: previewData.slice(0, 2) // Just store a couple of rows for reference
      };
      
      // Prepare the import batch data
      const batchData: ImportBatchData = {
        original_filename: file.name,
        processed_by: "current-user", // This would normally come from auth context
        status: 'processing',
        import_type: importType,
        record_count: 0, // Will be updated after processing
        metadata
      };
      
      setProgress(30);
      
      // Create a new import batch
      const { data: batchResponse, error: batchError } = await supabase
        .from('import_batches')
        .insert(batchData)
        .select();
      
      if (batchError || !batchResponse || batchResponse.length === 0) {
        throw new Error(`Failed to create import batch: ${batchError?.message || 'Unknown error'}`);
      }
      
      const batchId = batchResponse[0].id;
      
      setProgress(50);
      
      // Now parse the full CSV for import
      const importPromise = new Promise<ImportResponse>((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          complete: async (results) => {
            try {
              setProgress(70);
              
              if (results.errors && results.errors.length > 0) {
                throw new Error(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`);
              }
              
              const { data: importResult, error: importError } = await supabase
                .from(importType) // 'vehicles' or 'customers'
                .insert(results.data)
                .select('id');
              
              if (importError) {
                throw new Error(`Failed to import data: ${importError.message}`);
              }
              
              // Update the batch with the final count and status
              await supabase
                .from('import_batches')
                .update({
                  status: 'completed',
                  record_count: results.data.length
                })
                .eq('id', batchId);
              
              resolve({
                id: batchId,
                status: 'success',
                message: `Successfully imported ${results.data.length} records`
              });
            } catch (error: any) {
              // Update batch with error status
              await supabase
                .from('import_batches')
                .update({
                  status: 'failed',
                  notes: error.message
                })
                .eq('id', batchId);
              
              reject({
                status: 'error',
                message: error.message
              });
            }
          },
          error: (error) => {
            reject({
              status: 'error',
              message: error.message
            });
          }
        });
      });
      
      // Wait for import to complete
      const importResult = await importPromise;
      
      setProgress(100);
      setImportStatus('success');
      
      toast.success(`Import successful: ${importResult.message}`);
      
      // Close modal and refresh data after a short delay
      setTimeout(() => {
        onOpenChange(false);
        // Refresh the relevant page
        navigate(`/${importType}`, { replace: true });
      }, 1500);
    } catch (error: any) {
      setImportStatus('error');
      toast.error(`Import failed: ${error.message}`);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Import {importType === 'vehicles' ? 'Vehicle' : 'Customer'} Data
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* File Upload Area */}
          {!file && (
            <div 
              {...getRootProps()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <input {...getInputProps()} />
              <Upload className="h-10 w-10 mx-auto mb-4 text-gray-400" />
              <p className="text-sm text-gray-600">
                Drag & drop a CSV file here, or click to select
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Supported formats: .csv
              </p>
            </div>
          )}
          
          {/* File Preview */}
          {file && importStatus === 'idle' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <File className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFile(null);
                    setPreviewData([]);
                    setColumns([]);
                  }}
                >
                  Remove
                </Button>
              </div>
              
              {previewData.length > 0 && (
                <Card className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {columns.map((column, index) => (
                            <TableHead key={index}>{column}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.map((row, rowIndex) => (
                          <TableRow key={rowIndex}>
                            {columns.map((column, colIndex) => (
                              <TableCell key={colIndex}>
                                {row[column] || '-'}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              )}
              
              <Button onClick={handleImport} className="w-full">
                Import Data
              </Button>
            </div>
          )}
          
          {/* Import Progress */}
          {importStatus === 'loading' && (
            <div className="space-y-4 py-4">
              <Progress value={progress} className="h-2" />
              <p className="text-center text-sm">
                Importing data... {progress}%
              </p>
            </div>
          )}
          
          {/* Import Result */}
          {importStatus === 'success' && (
            <div className="py-8 text-center space-y-4">
              <div className="bg-green-100 p-3 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-medium">Import Successful</h3>
              <p className="text-gray-500">
                Your data has been successfully imported.
              </p>
            </div>
          )}
          
          {importStatus === 'error' && (
            <div className="py-8 text-center space-y-4">
              <div className="bg-red-100 p-3 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-medium">Import Failed</h3>
              <p className="text-gray-500">
                There was an error importing your data. Please try again.
              </p>
              <Button onClick={() => setImportStatus('idle')}>
                Try Again
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DataImportModal;
