import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// Alert components not used - removed to fix TS6192
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Upload, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/lib/supabase';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

interface ImportError {
  row: number;
  field: string;
  message: string;
}

interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: ImportError[];
}

const CSVImportModal: React.FC<CSVImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [, setIsUploading] = useState(false);
  const [, setUploadProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [, setPreviewData] = useState<any[]>([]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    },
    multiple: false,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setSelectedFile(file);
        previewCSV(file);
      }
    }
  });

  const previewCSV = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split('\n').slice(0, 6); // Preview first 5 rows + header
      const rows = lines.map(line => line.split(','));
      setPreviewData(rows);
    } catch (error) {
      console.error('Error previewing CSV:', error);
      toast.error('خطأ في قراءة الملف');
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('الرجاء اختيار ملف CSV');
      return;
    }

      setIsUploading(true);
      setUploadProgress(0);
    setImportResult(null);

    try {
      const text = await selectedFile.text();
      const lines = text.split('\n');
      const header = lines[0].split(',');
      const data = lines.slice(1).map(line => {
        const values = line.split(',');
        return header.reduce((obj: any, key, index) => {
          obj[key.trim()] = values[index] ? values[index].trim() : null;
          return obj;
        }, {});
      });

      const totalRows = data.length;
      let successfulRows = 0;
      let failedRows = 0;
      const errors: ImportError[] = [];

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        try {
          // Example: Assuming you are importing customers
          const { error } = await supabase
            .from('customers')
            .insert([row]);

          if (error) {
            failedRows++;
            errors.push({
              row: i + 2, // +2 for header and 0-based index
              field: 'N/A',
              message: error.message,
            });
          } else {
            successfulRows++;
          }
        } catch (err: any) {
          failedRows++;
          errors.push({
            row: i + 2,
            field: 'N/A',
            message: err.message || 'Import failed',
          });
        }

        const progress = ((i + 1) / data.length) * 100;
        setUploadProgress(progress);
      }

      setImportResult({
        total: totalRows,
        successful: successfulRows,
        failed: failedRows,
        errors: errors,
      });

      toast.success(`تم استيراد ${successfulRows} صف بنجاح. ${failedRows} صف فشل.`);
      onImportComplete();
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error('حدث خطأ أثناء الاستيراد');
      setImportResult({
        total: 0,
        successful: 0,
        failed: 0,
        errors: [{ row: 0, field: 'N/A', message: error.message || 'Import failed' }],
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]" dir="rtl">
        <DialogHeader>
          <DialogTitle>استيراد البيانات من ملف CSV</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">رفع الملف</TabsTrigger>
            <TabsTrigger value="preview" disabled={!selectedFile}>
              معاينة البيانات
            </TabsTrigger>
            <TabsTrigger value="results" disabled={!importResult}>
              نتائج الاستيراد
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>اختر ملف CSV</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  {selectedFile ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">
                        حجم الملف: {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm">اسحب وأفلت ملف CSV هنا أو انقر للاختيار</p>
                      <p className="text-xs text-gray-500">
                        يجب أن يحتوي الملف على الأعمدة المطلوبة
                      </p>
                    </div>
                  )}
                </div>

                {selectedFile && (
                  <div className="mt-4 flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewData([]);
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      إزالة الملف
                    </Button>
                    <Button onClick={handleImport}>
                      معاينة البيانات
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview">
            {/* Preview content */}
          </TabsContent>

          <TabsContent value="results">
            {/* Results content */}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CSVImportModal;
