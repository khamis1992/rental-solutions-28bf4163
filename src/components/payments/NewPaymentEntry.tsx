import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ChevronLeft } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface NewPaymentEntryProps {
  onBack: () => void;
  onClose: () => void;
}

export function NewPaymentEntry({ onBack, onClose }: NewPaymentEntryProps) {
  const [note, setNote] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.png', '.jpg'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast.error("يرجى إدخال مبلغ دفع صحيح");
      return;
    }

    setLoading(true);

    try {
      // Here we would normally process the payment and upload the file
      // Simulate a successful payment recording
      setTimeout(() => {
        toast.success("تم تسجيل الدفعة بنجاح");
        onClose();
      }, 1000);
    } catch (error) {
      toast.error("فشل في تسجيل الدفعة. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
      <Button
        type="button"
        variant="ghost"
        className="mb-2 flex-row-reverse"
        onClick={onBack}
      >
        <ChevronLeft className="h-4 w-4 ml-2" />
        العودة
      </Button>

      <div className="space-y-2">
        <Label htmlFor="amount" className="text-right">مبلغ الدفعة</Label>
        <Input
          id="amount"
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          className="text-lg text-right"
          min="0.01"
          step="0.01"
          dir="rtl"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="paymentMethod" className="text-right">طريقة الدفع</Label>
        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
          <SelectTrigger className="text-right" dir="rtl">
            <SelectValue placeholder="اختر طريقة الدفع" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">نقدي</SelectItem>
            <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
            <SelectItem value="credit_card">بطاقة ائتمان</SelectItem>
            <SelectItem value="cheque">شيك</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="note" className="text-right">ملاحظة الدفعة</Label>
        <Textarea
          id="note"
          placeholder="أدخل تفاصيل الدفعة (مثل: رقم الفاتورة #12345)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="text-right"
          dir="rtl"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-right">رفع الفاتورة</Label>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors ${
            isDragActive ? 'border-primary bg-primary/5' : 'border-border'
          }`}
        >
          <input {...getInputProps()} />
          {file ? (
            <p className="text-sm text-right">تم اختيار الملف: {file.name}</p>
          ) : isDragActive ? (
            <p className="text-sm">أفلت الملف هنا...</p>
          ) : (
            <p className="text-sm">
              اسحب وأفلت الفاتورة هنا، أو انقر للاختيار<br />
              (PDF, JPEG, PNG)
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 flex-row-reverse">
        <Button type="button" variant="outline" onClick={onClose}>
          إلغاء
        </Button>
        <Button type="submit" disabled={!amount || loading}>
          {loading ? "جاري المعالجة..." : "تسجيل الدفعة"}
        </Button>
      </div>
    </form>
  );
}
