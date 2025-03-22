
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Payment } from "./PaymentHistory";

interface PaymentEditDialogProps {
  payment: Payment | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function PaymentEditDialog({ payment, isOpen, onClose, onSave }: PaymentEditDialogProps) {
  const [amount, setAmount] = useState(payment?.amount || 0);
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(
    payment?.payment_date ? new Date(payment.payment_date) : undefined
  );
  const [paymentMethod, setPaymentMethod] = useState(payment?.payment_method || "cash");
  const [reference, setReference] = useState(payment?.reference_number || "");
  const [notes, setNotes] = useState(payment?.notes || "");
  const [status, setStatus] = useState(payment?.status || "pending");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rentAmount, setRentAmount] = useState<number | null>(null);

  // Reset form when payment changes
  useEffect(() => {
    if (payment) {
      setAmount(payment.amount);
      setPaymentDate(payment.payment_date ? new Date(payment.payment_date) : undefined);
      setPaymentMethod(payment.payment_method || "cash");
      setReference(payment.reference_number || "");
      setNotes(payment.notes || "");
      setStatus(payment.status || "pending");
      
      // Fetch rent amount from leases table
      if (payment.lease_id) {
        fetchRentAmount(payment.lease_id);
      }
    }
  }, [payment]);

  const fetchRentAmount = async (leaseId: string) => {
    try {
      const { data, error } = await supabase
        .from("leases")
        .select("rent_amount")
        .eq("id", leaseId)
        .single();
      
      if (error) throw error;
      if (data && data.rent_amount) {
        setRentAmount(data.rent_amount);
        setAmount(data.rent_amount); // Set the amount to the rent amount
      }
    } catch (error) {
      console.error("Error fetching rent amount:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!payment) return;
    if (!paymentDate) {
      toast.error("Please select a payment date");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Update the payment in the unified_payments table
      const { error } = await supabase
        .from("unified_payments")
        .update({
          amount: amount,
          payment_date: paymentDate.toISOString(),
          payment_method: paymentMethod,
          transaction_id: reference,
          description: notes,
          status: status
        })
        .eq("id", payment.id);
      
      if (error) throw error;
      
      toast.success("Payment updated successfully");
      onSave();
      onClose();
    } catch (error) {
      console.error("Error updating payment:", error);
      toast.error("Failed to update payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Payment</DialogTitle>
          <DialogDescription>
            Update the payment details
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  required
                />
                {rentAmount !== null && rentAmount !== amount && (
                  <p className="text-xs text-muted-foreground">
                    Rent amount from lease: ${rentAmount}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Payment Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !paymentDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {paymentDate ? format(paymentDate, "PPP") : <span>Select a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={paymentDate}
                    onSelect={setPaymentDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="debit_card">Debit Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="mobile_payment">Mobile Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reference">Reference Number</Label>
              <Input
                id="reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Transaction reference (optional)"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Payment notes (optional)"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
