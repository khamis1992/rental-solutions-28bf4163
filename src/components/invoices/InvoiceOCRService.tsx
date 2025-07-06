import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface InvoiceOCRResult {
  success: boolean;
  text?: string;
  error?: string;
  processingTime?: number;
}

export function InvoiceOCRService() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<InvoiceOCRResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const processInvoice = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setIsProcessing(true);
    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result;
          if (!result || typeof result !== 'string') {
            reject(new Error('Failed to read file'));
            return;
          }
          const base64Data = result.split(',')[1];
          if (!base64Data) {
            reject(new Error('Invalid file format'));
            return;
          }
          resolve(base64Data);
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      // Call OCR edge function
      const { data, error } = await supabase.functions.invoke('process-invoice-ocr', {
        body: {
          imageBase64: base64,
          options: {
            languageHints: ['ar', 'en']
          }
        }
      });

      if (error) throw error;

      setResult(data);
      if (data.success) {
        toast.success(`OCR completed in ${data.processingTime}ms`);
      } else {
        toast.error(data.error || 'OCR failed');
      }
    } catch (error) {
      console.error('OCR error:', error);
      toast.error('Failed to process invoice');
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice OCR Processing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isProcessing}
          />
        </div>
        
        <Button 
          onClick={processInvoice} 
          disabled={!file || isProcessing}
          className="w-full"
        >
          {isProcessing ? 'Processing...' : 'Process Invoice'}
        </Button>

        {result && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className={result.success ? 'text-green-600' : 'text-red-600'}>
                {result.success ? 'Success' : 'Error'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.success ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Processing time: {result.processingTime}ms
                  </p>
                  <div className="bg-muted p-3 rounded whitespace-pre-wrap">
                    {result.text}
                  </div>
                </div>
              ) : (
                <p className="text-red-600">{result.error}</p>
              )}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}

export default InvoiceOCRService;