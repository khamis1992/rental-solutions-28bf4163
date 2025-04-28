
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExtendedPayment } from "./PaymentHistory.types";
import { Textarea } from "@/components/ui/textarea";

interface PaymentEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (paymentId: string, updateData: Partial<ExtendedPayment>) => Promise<void>;
  payment: ExtendedPayment;
}

const PaymentEditDialog = ({
  isOpen,
  onClose,
  onSave,
  payment
}: PaymentEditDialogProps) => {
  const [amount, setAmount] = useState(payment.amount);
  const [amountPaid, setAmountPaid] = useState(payment.amount_paid);
  const [paymentMethod, setPaymentMethod] = useState<string>(payment.payment_method || '');
  const [status, setStatus] = useState(payment.status);
  const [referenceNumber, setReferenceNumber] = useState(payment.reference_number || '');
  const [notes, setNotes] = useState(payment.notes || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const updateData: Partial<ExtendedPayment> = {
        amount,
        amount_paid: amountPaid,
        balance: amount - amountPaid,
        payment_method: paymentMethod || null,
        status,
        reference_number: referenceNumber || '',
        notes: notes || ''
      };
      
      await onSave(payment.id, updateData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Payment</DialogTitle>
          <DialogDescription>
            Update payment details below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 items-center gap-4">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                required
              />
            </div>

            <div className="grid grid-cols-2 items-center gap-4">
              <Label htmlFor="amountPaid">Amount Paid</Label>
              <Input
                id="amountPaid"
                type="number"
                step="0.01"
                value={amountPaid}
                onChange={(e) => setAmountPaid(Number(e.target.value))}
                required
              />
            </div>

            <div className="grid grid-cols-2 items-center gap-4">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="paymentMethod">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 items-center gap-4">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 items-center gap-4">
              <Label htmlFor="referenceNumber">Reference Number</Label>
              <Input
                id="referenceNumber"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 items-center gap-4">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="col-span-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentEditDialog;
