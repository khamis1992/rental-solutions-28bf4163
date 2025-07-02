import React, { useState } from 'react';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileUp, AlertCircle, Check } from 'lucide-react';
import { downloadCSVTemplate } from '@/utils/csv-utils';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { language } = useLanguage();

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
    toast.success(
      language === 'ar' ? 'تم تنزيل النموذج بنجاح' : 'Template downloaded successfully', 
      {
        description: language === 'ar' 
          ? 'املأ النموذج ببيانات المخالفات المرورية وارفعه'
          : 'Fill in the template with your traffic fines data and upload it'
      }
    );
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
          setError(language === 'ar' 
            ? `رؤوس الأعمدة المفقودة: ${missingHeaders.join(', ')}`
            : `Missing required headers: ${missingHeaders.join(', ')}`);
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
        setError(language === 'ar' 
          ? 'فشل في تحليل ملف CSV. يرجى التحقق من التنسيق.'
          : 'Failed to parse CSV file. Please check the format.');
      }
    };
    
    reader.onerror = () => {
      setError(language === 'ar' ? 'فشل في قراءة الملف' : 'Failed to read file');
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
            
            // Insert into database using type assertion to bypass TypeScript error
            const { error: insertError } = await supabase
              .from('traffic_fines')
              .insert([data] as any); // Convert to array since the API expects an array
              
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
            toast.success(language === 'ar' 
              ? `تم استيراد ${successCount} مخالفة مرورية بنجاح`
              : `Successfully imported ${successCount} traffic fines`);
            if (onImportComplete) onImportComplete();
          }
          
          if (failCount > 0) {
            toast.warning(language === 'ar' 
              ? `فشل في استيراد ${failCount} مخالفة`
              : `Failed to import ${failCount} fines`);
          }
        } catch (err) {
          console.error('Import error:', err);
          setError(language === 'ar' 
            ? 'فشل في استيراد المخالفات المرورية'
            : 'Failed to import traffic fines');
        } finally {
          setIsLoading(false);
        }
      };
      
      reader.readAsText(file);
    } catch (err) {
      console.error('File processing error:', err);
      setError(language === 'ar' 
        ? 'فشل في معالجة الملف'
        : 'Failed to process file');
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* File Selection */}
      <Card>
        <CardHeader>
          <CardTitle className={language === 'ar' ? 'text-right' : ''}>
            {language === 'ar' ? 'استيراد المخالفات المرورية' : 'Import Traffic Fines'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className={language === 'ar' ? 'text-right' : ''}>
              {language === 'ar' ? 'تنسيق الملف' : 'File Format'}
            </AlertTitle>
            <AlertDescription className={language === 'ar' ? 'text-right' : ''}>
              {language === 'ar' 
                ? 'ارفع ملف CSV يحتوي على المخالفات المرورية. لوحة الترخيص مطلوبة لكل صف.'
                : 'Upload a CSV file containing traffic fines. License plate is required for each row.'}
            </AlertDescription>
          </Alert>

          <div className={`flex gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <Button 
              variant="outline" 
              onClick={downloadTemplate}
              className={language === 'ar' ? 'flex-row-reverse' : ''}
            >
              <FileUp className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
              {language === 'ar' ? 'تنزيل النموذج' : 'Download Template'}
            </Button>
          </div>

          <div className="grid w-full max-w-sm items-center gap-1.5">
            <label 
              htmlFor="csv-file" 
              className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${language === 'ar' ? 'text-right' : ''}`}
            >
              {language === 'ar' ? 'اختيار ملف CSV' : 'Select CSV File'}
            </label>
            <input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {error && (
            <Alert variant="destructive" dir={language === 'ar' ? 'rtl' : 'ltr'}>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className={language === 'ar' ? 'text-right' : ''}>
                {language === 'ar' ? 'خطأ' : 'Error'}
              </AlertTitle>
              <AlertDescription className={language === 'ar' ? 'text-right' : ''}>
                {error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Data Preview */}
      {previewData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className={language === 'ar' ? 'text-right' : ''}>
              {language === 'ar' ? 'معاينة البيانات' : 'Data Preview'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <TableHeader>
                  <TableRow>
                    <TableHead className={language === 'ar' ? 'text-right' : ''}>
                      {language === 'ar' ? 'رقم المخالفة' : 'Violation #'}
                    </TableHead>
                    <TableHead className={language === 'ar' ? 'text-right' : ''}>
                      {language === 'ar' ? 'لوحة الترخيص' : 'License Plate'}
                    </TableHead>
                    <TableHead className={language === 'ar' ? 'text-right' : ''}>
                      {language === 'ar' ? 'تاريخ المخالفة' : 'Violation Date'}
                    </TableHead>
                    <TableHead className={language === 'ar' ? 'text-right' : ''}>
                      {language === 'ar' ? 'المبلغ' : 'Amount'}
                    </TableHead>
                    <TableHead className={language === 'ar' ? 'text-right' : ''}>
                      {language === 'ar' ? 'نوع المخالفة' : 'Violation Type'}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className={language === 'ar' ? 'text-right' : ''}>
                        {row.violation_number || (language === 'ar' ? 'سيتم التوليد تلقائياً' : 'Auto-generated')}
                      </TableCell>
                      <TableCell className={`font-medium ${language === 'ar' ? 'text-right' : ''}`}>
                        {row.license_plate}
                      </TableCell>
                      <TableCell className={language === 'ar' ? 'text-right' : ''}>
                        {row.violation_date ? new Date(row.violation_date).toLocaleDateString() : (language === 'ar' ? 'غير محدد' : 'Not specified')}
                      </TableCell>
                      <TableCell className={language === 'ar' ? 'text-right' : ''}>
                        {row.fine_amount || (language === 'ar' ? 'غير محدد' : 'Not specified')}
                      </TableCell>
                      <TableCell className={language === 'ar' ? 'text-right' : ''}>
                        {row.violation_charge || (language === 'ar' ? 'غير محدد' : 'Not specified')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className={`text-sm text-muted-foreground mt-2 ${language === 'ar' ? 'text-right' : ''}`}>
              {language === 'ar' 
                ? `عرض أول ${previewData.length} صفوف. سيتم استيراد جميع الصفوف الصالحة.`
                : `Showing first ${previewData.length} rows. All valid rows will be imported.`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Import Results */}
      {importStats && (
        <Card>
          <CardHeader>
            <CardTitle className={language === 'ar' ? 'text-right' : ''}>
              {language === 'ar' ? 'نتائج الاستيراد' : 'Import Results'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className={`text-center ${language === 'ar' ? 'text-right' : ''}`}>
                <div className="text-2xl font-bold">{importStats.total}</div>
                <div className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'إجمالي الصفوف' : 'Total Rows'}
                </div>
              </div>
              <div className={`text-center ${language === 'ar' ? 'text-right' : ''}`}>
                <div className="text-2xl font-bold text-green-600">{importStats.success}</div>
                <div className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'نجح' : 'Success'}
                </div>
              </div>
              <div className={`text-center ${language === 'ar' ? 'text-right' : ''}`}>
                <div className="text-2xl font-bold text-red-600">{importStats.failed}</div>
                <div className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'فشل' : 'Failed'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Button */}
      {file && previewData.length > 0 && !importStats && (
        <Card>
          <CardFooter className={`flex ${language === 'ar' ? 'flex-row-reverse justify-end' : 'justify-end'}`}>
            <Button 
              onClick={handleImport} 
              disabled={isLoading}
              className={language === 'ar' ? 'flex-row-reverse' : ''}
            >
              {isLoading ? (
                <>
                  <Check className={`h-4 w-4 animate-spin ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                  {language === 'ar' ? 'جاري الاستيراد...' : 'Importing...'}
                </>
              ) : (
                <>
                  <FileUp className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                  {language === 'ar' ? 'استيراد البيانات' : 'Import Data'}
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default TrafficFineImport;
