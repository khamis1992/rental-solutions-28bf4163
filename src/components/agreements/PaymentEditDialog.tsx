import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExtendedPayment } from './PaymentHistory.types';

interface PaymentEditDialogProps {
  payment: ExtendedPayment;
  isOpen: boolean;
  onClose: () => void;
  onSave: (payment: ExtendedPayment) => void;
}

const PaymentEditDialog = ({ payment, isOpen, onClose, onSave }: PaymentEditDialogProps) => {
  const [formData, setFormData] = useState({
    amount: payment.amount,
    amount_paid: payment.amount_paid || 0,
    balance: payment.balance || 0,
    payment_method: payment.payment_method || '',
    status: payment.status || '',
    description: payment.description || '',
    reference_number: payment.reference_number || '',
    notes: payment.notes || ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (value: string, name: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    const updatedPayment: ExtendedPayment = {
      ...payment,
      amount: formData.amount,
      amount_paid: formData.amount_paid,
      balance: formData.balance,
      payment_method: formData.payment_method,
      status: formData.status,
      description: formData.description,
      reference_number: formData.reference_number,
      notes: formData.notes
    };
    onSave(updatedPayment);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Payment</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount
            </Label>
            <Input
              type="number"
              id="amount"
              value={formData.amount.toString()}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount_paid" className="text-right">
              Amount Paid
            </Label>
            <Input
              type="number"
              id="amount_paid"
              value={formData.amount_paid.toString()}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="balance" className="text-right">
              Balance
            </Label>
            <Input
              type="number"
              id="balance"
              value={formData.balance.toString()}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="payment_method" className="text-right">
              Payment Method
            </Label>
            <Input
              id="payment_method"
              value={formData.payment_method}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status
            </Label>
            <Select onValueChange={(value) => handleSelectChange(value, 'status')}>
              <SelectTrigger className="w-[180px] col-span-3">
                <SelectValue placeholder="Select status" defaultValue={formData.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reference_number" className="text-right">
              Reference #
            </Label>
            <Input
              id="reference_number"
              value={formData.reference_number}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notes" className="text-right">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentEditDialog;
