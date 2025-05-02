import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from 'sonner';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { FileUp, X } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { safeQueryToServiceResponse } from '@/utils/supabase-type-helpers';
import { withTimeoutAndRetry } from '@/utils/promise-utils';

interface CSVImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

export const CSVImportModal: React.FC<CSVImportModalProps> = ({ open, onOpenChange, onImportComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [importType, setImportType] = useState<'customers' | 'vehicles'>('customers');
  const { user } = useUser();
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    setFile(file);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setHeaders(results.meta.fields || []);
        setRows(results.data);
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        setError(`CSV parsing error: ${error.message}`);
        setStatus('error');
      }
    });
  }, []);
  
  const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop});
  
  const clearData = () => {
    setFile(null);
    setHeaders([]);
    setRows([]);
    setStatus('idle');
    setError(null);
  };

  const validateRow = (row: any, headers: string[]) => {
    if (!row) return false;
    return headers.every(header => row[header] !== undefined);
  };

  const importDataHandler = async () => {
    if (!file) {
      setError('No file selected');
      setStatus('error');
      return;
    }
    
    if (rows.length === 0) {
      setError('No data to import');
      setStatus('error');
      return;
    }
    
    setStatus('loading');
    setError(null);
    
    try {
      // Validate import batch
      const validRows = rows.filter(row => validateRow(row, headers));
      const invalidRows = rows.length - validRows.length;
      
      if (invalidRows > 0) {
        toast.warn(`${invalidRows} rows were invalid and will be skipped`);
      }
      
      // Create import batch record with optimized error handling
      const importBatchResult = await withTimeoutAndRetry(
        () => safeQueryToServiceResponse(() =>
          supabase
            .from('import_batches')
            .insert({
              original_filename: file.name,
              processed_by: user?.id,
              status: 'processing',
              import_type: importType,
              record_count: validRows.length,
              metadata: {
                columns: headers,
                preview: validRows.slice(0, 5)
              }
            })
            .select()
            .single()
        ),
        {
          timeoutMs: 10000,
          operationName: 'Create import batch',
          retries: 1
        }
      );
      
      if (!importBatchResult.success || !importBatchResult.data) {
        setError(`Failed to create import batch: ${importBatchResult.message || 'Unknown error'}`);
        setStatus('error');
        return;
      }
      
      const batchId = importBatchResult.data.id;
      
      // Process each row with improved error handling
      for (const row of validRows) {
        try {
          // Transform row data based on import type
          let dbPayload: any = row;
          
          if (importType === 'customers') {
            dbPayload = {
              full_name: row.full_name,
              email: row.email,
              phone_number: row.phone_number,
              address: row.address,
              city: row.city,
              state: row.state,
              zip_code: row.zip_code,
            };
          } else if (importType === 'vehicles') {
            dbPayload = {
              make: row.make,
              model: row.model,
              year: row.year,
              license_plate: row.license_plate,
              vin: row.vin,
            };
          }
          
          // Insert data into the database with retry and timeout
          const insertResult = await withTimeoutAndRetry(
            () => safeQueryToServiceResponse(() =>
              supabase
                .from(importType)
                .insert({
                  ...dbPayload,
                  import_batch_id: batchId
                })
                .select()
                .single()
            ),
            {
              timeoutMs: 5000,
              operationName: `Insert ${importType} record`,
              retries: 1
            }
          );
          
          if (!insertResult.success) {
            console.error(`Failed to insert record: ${insertResult.message}`);
            toast.error(`Failed to insert record: ${insertResult.message}`);
          }
        } catch (dbError) {
          console.error('Database insert error:', dbError);
          toast.error(`Database insert error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
        }
      }
      
      // Update import batch status to completed
      const updateBatchResult = await withTimeoutAndRetry(
        () => safeQueryToServiceResponse(() =>
          supabase
            .from('import_batches')
            .update({ status: 'completed' })
            .eq('id', batchId)
            .select()
            .single()
        ),
        {
          timeoutMs: 10000,
          operationName: 'Update import batch status',
          retries: 1
        }
      );
      
      if (!updateBatchResult.success) {
        console.error(`Failed to update import batch status: ${updateBatchResult.message}`);
        toast.error(`Failed to update import batch status: ${updateBatchResult.message}`);
      }
      
      setStatus('success');
      toast.success('Data imported successfully');
      onImportComplete();
      onOpenChange(false);
    } catch (error) {
      console.error('Import error:', error);
      setError(`Import error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStatus('error');
      toast.error(`Import error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Import Data from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import data into the system.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="importType" className="text-right">
              Import Type
            </Label>
            <select 
              id="importType" 
              className="col-span-3 rounded-md border shadow-sm focus:border-primary-500 focus:ring-primary-500"
              value={importType}
              onChange={(e) => setImportType(e.target.value as 'customers' | 'vehicles')}
            >
              <option value="customers">Customers</option>
              <option value="vehicles">Vehicles</option>
            </select>
          </div>

          <div {...getRootProps()} className="rounded-md border-2 border-dashed p-4 text-center">
            <input {...getInputProps()} />
            {
              isDragActive ?
                <p>Drop the files here ...</p> :
                <>
                  <FileUp className="mx-auto h-6 w-6 text-gray-400" />
                  <p>Drag 'n' drop some files here, or click to select files</p>
                </>
            }
          </div>

          {file && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">File Preview: {file.name}</h3>
              <p className="text-sm text-gray-500">
                Columns: {headers.join(', ') || 'N/A'}
              </p>
              
              <ScrollArea className="rounded-md border">
                <Table>
                  <TableHeader>
                    {headers.map((header) => (
                      <TableHead key={header}>{header}</TableHead>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {rows.slice(0, 5).map((row, index) => (
                      <TableRow key={index}>
                        {headers.map((header) => (
                          <TableCell key={header}>{row[header] || 'N/A'}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}

          {status === 'error' && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              <p>Error: {error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={clearData}>
            Clear
          </Button>
          <Button type="submit" onClick={importDataHandler} disabled={status === 'loading'}>
            {status === 'loading' ? 'Importing...' : 'Import Data'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
