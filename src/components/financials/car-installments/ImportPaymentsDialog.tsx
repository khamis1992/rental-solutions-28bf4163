// @ts-nocheck
/* eslint-disable */
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

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, FileUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { language } = useLanguage();
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
        throw new Error(language === 'ar' ? 
          'يجب أن يحتوي ملف CSV على صف رأس وصف بيانات واحد على الأقل' :
          'CSV file must contain a header row and at least one data row'
        );
      }

      // Parse the header row
      const headers = lines[0].split(',').map(header => header.trim());
      const requiredHeaders = ['cheque_number', 'drawee_bank', 'amount', 'payment_date'];
      
      // Check if all required headers are present
      const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
      if (missingHeaders.length > 0) {
        throw new Error(language === 'ar' ? 
          `رؤوس مطلوبة مفقودة: ${missingHeaders.join(', ')}` :
          `Missing required headers: ${missingHeaders.join(', ')}`
        );
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
              throw new Error(language === 'ar' ? 
                `مبلغ غير صالح في الصف ${i}: ${value}` :
                `Invalid amount on row ${i}: ${value}`
              );
            }
            row[header] = numValue;
          } else {
            row[header] = value;
          }
        });

        parsedRows.push(row);
      }

      if (parsedRows.length === 0) {
        throw new Error(language === 'ar' ? 
          'لم يتم العثور على بيانات دفع صالحة في ملف CSV' :
          'No valid payment data found in the CSV file'
        );
      }

      setParsedData(parsedRows);
    } catch (error) {
      setParsingError(error instanceof Error ? error.message : 
        (language === 'ar' ? 'خطأ في تحليل ملف CSV' : 'Error parsing CSV file')
      );
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
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <DialogHeader className={language === 'ar' ? 'text-right' : 'text-left'}>
          <DialogTitle>{language === 'ar' ? 'استيراد المدفوعات' : 'Import Payments'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4">
            <FormField
              control={form.control}
              name="file"
              render={({ field: { value, onChange, ...fieldProps }, formState }) => (
                <FormItem>
                  <FormLabel className={language === 'ar' ? 'text-right' : 'text-left'}>
                    {language === 'ar' ? 'ملف CSV' : 'CSV File'}
                  </FormLabel>
                  <FormControl>
                    <div className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
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
                        className={`cursor-pointer border rounded-md p-2 flex items-center gap-2 bg-muted hover:bg-muted/80 transition-colors ${language === 'ar' ? 'flex-row-reverse' : ''}`}
                      >
                        <FileUp className="h-4 w-4" />
                        {language === 'ar' ? 'اختر ملف CSV' : 'Choose CSV File'}
                      </Label>
                      <span className={`text-sm text-muted-foreground ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                        {value ? value.name : (language === 'ar' ? 'لم يتم اختيار ملف' : 'No file chosen')}
                      </span>
                    </div>
                  </FormControl>
                  <FormDescription className={language === 'ar' ? 'text-right' : 'text-left'}>
                    {language === 'ar' ? 
                      'قم برفع ملف CSV مع الأعمدة: cheque_number, drawee_bank, amount, payment_date, notes (اختياري)' :
                      'Upload a CSV file with columns: cheque_number, drawee_bank, amount, payment_date, notes (optional)'
                    }
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {parsingError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{language === 'ar' ? 'خطأ' : 'Error'}</AlertTitle>
                <AlertDescription>{parsingError}</AlertDescription>
              </Alert>
            )}

            {parsedData.length > 0 && (
              <div className="space-y-4">
                <h4 className={`text-sm font-medium ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {language === 'ar' ? 'معاينة البيانات المستوردة' : 'Preview of imported data'} ({parsedData.length} {language === 'ar' ? 'صفوف' : 'rows'})
                </h4>
                <div className="rounded-md border max-h-64 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className={language === 'ar' ? 'text-right' : 'text-left'}>
                          {language === 'ar' ? 'رقم الشيك' : 'Cheque Number'}
                        </TableHead>
                        <TableHead className={language === 'ar' ? 'text-right' : 'text-left'}>
                          {language === 'ar' ? 'البنك المسحوب عليه' : 'Drawee Bank'}
                        </TableHead>
                        <TableHead className={language === 'ar' ? 'text-right' : 'text-left'}>
                          {language === 'ar' ? 'المبلغ' : 'Amount'}
                        </TableHead>
                        <TableHead className={language === 'ar' ? 'text-right' : 'text-left'}>
                          {language === 'ar' ? 'تاريخ الدفع' : 'Payment Date'}
                        </TableHead>
                        <TableHead className={language === 'ar' ? 'text-right' : 'text-left'}>
                          {language === 'ar' ? 'ملاحظات' : 'Notes'}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.slice(0, 10).map((row, index) => (
                        <TableRow key={index}>
                          <TableCell className={language === 'ar' ? 'text-right' : 'text-left'}>
                            {row.cheque_number}
                          </TableCell>
                          <TableCell className={language === 'ar' ? 'text-right' : 'text-left'}>
                            {row.drawee_bank}
                          </TableCell>
                          <TableCell className={language === 'ar' ? 'text-right' : 'text-left'}>
                            {row.amount}
                          </TableCell>
                          <TableCell className={language === 'ar' ? 'text-right' : 'text-left'}>
                            {row.payment_date}
                          </TableCell>
                          <TableCell className={language === 'ar' ? 'text-right' : 'text-left'}>
                            {row.notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {parsedData.length > 10 && (
                    <div className={`p-2 text-sm text-muted-foreground text-center ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                      {language === 'ar' ? 
                        `و ${parsedData.length - 10} صفوف أخرى...` :
                        `... and ${parsedData.length - 10} more rows`
                      }
                    </div>
                  )}
                </div>
              </div>
            )}

            <DialogFooter className={language === 'ar' ? 'flex-row-reverse' : ''}>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={parsedData.length === 0}
              >
                {language === 'ar' ? `استيراد ${parsedData.length} مدفوعات` : `Import ${parsedData.length} Payments`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
