import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PaymentEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    amount: number,
    date: Date,
    notes: string | undefined,
    method: string | undefined,
    reference: string | undefined
  ) => Promise<boolean>;
  defaultAmount?: number;
  title?: string;
  description?: string;
  leaseId?: string;
  rentAmount?: number | null;
  selectedPayment?: any;
}

export function PaymentEntryDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultAmount = 0,
  title = 'تسجيل دفعة',
  description = 'أدخل تفاصيل الدفعة',
}: PaymentEntryDialogProps) {
  const [amount, setAmount] = useState(defaultAmount.toString());
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState('');
  const [method, setMethod] = useState<string>('');
  const [reference, setReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount(defaultAmount.toString());
      setPaymentDate(new Date());
      setNotes('');
      setMethod('');
      setReference('');
    }
  }, [open, defaultAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await onSubmit(
        amountValue,
        paymentDate,
        notes || undefined,
        method || undefined,
        reference || undefined
      );
      
      if (success) {
        toast.success('تم تسجيل الدفعة بنجاح');
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error submitting payment:', error);
      toast.error('فشل في تسجيل الدفعة');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="text-right">{description}</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-right block">المبلغ (ر.ق)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
              className="text-right"
              dir="rtl"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-right block">تاريخ الدفع</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-right font-normal flex-row-reverse',
                    !paymentDate && 'text-muted-foreground'
                  )}
                  dir="rtl"
                >
                  <CalendarIcon className="h-4 w-4 ml-2" />
                  {paymentDate ? format(paymentDate, 'PPP') : 'اختر التاريخ'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={paymentDate}
                  onSelect={(date) => date && setPaymentDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="method" className="text-right block">طريقة الدفع</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="text-right" dir="rtl">
                <SelectValue placeholder="اختر طريقة الدفع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">نقدي</SelectItem>
                <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                <SelectItem value="check">شيك</SelectItem>
                <SelectItem value="credit_card">بطاقة ائتمان</SelectItem>
                <SelectItem value="online">دفع إلكتروني</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference" className="text-right block">الرقم المرجعي</Label>
            <Input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="رقم المعاملة (اختياري)"
              className="text-right"
              dir="rtl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-right block">ملاحظات</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ملاحظات إضافية (اختياري)"
              rows={3}
              className="text-right"
              dir="rtl"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 space-x-reverse">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'جاري التسجيل...' : 'تسجيل الدفعة'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
