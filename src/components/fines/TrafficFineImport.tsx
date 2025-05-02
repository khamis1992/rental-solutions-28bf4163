
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, Check, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { asUUID } from '@/lib/uuid-helpers';
import { validateTrafficFines, identifyFinesWithoutLicensePlates } from '@/utils/validation/traffic-fine-validation';

interface CsvRow {
  [key: string]: string;
}

const TrafficFineImport = () => {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [parsedData, setParsedData] = useState<CsvRow[]>([]);
  const [validationResults, setValidationResults] = useState<{
    allValid: boolean;
    errorCount: number;
    finesWithoutLicensePlate: any[];
  } | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setParsedData([]);
      setValidationResults(null);
    }
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
      'application/csv': ['.csv']
    },
    maxFiles: 1
  });

  const parseFile = async () => {
    if (!file) return;
    
    setParsing(true);
    
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        try {
          const data = results.data as CsvRow[];
          
          // Perform validation on the parsed data
          const mappedData = data.map(row => ({
            licensePlate: row.licensePlate || row.license_plate || '',
            violationNumber: row.violationNumber || row.violation_number || '',
            violationDate: row.violationDate || row.violation_date || '',
            fineAmount: parseFloat(row.fineAmount || row.fine_amount || '0'),
            violationCharge: row.violationCharge || row.violation_charge || '',
            location: row.location || ''
          }));
          
          const validationResults = validateTrafficFines(mappedData);
          const finesWithoutLicensePlate = identifyFinesWithoutLicensePlates(mappedData);
          
          setValidationResults({
            allValid: validationResults.allValid,
            errorCount: validationResults.errorCount,
            finesWithoutLicensePlate
          });
          
          setParsedData(data);
          
          if (validationResults.errorCount > 0) {
            toast.warning(`Found ${validationResults.errorCount} validation errors in the data`, {
              description: "Review the errors before proceeding with the import."
            });
          } else if (finesWithoutLicensePlate.length > 0) {
            toast.warning(`Found ${finesWithoutLicensePlate.length} fines without license plates`, {
              description: "License plates are required for proper assignment."
            });
          } else {
            toast.success("CSV file parsed successfully, ready to import", {
              description: `Found ${data.length} traffic fines to import`
            });
          }
        } catch (error) {
          console.error('Error parsing CSV:', error);
          toast.error('Error parsing CSV file', {
            description: error instanceof Error ? error.message : 'Check file format and try again'
          });
        } finally {
          setParsing(false);
        }
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        toast.error('Failed to parse CSV file', {
          description: error.message
        });
        setParsing(false);
      }
    });
  };

  const importData = async () => {
    if (parsedData.length === 0) return;
    
    setImporting(true);
    
    try {
      // Process each row of data
      const results = {
        success: 0,
        errors: 0,
        details: [] as string[]
      };
      
      for (const row of parsedData) {
        try {
          // Map CSV columns to database fields
          const fineData = {
            violation_number: row.violationNumber || row.violation_number || undefined,
            license_plate: row.licensePlate || row.license_plate,
            violation_date: new Date(row.violationDate || row.violation_date || new Date()).toISOString(),
            fine_amount: parseFloat(row.fineAmount || row.fine_amount || '0'),
            violation_charge: row.violationCharge || row.violation_charge || undefined,
            fine_location: row.location || undefined,
            payment_status: 'pending',
            entry_type: 'imported'
          };
          
          // Insert the record
          const { data, error } = await supabase
            .from('traffic_fines')
            .insert(fineData)
            .select();
            
          if (error) {
            throw error;
          }
          
          results.success++;
        } catch (error) {
          console.error('Error importing row:', error, row);
          results.errors++;
          results.details.push(`Error with fine ${row.violationNumber || row.license_plate}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      // Show results
      if (results.errors === 0) {
        toast.success(`Successfully imported ${results.success} traffic fines`);
      } else {
        toast.warning(
          `Imported ${results.success} fines with ${results.errors} errors`,
          {
            description: `Some fines could not be imported due to errors.`
          }
        );
      }
      
      // Reset state
      setFile(null);
      setParsedData([]);
      setValidationResults(null);
      
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import traffic fines', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Traffic Fines</CardTitle>
        <CardDescription>
          Upload a CSV file containing traffic fines data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-secondary/20 transition-colors ${
            isDragActive ? 'border-primary bg-secondary/20' : 'border-muted-foreground/20'
          }`}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <div className="text-primary">Drop the file here...</div>
          ) : (
            <>
              <p className="text-muted-foreground">
                Drag and drop a CSV file here, or click to select a file
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Accepted format: .csv
              </p>
            </>
          )}
        </div>

        {file && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
              <div className="flex items-center gap-2">
                <Badge variant="outline">.csv</Badge>
                <span className="font-medium">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({Math.round(file.size / 1024)} KB)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setFile(null);
                    setParsedData([]);
                    setValidationResults(null);
                  }}
                  className="h-8 px-2"
                >
                  <X size={16} />
                </Button>
                <Button
                  size="sm"
                  onClick={parseFile}
                  disabled={parsing}
                  className="h-8"
                >
                  {parsing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Parsing...
                    </>
                  ) : (
                    'Parse File'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {validationResults && (
          <Alert variant={validationResults.allValid ? "default" : "destructive"}>
            {validationResults.allValid ? (
              <Check className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <AlertTitle>Validation Results</AlertTitle>
            <AlertDescription>
              {validationResults.allValid 
                ? `All ${parsedData.length} records passed validation`
                : `Found ${validationResults.errorCount} validation errors in the data.`}
              {validationResults.finesWithoutLicensePlate.length > 0 && (
                <div className="mt-2 text-sm">
                  Warning: {validationResults.finesWithoutLicensePlate.length} records are missing license plates
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {parsedData.length > 0 && (
          <>
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.keys(parsedData[0]).map((header) => (
                      <TableHead key={header}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.slice(0, 5).map((row, index) => (
                    <TableRow key={index}>
                      {Object.values(row).map((value, valueIndex) => (
                        <TableCell key={valueIndex}>{value}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {parsedData.length > 5 && (
              <p className="text-xs text-center text-muted-foreground">
                Showing 5 of {parsedData.length} records
              </p>
            )}
            
            <div className="flex justify-end">
              <Button
                onClick={importData}
                disabled={importing || validationResults?.errorCount > 0}
                className="mt-2"
              >
                {importing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  `Import ${parsedData.length} Traffic Fines`
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TrafficFineImport;
