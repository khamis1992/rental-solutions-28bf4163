
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Upload, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ReceiptScannerProps {
  onScanComplete: (data: {
    amount: number;
    date: Date;
    description: string;
    vendor?: string;
  }) => void;
}

const ReceiptScanner: React.FC<ReceiptScannerProps> = ({ onScanComplete }) => {
  const [scanning, setScanning] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setScanning(true);
      
      // Create preview
      setPreview(URL.createObjectURL(file));

      // Upload to storage
      const timestamp = Date.now();
      const filename = `receipts/${timestamp}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('receipts')
        .upload(filename, file);

      if (error) throw error;

      // TODO: In production, integrate with OCR service
      // For now, simulate OCR with dummy data
      const mockOCRData = {
        amount: parseFloat((Math.random() * 1000).toFixed(2)),
        date: new Date(),
        description: "Business Expense",
        vendor: "Sample Vendor"
      };

      onScanComplete(mockOCRData);
    } catch (error) {
      console.error('Error processing receipt:', error);
    } finally {
      setScanning(false);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="p-4">
        <div className="flex flex-col items-center gap-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            id="receipt-upload"
            capture="environment"
          />
          
          {preview && (
            <div className="relative w-full aspect-[3/4]">
              <img
                src={preview}
                alt="Receipt preview"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => document.getElementById('receipt-upload')?.click()}
              disabled={scanning}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
            
            <Button
              variant="default"
              onClick={() => document.getElementById('receipt-upload')?.click()}
              disabled={scanning}
            >
              <Camera className="w-4 h-4 mr-2" />
              Scan
            </Button>
          </div>

          {scanning && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Processing receipt...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReceiptScanner;
