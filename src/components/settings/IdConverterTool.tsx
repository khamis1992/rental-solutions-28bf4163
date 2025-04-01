
import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from '@/components/ui/form';
import { Loader2, FileUp, Download, FileText, Search, Settings } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { parseCSVFile, downloadCSVTemplate } from '@/utils/csv-utils';

interface MappingSelection {
  customerIdentifier: string;
  vehicleIdentifier: string;
}

interface ConversionResult {
  originalData: Record<string, string>[];
  convertedData: Record<string, string>[];
  mappings: {
    customerField: string;
    vehicleField: string;
  };
}

export function IdConverterTool() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<MappingSelection>({
    customerIdentifier: '',
    vehicleIdentifier: ''
  });
  const [result, setResult] = useState<ConversionResult | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
        
        try {
          // Read file to extract headers
          const reader = new FileReader();
          
          reader.onload = (event) => {
            const csvText = event.target?.result as string;
            const lines = csvText.split('\n');
            if (lines.length > 0) {
              const headerLine = lines[0].trim();
              const extractedHeaders = headerLine.split(',').map(h => h.trim());
              setHeaders(extractedHeaders);
              
              // Try to automatically select appropriate mapping fields
              const customerFields = ['customer', 'customer_name', 'full_name', 'name', 'email'];
              const vehicleFields = ['vehicle', 'car', 'license_plate', 'plate', 'vin'];
              
              let autoCustomerField = '';
              let autoVehicleField = '';
              
              // Auto-select based on common field names
              for (const header of extractedHeaders) {
                const lowerHeader = header.toLowerCase();
                
                if (!autoCustomerField && customerFields.some(field => lowerHeader.includes(field))) {
                  autoCustomerField = header;
                }
                
                if (!autoVehicleField && vehicleFields.some(field => lowerHeader.includes(field))) {
                  autoVehicleField = header;
                }
              }
              
              setMapping({
                customerIdentifier: autoCustomerField,
                vehicleIdentifier: autoVehicleField
              });
            }
          };
          
          reader.readAsText(acceptedFiles[0]);
        } catch (error) {
          console.error('Error reading CSV file:', error);
          toast.error('Failed to parse CSV file');
        }
      }
    },
  });

  const handleConvert = async () => {
    if (!file) {
      toast.error('Please select a CSV file');
      return;
    }

    if (!mapping.customerIdentifier || !mapping.vehicleIdentifier) {
      toast.error('Please select both customer and vehicle identifier fields');
      return;
    }

    setProcessing(true);

    try {
      // Parse the CSV file
      const csvData = await parseCSVFile<Record<string, string>>(
        file, 
        headers.reduce((acc, header) => {
          acc[header] = header;
          return acc;
        }, {} as Record<string, string>)
      );

      if (!csvData.length) {
        toast.error('No data found in CSV file');
        setProcessing(false);
        return;
      }

      // Create a copy of the original data
      const originalData = [...csvData];
      const convertedData = [...csvData];

      // Process customer IDs
      const customerIds = await lookupCustomerIds(csvData, mapping.customerIdentifier);
      
      // Process vehicle IDs
      const vehicleIds = await lookupVehicleIds(csvData, mapping.vehicleIdentifier);

      // Apply the conversions to the data
      convertedData.forEach((row, index) => {
        // Replace with UUIDs if found
        if (customerIds[index]) {
          row['Customer ID'] = customerIds[index];
        }
        
        if (vehicleIds[index]) {
          row['Vehicle ID'] = vehicleIds[index];
        }
      });

      // Set the result
      setResult({
        originalData,
        convertedData,
        mappings: {
          customerField: mapping.customerIdentifier,
          vehicleField: mapping.vehicleIdentifier
        }
      });

      toast.success('Conversion completed successfully');
    } catch (error) {
      console.error('Error converting IDs:', error);
      toast.error('Failed to convert IDs');
    } finally {
      setProcessing(false);
    }
  };

  const lookupCustomerIds = async (data: Record<string, string>[], identifierField: string): Promise<string[]> => {
    const customerIds: string[] = [];
    const isEmail = identifierField.toLowerCase().includes('email');
    
    for (const row of data) {
      const identifier = row[identifierField];
      if (!identifier) {
        customerIds.push('');
        continue;
      }
      
      try {
        // Query based on whether the identifier is an email or name
        let query = supabase
          .from('profiles')
          .select('id')
          .eq('role', 'customer');
          
        if (isEmail) {
          query = query.eq('email', identifier.trim());
        } else {
          // Assume it's a name
          query = query.ilike('full_name', `%${identifier.trim()}%`);
        }
        
        const { data: customer } = await query.limit(1).single();
        
        if (customer?.id) {
          customerIds.push(customer.id);
        } else {
          customerIds.push('');
        }
      } catch (error) {
        console.error(`Error looking up customer ID for "${identifier}":`, error);
        customerIds.push('');
      }
    }
    
    return customerIds;
  };

  const lookupVehicleIds = async (data: Record<string, string>[], identifierField: string): Promise<string[]> => {
    const vehicleIds: string[] = [];
    const isLicensePlate = identifierField.toLowerCase().includes('plate') || 
                           identifierField.toLowerCase().includes('license');
    
    for (const row of data) {
      const identifier = row[identifierField];
      if (!identifier) {
        vehicleIds.push('');
        continue;
      }
      
      try {
        // Query based on the identifier type
        let query = supabase.from('vehicles').select('id');
          
        if (isLicensePlate) {
          query = query.eq('license_plate_number', identifier.trim());
        } else {
          // Try to match by VIN or make/model combination
          query = query.or(`vin.eq.${identifier.trim()},make_model.ilike.%${identifier.trim()}%`);
        }
        
        const { data: vehicle } = await query.limit(1).single();
        
        if (vehicle?.id) {
          vehicleIds.push(vehicle.id);
        } else {
          vehicleIds.push('');
        }
      } catch (error) {
        console.error(`Error looking up vehicle ID for "${identifier}":`, error);
        vehicleIds.push('');
      }
    }
    
    return vehicleIds;
  };

  const handleDownloadConverted = () => {
    if (!result) return;
    
    // Generate CSV content
    const headers = Object.keys(result.convertedData[0]);
    const csvContent = [
      headers.join(','),
      ...result.convertedData.map(row => 
        headers.map(header => {
          const value = row[header] || '';
          // Escape values with commas by wrapping in quotes
          return value.includes(',') ? `"${value}"` : value;
        }).join(',')
      )
    ].join('\n');
    
    // Create a blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'converted_agreements.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadTemplate = () => {
    downloadCSVTemplate([
      'Customer Name or Email',
      'Vehicle License Plate or VIN',
      'Start Date',
      'End Date',
      'Rent Amount',
      'Deposit Amount',
      'Agreement Type',
      'Notes'
    ], 'agreement_template_for_conversion.csv');
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-muted-foreground" />
          <CardTitle>ID Converter Tool</CardTitle>
        </div>
        <CardDescription>
          Convert customer names and vehicle identifiers to UUIDs for agreement imports
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <FormDescription>
            This tool helps you convert human-readable identifiers (like customer names or emails and vehicle license plates) 
            into the UUID format required for CSV imports. Upload your CSV file, map the columns, and download the converted file.
          </FormDescription>

          <Button 
            variant="outline"
            size="sm"
            onClick={handleDownloadTemplate}
            className="mb-4 flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download Template
          </Button>
        </div>

        {!result && (
          <>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors
                ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}
            >
              <input {...getInputProps()} disabled={processing} />
              <FileUp className="w-10 h-10 mx-auto text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                {isDragActive
                  ? 'Drop the CSV file here'
                  : 'Drag and drop a CSV file, or click to select'}
              </p>
            </div>
          
            {file && (
              <div className="bg-muted p-3 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex-1 truncate">
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setFile(null)}
                    disabled={processing}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {file && headers.length > 0 && !result && (
          <div className="space-y-6 mt-6">
            <FormField
              name="customerIdentifier"
              render={() => (
                <FormItem>
                  <FormLabel>Customer Identifier Field</FormLabel>
                  <Select
                    value={mapping.customerIdentifier}
                    onValueChange={(value) => setMapping(prev => ({ ...prev, customerIdentifier: value }))}
                    disabled={processing}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a field for customer identification" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {headers.map(header => (
                        <SelectItem key={header} value={header}>{header}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the column containing customer names or emails
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              name="vehicleIdentifier"
              render={() => (
                <FormItem>
                  <FormLabel>Vehicle Identifier Field</FormLabel>
                  <Select
                    value={mapping.vehicleIdentifier}
                    onValueChange={(value) => setMapping(prev => ({ ...prev, vehicleIdentifier: value }))}
                    disabled={processing}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a field for vehicle identification" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {headers.map(header => (
                        <SelectItem key={header} value={header}>{header}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the column containing vehicle plates or VINs
                  </FormDescription>
                </FormItem>
              )}
            />

            <Button 
              onClick={handleConvert} 
              disabled={processing || !mapping.customerIdentifier || !mapping.vehicleIdentifier}
              className="w-full"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Convert Identifiers to UUIDs
                </>
              )}
            </Button>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-md p-4">
              <h3 className="text-sm font-medium text-green-800 dark:text-green-400">Conversion Successful</h3>
              <p className="text-sm text-green-700 dark:text-green-500 mt-1">
                Customer identifiers from field "{result.mappings.customerField}" and vehicle identifiers from field "{result.mappings.vehicleField}" have been converted to UUIDs.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Preview (First 5 rows)</h3>
              <div className="border rounded-md overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      {['Customer ID', 'Vehicle ID'].map(header => (
                        <th key={header} className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                    {result.convertedData.slice(0, 5).map((row, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2 text-xs text-gray-900 dark:text-gray-300 whitespace-nowrap">{row['Customer ID'] || '(Not found)'}</td>
                        <td className="px-3 py-2 text-xs text-gray-900 dark:text-gray-300 whitespace-nowrap">{row['Vehicle ID'] || '(Not found)'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4">
              <Button
                variant="outline"
                onClick={() => {
                  setResult(null);
                  setFile(null);
                  setHeaders([]);
                  setMapping({ customerIdentifier: '', vehicleIdentifier: '' });
                }}
              >
                Convert Another File
              </Button>
              <Button onClick={handleDownloadConverted} className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Download Converted CSV
              </Button>
            </div>
          </div>
        )}

        <div className="text-sm mt-6 p-4 border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 rounded-md">
          <h4 className="font-medium text-amber-800 dark:text-amber-400">Important Notes</h4>
          <ul className="list-disc list-inside mt-2 text-amber-700 dark:text-amber-500 space-y-1">
            <li>Customer IDs must match existing customers in the system</li>
            <li>Vehicle IDs must match existing vehicles in the system</li>
            <li>The tool will try to find the best match but may not find all identifiers</li>
            <li>Review the converted file before using it for imports</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
