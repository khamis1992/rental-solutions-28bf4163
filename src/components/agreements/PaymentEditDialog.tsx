
import React, { useState } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Payment } from '@/types/payment-history.types';

export interface PaymentEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: Payment | null;
  onEdit: (payment: Payment) => void;
  onClose: () => void;
}

export function PaymentEditDialog({
  open,
  onOpenChange,
  payment,
  onEdit,
  onClose
}: PaymentEditDialogProps) {
  const [editedAmount, setEditedAmount] = useState(payment?.amount?.toString() || '');
  const [editedDate, setEditedDate] = useState<Date | undefined>(
    payment?.payment_date ? new Date(payment.payment_date) : undefined
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!payment || !editedAmount || !editedDate) return;
    
    setIsSubmitting(true);
    
    const updatedPayment = {
      ...payment,
      amount: parseFloat(editedAmount),
      payment_date: editedDate.toISOString(),
    };
    
    onEdit(updatedPayment);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Payment</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount
            </Label>
            <Input
              id="amount"
              type="number"
              value={editedAmount}
              onChange={(e) => setEditedAmount(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className="col-span-3 w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {editedDate ? format(editedDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={editedDate}
                  onSelect={setEditedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
