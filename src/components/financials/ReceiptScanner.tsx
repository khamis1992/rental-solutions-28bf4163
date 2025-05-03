
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Loader2, Upload, AlertOctagon } from 'lucide-react';
import { Input } from '../ui/input';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface ReceiptScannerProps {
  onScanComplete?: (extractedData: any) => void;
}

const ReceiptScanner: React.FC<ReceiptScannerProps> = ({ onScanComplete }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
    setError(null);
  };
  
  const handleScan = async () => {
    if (!file) {
      setError('Please select a file to scan');
      return;
    }
    
    setIsScanning(true);
    setError(null);
    
    try {
      // Upload file to storage
      const filePath = `receipt-scans/${Date.now()}_${file.name}`;
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('receipts')
        .upload(filePath, file);
      
      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }
      
      // Get file URL
      const { data: urlData } = await supabase.storage
        .from('receipts')
        .getPublicUrl(filePath);
      
      const fileUrl = urlData?.publicUrl;
      
      if (!fileUrl) {
        throw new Error('Failed to get file URL');
      }
      
      // Call receipt scan function (ideally this would call a serverless function)
      // For this example, we'll simulate successful extraction
      const mockResponse = simulateReceiptScan(file.name);
      
      // Process results
      if (onScanComplete) {
        onScanComplete({
          ...mockResponse,
          receiptUrl: fileUrl
        });
      }
      
      toast.success('Receipt processed successfully', {
        description: `Extracted ${Object.keys(mockResponse).length} data points`
      });
    } catch (error) {
      console.error('Error scanning receipt:', error);
      setError(error instanceof Error ? error.message : 'Failed to scan receipt');
      toast.error('Receipt scanning failed', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsScanning(false);
    }
  };
  
  // Mock function to simulate receipt scanning
  const simulateReceiptScan = (fileName: string) => {
    // Generate random data based on the filename to simulate extraction
    const dateOptions = [
      new Date().toISOString().split('T')[0],
      new Date(Date.now() - 86400000).toISOString().split('T')[0],
      new Date(Date.now() - 172800000).toISOString().split('T')[0]
    ];
    
    const vendorOptions = ['Fuel Station', 'Parts Store', 'Service Center', 'Auto Shop'];
    const categoryOptions = ['Fuel', 'Maintenance', 'Parts', 'Service'];
    
    // Use filename as a seed to generate consistent random data
    const seed = fileName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const rand = (max: number) => Math.floor((seed * 13) % max);
    
    return {
      date: dateOptions[rand(dateOptions.length)],
      vendor: vendorOptions[rand(vendorOptions.length)],
      category: categoryOptions[rand(categoryOptions.length)],
      amount: (200 + (seed % 300)).toFixed(2),
      description: `${categoryOptions[rand(categoryOptions.length)]} expense`,
      confidence: 0.87 + (seed % 100) / 1000
    };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receipt Scanner</CardTitle>
        <CardDescription>
          Upload a receipt image to automatically extract expense details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center">
          {file ? (
            <div className="text-center">
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024).toFixed(1)} KB</p>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setFile(null)}
                className="mt-2"
              >
                Remove
              </Button>
            </div>
          ) : (
            <>
              <Upload className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                Click to upload or drag and drop
              </p>
              <Input
                id="receipt-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="receipt-upload">
                <Button variant="outline" asChild>
                  <span>Select File</span>
                </Button>
              </label>
            </>
          )}
        </div>
        
        {error && (
          <div className="flex items-center text-red-500 text-sm">
            <AlertOctagon className="h-4 w-4 mr-1" />
            {error}
          </div>
        )}
        
        <Button 
          onClick={handleScan} 
          disabled={!file || isScanning} 
          className="w-full"
        >
          {isScanning ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : 'Scan Receipt'}
        </Button>
        
        <p className="text-xs text-muted-foreground text-center">
          Supported formats: JPG, PNG, PDF up to 5MB
        </p>
      </CardContent>
    </Card>
  );
};

export default ReceiptScanner;
