
import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, FileUp } from 'lucide-react';

const formSchema = z.object({
  file: z.instanceof(File, {
    message: 'Please select a CSV file',
  }),
});

interface ImportPaymentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payments: any[]) => void;
}

export const ImportPaymentsDialog: React.FC<ImportPaymentsDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
}) => {
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [parsingError, setParsingError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      file: undefined,
    },
  });

  const handleSubmit = () => {
    if (parsedData.length > 0) {
      onSubmit(parsedData);
    }
  };

  const parseCSV = (text: string) => {
    setParsingError(null);
    setParsedData([]);

    try {
      // Split the text into lines and remove any empty lines
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        throw new Error('CSV file must contain a header row and at least one data row');
      }

      // Parse the header row
      const headers = lines[0].split(',').map(header => header.trim());
      const requiredHeaders = ['cheque_number', 'drawee_bank', 'amount', 'payment_date'];
      
      // Check if all required headers are present
      const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
      if (missingHeaders.length > 0) {
        throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
      }

      // Parse the data rows
      const parsedRows = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(value => value.trim());
        
        // Skip rows with incorrect number of values
        if (values.length !== headers.length) {
          continue;
        }

        // Create an object from the headers and values
        const row: any = {};
        headers.forEach((header, index) => {
          let value = values[index];
          
          // Validate numeric fields
          if (header === 'amount') {
            const numValue = parseFloat(value);
            if (isNaN(numValue) || numValue <= 0) {
              throw new Error(`Invalid amount on row ${i}: ${value}`);
            }
            row[header] = numValue;
          } else {
            row[header] = value;
          }
        });

        parsedRows.push(row);
      }

      if (parsedRows.length === 0) {
        throw new Error('No valid payment data found in the CSV file');
      }

      setParsedData(parsedRows);
    } catch (error) {
      setParsingError(error instanceof Error ? error.message : 'Error parsing CSV file');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue('file', file);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          parseCSV(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  const resetForm = () => {
    form.reset();
    setParsedData([]);
    setParsingError(null);
  };

  React.useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Payments</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4">
            <FormField
              control={form.control}
              name="file"
              render={({ field: { value, onChange, ...fieldProps }, formState }) => (
                <FormItem>
                  <FormLabel>CSV File</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <input
                        id="csv-file"
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={handleFileChange}
                        {...fieldProps}
                      />
                      <Label
                        htmlFor="csv-file"
                        className="cursor-pointer border rounded-md p-2 flex items-center gap-2 bg-muted hover:bg-muted/80 transition-colors"
                      >
                        <FileUp className="h-4 w-4" />
                        Choose CSV File
                      </Label>
                      <span className="text-sm text-muted-foreground">
                        {value ? value.name : 'No file chosen'}
                      </span>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Upload a CSV file with columns: cheque_number, drawee_bank, amount, payment_date, notes (optional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {parsingError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{parsingError}</AlertDescription>
              </Alert>
            )}

            {parsedData.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  {parsedData.length} Payments to Import
                </h3>
                <div className="border rounded-md overflow-auto max-h-[40vh]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cheque Number</TableHead>
                        <TableHead>Bank</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment Date</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.cheque_number}</TableCell>
                          <TableCell>{row.drawee_bank}</TableCell>
                          <TableCell>{row.amount}</TableCell>
                          <TableCell>{row.payment_date}</TableCell>
                          <TableCell>{row.notes || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="button"
                disabled={parsedData.length === 0}
                onClick={handleSubmit}
              >
                Import {parsedData.length} Payment{parsedData.length !== 1 ? 's' : ''}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
