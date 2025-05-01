
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, ScanLine, Loader2 } from 'lucide-react';
import { Client } from '@/lib/supabase';
import { toast } from 'sonner';

interface ReceiptScannerProps {
  onScanComplete: (extractedData: {
    amount?: number;
    date?: string;
    vendor?: string;
    category?: string;
  }) => void;
}

const ReceiptScanner: React.FC<ReceiptScannerProps> = ({ onScanComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  
  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Mock the image upload and processing
      // In a real app, this would upload to Supabase storage and call an AI service
      setTimeout(() => {
        setIsUploading(false);
        setIsProcessing(true);
        
        // Mock processing delay
        setTimeout(() => {
          setIsProcessing(false);
          
          // Mock extracted data
          const extractedData = {
            amount: Math.floor(Math.random() * 100) + 10,
            date: new Date().toISOString().split('T')[0],
            vendor: 'Sample Vendor',
            category: 'Office Supplies'
          };
          
          onScanComplete(extractedData);
          toast.success('Receipt scanned successfully');
        }, 2000);
      }, 1500);
    } catch (error) {
      setIsUploading(false);
      toast.error('Failed to upload receipt');
      console.error('Upload error:', error);
    }
  };
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="text-center">
            <ScanLine className="mx-auto h-10 w-10 text-primary mb-2" />
            <h3 className="text-lg font-medium">Receipt Scanner</h3>
            <p className="text-sm text-muted-foreground">
              Upload a receipt image to automatically extract details
            </p>
          </div>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Label htmlFor="receipt" className="block cursor-pointer">
              <Input
                id="receipt"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="space-y-2">
                <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG or PDF up to 5MB
                </p>
              </div>
            </Label>
            {file && (
              <p className="mt-2 text-sm text-muted-foreground">
                Selected: {file.name}
              </p>
            )}
          </div>
          
          <Button
            onClick={handleUpload}
            disabled={!file || isUploading || isProcessing}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Scan Receipt'
            )}
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            This feature uses AI to extract information from your receipt.
            Results may require verification.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReceiptScanner;
