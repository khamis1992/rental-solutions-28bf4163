
import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Payment } from "./PaymentHistory";
import { format, parseISO } from "date-fns";

interface PaymentEditDialogProps {
  payment: Payment;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const PaymentEditDialog: React.FC<PaymentEditDialogProps> = ({
  payment,
  isOpen,
  onClose,
  onComplete,
}) => {
  const [amount, setAmount] = useState(payment.amount.toString());
  const [paymentDate, setPaymentDate] = useState(
    payment.payment_date
      ? format(
          typeof payment.payment_date === "string"
            ? parseISO(payment.payment_date)
            : new Date(payment.payment_date),
          "yyyy-MM-dd"
        )
      : ""
  );
  const [notes, setNotes] = useState(payment.notes || "");
  const [paymentMethod, setPaymentMethod] = useState(payment.payment_method || "");
  const [referenceNumber, setReferenceNumber] = useState(payment.reference_number || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }

      const { error } = await supabase
        .from("unified_payments")
        .update({
          amount: parsedAmount,
          payment_date: new Date(paymentDate).toISOString(),
          description: notes,
          payment_method: paymentMethod,
          transaction_id: referenceNumber,
        })
        .eq("id", payment.id);

      if (error) {
        throw error;
      }

      toast.success("Payment updated successfully");
      onComplete();
    } catch (error) {
      console.error("Error updating payment:", error);
      toast.error("Failed to update payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Payment</DialogTitle>
          <DialogDescription>Update the payment details</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentDate">Payment Date</Label>
            <Input
              id="paymentDate"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Input
              id="paymentMethod"
              type="text"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              placeholder="e.g., Cash, Credit Card"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="referenceNumber">Reference Number</Label>
            <Input
              id="referenceNumber"
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g., Transaction ID, Check Number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional information about this payment"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
