
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileUp, AlertCircle, Check } from 'lucide-react';
import { downloadCSVTemplate } from '@/utils/csv-utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface CsvRow {
  violation_number?: string;
  license_plate?: string;
  violation_date?: string;
  fine_amount?: string;
  violation_charge?: string;
  fine_location?: string;
  payment_status?: string;
}

const TrafficFineImport = ({ onImportComplete }: { onImportComplete?: () => void }) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<CsvRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importStats, setImportStats] = useState<{
    total: number;
    success: number;
    failed: number;
  } | null>(null);

  const csvHeaders = [
    'violation_number',
    'license_plate',
    'violation_date',
    'fine_amount',
    'violation_charge',
    'fine_location',
    'payment_status'
  ];

  // Map from CSV column names to database field names
  const fieldMapping: Record<string, string> = {
    'violation_number': 'violation_number',
    'license_plate': 'license_plate',
    'violation_date': 'violation_date',
    'fine_amount': 'fine_amount',
    'violation_charge': 'violation_charge',
    'fine_location': 'fine_location',
    'payment_status': 'payment_status'
  };

  const downloadTemplate = () => {
    downloadCSVTemplate(csvHeaders, 'traffic_fines_import_template.csv');
    toast.success('Template downloaded successfully', {
      description: 'Fill in the template with your traffic fines data and upload it'
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseCSV(selectedFile);
    }
  };

  const parseCSV = (file: File) => {
    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvText = event.target?.result as string;
        const rows = csvText.split('\n').filter(line => line.trim() !== '');
        
        // Extract headers
        const headers = rows[0].split(',').map(header => header.trim().toLowerCase());
        
        // Validate required headers
        const missingHeaders = ['license_plate'].filter(
          requiredHeader => !headers.includes(requiredHeader)
        );
        
        if (missingHeaders.length > 0) {
          setError(`Missing required headers: ${missingHeaders.join(', ')}`);
          return;
        }
        
        // Parse data
        const parsedRows: CsvRow[] = [];
        for (let i = 1; i < Math.min(rows.length, 6); i++) {
          const values = rows[i].split(',');
          const row: CsvRow = {};
          
          headers.forEach((header, index) => {
            if (fieldMapping[header] && values[index]) {
              row[header as keyof CsvRow] = values[index].trim();
            }
          });
          
          // Validate license plate is present
          if (!row.license_plate) {
            continue;
          }
          
          parsedRows.push(row);
        }
        
        setPreviewData(parsedRows);
      } catch (err) {
        console.error('Error parsing CSV:', err);
        setError('Failed to parse CSV file. Please check the format.');
      }
    };
    
    reader.onerror = () => {
      setError('Failed to read file');
    };
    
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!file) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const csvText = event.target?.result as string;
          const rows = csvText.split('\n').filter(line => line.trim() !== '');
          const headers = rows[0].split(',').map(header => header.trim().toLowerCase());
          
          let successCount = 0;
          let failCount = 0;
          
          // Process each row (skipping header)
          for (let i = 1; i < rows.length; i++) {
            const values = rows[i].split(',');
            const data: Record<string, any> = {};
            
            // Map CSV fields to database fields
            headers.forEach((header, index) => {
              if (fieldMapping[header] && values[index]) {
                const value = values[index].trim();
                
                // Type conversions as needed
                if (header === 'fine_amount') {
                  data[fieldMapping[header]] = parseFloat(value);
                } else if (header === 'violation_date') {
                  data[fieldMapping[header]] = new Date(value).toISOString();
                } else {
                  data[fieldMapping[header]] = value;
                }
              }
            });
            
            // Ensure license_plate is present
            if (!data.license_plate || data.license_plate.trim() === '') {
              console.warn(`Row ${i} skipped: missing license plate`);
              failCount++;
              continue;
            }
            
            // Set default values for missing fields
            if (!data.payment_status) {
              data.payment_status = 'pending';
            }
            
            if (!data.violation_number) {
              data.violation_number = `TF-${Math.floor(Math.random() * 10000)}`;
            }
            
            // Insert into database - use as any to bypass strict type checking
            const { error: insertError } = await supabase
              .from('traffic_fines')
              .insert(data as any);
              
            if (insertError) {
              console.error(`Error inserting row ${i}:`, insertError);
              failCount++;
            } else {
              successCount++;
            }
          }
          
          setImportStats({
            total: rows.length - 1, // Excluding header
            success: successCount,
            failed: failCount
          });
          
          if (successCount > 0) {
            toast.success(`Successfully imported ${successCount} traffic fines`);
            if (onImportComplete) onImportComplete();
          }
          
          if (failCount > 0) {
            toast.error(`Failed to import ${failCount} traffic fines`);
          }
        } catch (err) {
          console.error('Error processing import:', err);
          setError('Failed to process import. Please check the console for details.');
        } finally {
          setIsLoading(false);
        }
      };
      
      reader.onerror = () => {
        setError('Failed to read file');
        setIsLoading(false);
      };
      
      reader.readAsText(file);
    } catch (err) {
      console.error('Error during import:', err);
      setError('An unexpected error occurred during import');
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Import Traffic Fines</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {importStats && (
          <Alert className="mb-4" variant={importStats.failed > 0 ? "destructive" : "default"}>
            <Check className="h-4 w-4" />
            <AlertTitle>Import Summary</AlertTitle>
            <AlertDescription>
              Total: {importStats.total}, 
              Successful: {importStats.success}, 
              Failed: {importStats.failed}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <label htmlFor="csv-file" className="text-sm font-medium">
              Select CSV File
            </label>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => document.getElementById('csv-file')?.click()}
                className="w-full md:w-auto"
              >
                <FileUp className="h-4 w-4 mr-2" />
                Choose File
              </Button>
              <Button 
                variant="secondary"
                onClick={downloadTemplate}
                className="w-full md:w-auto"
              >
                Download Template
              </Button>
            </div>
            <input
              type="file"
              id="csv-file"
              className="hidden"
              accept=".csv"
              onChange={handleFileChange}
            />
            <p className="text-sm text-muted-foreground">
              {file ? file.name : 'No file selected'}
            </p>
          </div>
          
          {previewData.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-2">Data Preview</h3>
              <div className="border rounded-md overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Violation #</TableHead>
                      <TableHead>License Plate</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Location</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row.violation_number || 'N/A'}</TableCell>
                        <TableCell className={!row.license_plate ? 'text-red-500 font-bold' : ''}>
                          {row.license_plate || 'MISSING'}
                        </TableCell>
                        <TableCell>{row.violation_date || 'N/A'}</TableCell>
                        <TableCell>{row.fine_amount || 'N/A'}</TableCell>
                        <TableCell>{row.fine_location || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleImport} 
          disabled={!file || previewData.length === 0 || isLoading}
          className="w-full md:w-auto"
        >
          {isLoading ? 'Importing...' : 'Import Traffic Fines'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TrafficFineImport;
