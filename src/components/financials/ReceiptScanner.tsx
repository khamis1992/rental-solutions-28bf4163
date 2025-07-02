
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { Camera, Upload, X } from 'lucide-react';

interface ReceiptScannerProps {
  onScanComplete?: (extractedData: any) => void;
}

export const ReceiptScanner = ({ onScanComplete }: ReceiptScannerProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<any | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImagePreview(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
      
      // Reset results when a new file is selected
      setResults(null);
    }
  };

  const handleScanReceipt = async () => {
    if (!selectedFile) return;
    
    setIsScanning(true);
    
    try {
      // Upload file to storage
      const filename = `receipt-scan-${Date.now()}-${selectedFile.name}`;
      const { data: fileData, error: uploadError } = await supabase.storage
        .from('receipt-scans')
        .upload(filename, selectedFile);
        
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: urlData } = await supabase.storage
        .from('receipt-scans')
        .getPublicUrl(filename);
        
      if (!urlData?.publicUrl) throw new Error('Failed to get public URL');
      
      // Mock OCR functionality (in a real app, you'd call an API)
      // Wait for 2 seconds to simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Sample extracted data (in a real app, this would come from your OCR API)
      const extractedData = {
        merchantName: "Sample Store",
        date: new Date().toISOString().split('T')[0],
        total: Math.floor(Math.random() * 10000) / 100,
        items: [
          { description: "Item 1", amount: Math.floor(Math.random() * 1000) / 100 },
          { description: "Item 2", amount: Math.floor(Math.random() * 1000) / 100 },
        ],
        taxAmount: Math.floor(Math.random() * 500) / 100,
        receiptNumber: `R-${Math.floor(Math.random() * 100000)}`,
        receiptImageUrl: urlData.publicUrl
      };
      
      setResults(extractedData);
      if (onScanComplete) {
        onScanComplete(extractedData);
      }
      
    } catch (error) {
      console.error('Error scanning receipt:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setResults(null);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Camera className="mr-2 h-5 w-5" />
          Receipt Scanner
        </CardTitle>
        <CardDescription>
          Upload a receipt image to extract expense details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center">
          {!imagePreview ? (
            <div className="w-full">
              <label 
                htmlFor="receipt-upload" 
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md border-gray-300 cursor-pointer bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-gray-500" />
                  <p className="mb-1 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG or PDF (max 10MB)</p>
                </div>
                <Input 
                  id="receipt-upload"
                  type="file" 
                  accept="image/*,.pdf" 
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          ) : (
            <div className="relative w-full flex justify-center mb-4">
              <img 
                src={imagePreview} 
                alt="Receipt preview" 
                className="max-h-64 rounded-md shadow-sm" 
              />
              <button 
                onClick={handleClearSelection}
                className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          
          {selectedFile && !results && (
            <Button 
              onClick={handleScanReceipt}
              disabled={isScanning}
              className="mt-4"
            >
              {isScanning ? "Scanning..." : "Scan Receipt"}
            </Button>
          )}
          
          {results && (
            <div className="w-full mt-4 p-4 border rounded-md bg-gray-50">
              <h3 className="font-medium mb-2">Extracted Data</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Merchant:</span>
                  <span className="font-medium">{results.merchantName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium">{results.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Receipt #:</span>
                  <span className="font-medium">{results.receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-medium">${results.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReceiptScanner;
