import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Upload, X, CheckCircle, FileText } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { useDropzone } from 'react-dropzone';

interface CSVImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

interface ImportResult {
  success: boolean;
  errors: string[];
  imported: number;
  total: number;
}

interface CSVRow {
  [key: string]: string;
}

export const CSVImportModal = ({ open, onOpenChange, onImportComplete }: CSVImportModalProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { toast } = useToast();

  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data: CSVRow[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length === headers.length) {
        const row: CSVRow = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        data.push(row);
      }
    }
    
    return data;
  };

  const validateCSVData = (data: CSVRow[]): string[] => {
    const errors: string[] = [];
    const requiredFields = ['customer_name', 'vehicle_make', 'vehicle_model', 'start_date', 'rent_amount'];
    
    if (data.length === 0) {
      errors.push('CSV file is empty or invalid format');
      return errors;
    }

    const headers = Object.keys(data[0]);
    const missingFields = requiredFields.filter(field => !headers.includes(field));
    
    if (missingFields.length > 0) {
      errors.push(`Missing required columns: ${missingFields.join(', ')}`);
    }

    data.forEach((row, index) => {
      requiredFields.forEach(field => {
        if (!row[field] || row[field].trim() === '') {
          errors.push(`Row ${index + 2}: Missing value for ${field}`);
        }
      });
      
      if (row.rent_amount && isNaN(Number(row.rent_amount))) {
        errors.push(`Row ${index + 2}: Invalid rent amount`);
      }
    });

    return errors;
  };

  const handleFileUpload = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const data = parseCSV(text);
      setCsvData(data);
      
      const errors = validateCSVData(data);
      setValidationErrors(errors);
    };
    
    reader.readAsText(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileUpload,
    accept: {
      'text/csv': ['.csv']
    },
    multiple: false
  });

  const handleImport = async () => {
    if (!csvData.length || validationErrors.length > 0) return;

    setIsImporting(true);
    setImportProgress(0);

    try {
      let imported = 0;
      const errors: string[] = [];

      for (let i = 0; i < csvData.length; i++) {
        try {
          // Simulate import progress
          setImportProgress(((i + 1) / csvData.length) * 100);
          
          // Here you would implement actual import logic
          // await importAgreement(csvData[i]);
          
          imported++;
          
          // Simulate processing time
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          errors.push(`Row ${i + 2}: Failed to import - ${error}`);
        }
      }

      setImportResult({
        success: errors.length === 0,
        errors,
        imported,
        total: csvData.length
      });

      if (errors.length === 0) {
        toast({
          title: "Import successful",
          description: `Successfully imported ${imported} agreements`,
        });
        onImportComplete();
      }
    } catch (error) {
      toast({
        title: "Import failed",
        description: "An error occurred during import",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const resetModal = () => {
    setSelectedFile(null);
    setCsvData([]);
    setImportProgress(0);
    setIsImporting(false);
    setImportResult(null);
    setValidationErrors([]);
  };

  const handleClose = () => {
    resetModal();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Agreements from CSV
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!selectedFile && (
            <Card>
              <CardContent className="pt-6">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-300 hover:border-primary'
                  }`}
                >
                  <input {...getInputProps()} />
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  {isDragActive ? (
                    <p className="text-lg">Drop the CSV file here...</p>
                  ) : (
                    <>
                      <p className="text-lg mb-2">Drag & drop a CSV file here, or click to select</p>
                      <p className="text-sm text-gray-500">Only CSV files are accepted</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {selectedFile && !importResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>File: {selectedFile.name}</span>
                  <Button variant="ghost" size="sm" onClick={resetModal}>
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {validationErrors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="font-medium">Validation errors found:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {validationErrors.map((error, index) => (
                            <li key={index} className="text-sm">{error}</li>
                          ))}
                        </ul>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {csvData.length > 0 && validationErrors.length === 0 && (
                  <>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">
                        {csvData.length} records ready for import
                      </Badge>
                      <Button onClick={handleImport} disabled={isImporting}>
                        {isImporting ? 'Importing...' : 'Start Import'}
                      </Button>
                    </div>

                    {isImporting && (
                      <div className="space-y-2">
                        <Progress value={importProgress} />
                        <p className="text-sm text-center">{Math.round(importProgress)}% complete</p>
                      </div>
                    )}

                    <ScrollArea className="h-64 border rounded">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {Object.keys(csvData[0]).map(header => (
                              <TableHead key={header}>{header}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {csvData.slice(0, 5).map((row, index) => (
                            <TableRow key={index}>
                              {Object.values(row).map((value, cellIndex) => (
                                <TableCell key={cellIndex}>{value}</TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {csvData.length > 5 && (
                        <p className="text-sm text-center p-2 text-gray-500">
                          ... and {csvData.length - 5} more rows
                        </p>
                      )}
                    </ScrollArea>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {importResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {importResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  Import {importResult.success ? 'Completed' : 'Completed with Errors'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{importResult.imported}</p>
                    <p className="text-sm text-gray-500">Successfully Imported</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{importResult.errors.length}</p>
                    <p className="text-sm text-gray-500">Errors</p>
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="font-medium">Import errors:</p>
                        <ScrollArea className="h-32">
                          <ul className="list-disc list-inside space-y-1">
                            {importResult.errors.map((error, index) => (
                              <li key={index} className="text-sm">{error}</li>
                            ))}
                          </ul>
                        </ScrollArea>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={resetModal}>
                    Import Another File
                  </Button>
                  <Button onClick={handleClose}>
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
