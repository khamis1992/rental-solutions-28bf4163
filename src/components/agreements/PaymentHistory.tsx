import React, { useState, useEffect, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarDays, ChevronsUpDown, Copy, Edit, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { Listbox } from '@headlessui/react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"

export function PaymentHistory({
  payments,
  isLoading,
  onPaymentDeleted,
  rentAmount,
  leaseStartDate,
  leaseEndDate
}: {
  payments: any[];
  isLoading: boolean;
  onPaymentDeleted: () => void;
  rentAmount: number | null;
  leaseStartDate?: Date | string;
  leaseEndDate?: Date | string;
}) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editAmount, setEditAmount] = useState('');
  const [editPaymentDate, setEditPaymentDate] = useState<Date | undefined>(undefined);
  const [editNotes, setEditNotes] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState('');
  const [editReferenceNumber, setEditReferenceNumber] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);

  const formatDate = (date: string | Date) => {
    try {
      return new Date(date).toLocaleDateString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  const handleCopyPaymentDetails = (payment: any) => {
    const paymentDetails = `
      Amount: ${payment.amount}
      Date: ${formatDate(payment.payment_date)}
      Method: ${payment.payment_method || 'N/A'}
      Reference: ${payment.reference_number || 'N/A'}
      Notes: ${payment.notes || 'N/A'}
    `;
    navigator.clipboard.writeText(paymentDetails);
    toast.success('Payment details copied to clipboard!');
  };

  const handleEditPayment = (payment: any) => {
    setSelectedPayment(payment);
    setEditAmount(payment.amount.toString());
    setEditPaymentDate(payment.payment_date ? new Date(payment.payment_date) : undefined);
    setEditNotes(payment.notes || '');
    setEditPaymentMethod(payment.payment_method || '');
    setEditReferenceNumber(payment.reference_number || '');
    setIsEditDialogOpen(true);
  };

  const handleDeletePayment = (payment: any) => {
    setPaymentToDelete(payment);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeletePayment = async () => {
    if (paymentToDelete && paymentToDelete.id) {
      try {
        const { error } = await supabase
          .from('unified_payments')
          .delete()
          .eq('id', paymentToDelete.id);

        if (error) {
          console.error('Error deleting payment:', error);
          toast.error('Failed to delete payment');
        } else {
          toast.success('Payment deleted successfully');
          onPaymentDeleted();
        }
      } catch (error) {
        console.error('Error deleting payment:', error);
        toast.error('Failed to delete payment');
      } finally {
        setIsDeleteDialogOpen(false);
        setPaymentToDelete(null);
      }
    }
  };

  const handleUpdatePayment = async () => {
    if (!selectedPayment) return;

    try {
      const { data, error } = await supabase
        .from('unified_payments')
        .update({
          amount: parseFloat(editAmount),
          payment_date: editPaymentDate ? editPaymentDate.toISOString() : null,
          notes: editNotes,
          payment_method: editPaymentMethod,
          reference_number: editReferenceNumber,
        })
        .eq('id', selectedPayment.id)
        .select();

      if (error) {
        console.error('Error updating payment:', error);
        toast.error('Failed to update payment');
      } else {
        toast.success('Payment updated successfully');
        onPaymentDeleted();
      }
    } catch (error) {
      console.error('Error updating payment:', error);
      toast.error('Failed to update payment');
    } finally {
      setIsEditDialogOpen(false);
      setSelectedPayment(null);
    }
  };

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Payment History</h3>
      {isLoading ? (
        <p>Loading payment history...</p>
      ) : payments.length === 0 ? (
        <p>No payment history found.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{formatDate(payment.payment_date)}</TableCell>
                <TableCell>{formatCurrency(payment.amount)}</TableCell>
                <TableCell>{payment.payment_method || 'N/A'}</TableCell>
                <TableCell>{payment.reference_number || 'N/A'}</TableCell>
                <TableCell>{payment.notes || 'N/A'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleCopyPaymentDetails(payment)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEditPayment(payment)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeletePayment(payment)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Payment</DialogTitle>
            <DialogDescription>
              Make changes to the selected payment.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editAmount" className="text-right">
                Amount
              </Label>
              <Input
                type="number"
                id="editAmount"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editPaymentDate" className="text-right">
                Payment Date
              </Label>
              <DatePicker
                id="editPaymentDate"
                value={editPaymentDate}
                onValueChange={setEditPaymentDate}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editPaymentMethod" className="text-right">
                Payment Method
              </Label>
              <Select onValueChange={setEditPaymentMethod}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a method" defaultValue={editPaymentMethod} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="mobile_payment">Mobile Payment</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editReferenceNumber" className="text-right">
                Reference Number
              </Label>
              <Input
                type="text"
                id="editReferenceNumber"
                value={editReferenceNumber}
                onChange={(e) => setEditReferenceNumber(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="editNotes" className="text-right mt-2">
                Notes
              </Label>
              <Textarea
                id="editNotes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="button" variant="secondary" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleUpdatePayment}>
              Update Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Payment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this payment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button type="button" variant="secondary" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" onClick={confirmDeletePayment}>
              Delete Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
