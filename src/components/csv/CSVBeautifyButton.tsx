import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { downloadBeautifiedCSV } from '@/utils/csv-utils';
import { Sparkles, Upload } from 'lucide-react';

interface CSVBeautifyButtonProps {
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

export function CSVBeautifyButton({ variant = "outline", size = "default" }: CSVBeautifyButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
    } else {
      toast.error('يرجى اختيار ملف CSV صالح');
    }
  };

  const handleBeautify = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    try {
      await downloadBeautifiedCSV(selectedFile, `جميل_${selectedFile.name}`);
      toast.success('تم تجميل ملف CSV بنجاح!');
      setIsOpen(false);
      setSelectedFile(null);
    } catch (error) {
      console.error('Error beautifying CSV:', error);
      toast.error('فشل في تجميل ملف CSV');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Button 
        variant={variant} 
        size={size}
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Sparkles className="h-4 w-4" />
        تجميل CSV
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              تجميل ملف CSV
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              اختر ملف CSV لتجميله بتنسيق أفضل مع مسافات منتظمة وهيكل نظيف
            </div>
            
            <div className="space-y-2">
              <label htmlFor="csv-file" className="text-sm font-medium">
                اختر ملف CSV
              </label>
              <div className="flex items-center gap-2">
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="flex-1"
                />
                <Upload className="h-4 w-4 text-muted-foreground" />
              </div>
              {selectedFile && (
                <div className="text-xs text-muted-foreground">
                  الملف المحدد: {selectedFile.name}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsOpen(false);
                  setSelectedFile(null);
                }}
              >
                إلغاء
              </Button>
              <Button 
                onClick={handleBeautify}
                disabled={!selectedFile || isProcessing}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {isProcessing ? 'جاري التجميل...' : 'تجميل الملف'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}