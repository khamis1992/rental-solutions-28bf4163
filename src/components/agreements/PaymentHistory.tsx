
import React, { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { PaymentEditDialog } from '@/components/agreements/PaymentEditDialog';
import { Payment } from '@/types/payment-history.types';
import { Calendar } from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Update the PaymentHistoryProps interface to match the imported type
export interface PaymentHistoryProps {
  payments: any[];
  isLoading: boolean;
  rentAmount: number;
  contractAmount: number;
  leaseId: string;
  onPaymentDeleted: (paymentId: string) => void;
  onRecordPayment: (payment: Partial<Payment>) => Promise<boolean>;
  onEditPayment?: (payment: Payment) => void;
  depositPaid?: boolean;
  depositAmount?: number;
  onPaymentAdded: () => void;
  leaseStartDate?: Date;
  leaseEndDate?: Date;
}

export function PaymentHistory({
  payments, 
  isLoading,
  rentAmount,
  contractAmount,
  leaseId,
  onPaymentDeleted,
  onRecordPayment,
  onEditPayment,
  depositPaid = false,
  depositAmount = 0,
  onPaymentAdded,
  leaseStartDate,
  leaseEndDate
}: PaymentHistoryProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [paymentToEdit, setPaymentToEdit] = useState<Payment | null>(null);
  const [newPaymentAmount, setNewPaymentAmount] = useState('');
  const [newPaymentDate, setNewPaymentDate] = useState<Date | undefined>(undefined);
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  const totalPaid = payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
  const remainingBalance = contractAmount - totalPaid;

  const handleOpenEditDialog = (payment: Payment) => {
    setPaymentToEdit(payment);
    setIsDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setIsDialogOpen(false);
    setPaymentToEdit(null);
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!window.confirm('Are you sure you want to delete this payment?')) {
      return;
    }
    onPaymentDeleted(paymentId);
  };

  const handleRecordNewPayment = async () => {
    if (!newPaymentAmount || !newPaymentDate) {
      toast({
        title: 'Error',
        description: 'Please enter both amount and date for the payment.',
        variant: 'destructive',
      });
      return;
    }

    const amount = parseFloat(newPaymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid payment amount.',
        variant: 'destructive',
      });
      return;
    }

    setIsRecordingPayment(true);
    const paymentData: Partial<Payment> = {
      lease_id: leaseId,
      amount: amount,
      payment_date: newPaymentDate.toISOString(),
    };

    try {
      const success = await onRecordPayment(paymentData);
      setIsRecordingPayment(false);

      if (success) {
        toast({
          title: 'Success',
          description: 'Payment recorded successfully.',
        });
        setNewPaymentAmount('');
        setNewPaymentDate(undefined);
        onPaymentAdded();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to record payment. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      setIsRecordingPayment(false);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">Loading payments...</TableCell>
              </TableRow>
            ) : payments?.length > 0 ? (
              payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{format(new Date(payment.payment_date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{formatCurrency(payment.amount || 0)}</TableCell>
                  <TableCell className="flex items-center space-x-2">
                    {onEditPayment && (
                      <Button variant="ghost" size="sm" onClick={() => handleOpenEditDialog(payment)}>
                        Edit
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleDeletePayment(payment.id)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">No payments found.</TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2}>Total Paid</TableCell>
              <TableCell>{formatCurrency(totalPaid)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={2}>Remaining Balance</TableCell>
              <TableCell>{formatCurrency(remainingBalance)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              type="number"
              id="amount"
              placeholder="0.00"
              value={newPaymentAmount}
              onChange={(e) => setNewPaymentAmount(e.target.value)}
            />
          </div>
          <div>
            <Label>Payment Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={'outline'}
                  className={
                    'w-full justify-start text-left font-normal' +
                    (newPaymentDate ? ' pl-3' : ' text-muted-foreground')
                  }
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {newPaymentDate ? format(newPaymentDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center" side="bottom">
                <CalendarComponent
                  mode="single"
                  selected={newPaymentDate}
                  onSelect={setNewPaymentDate}
                  disabled={(date) =>
                    date > new Date() || (leaseStartDate && date < leaseStartDate)
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <Button onClick={handleRecordNewPayment} disabled={isRecordingPayment}>
          {isRecordingPayment ? 'Recording...' : 'Record Payment'}
        </Button>
      </CardContent>
      {paymentToEdit && onEditPayment && (
        <PaymentEditDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          payment={paymentToEdit}
          onEdit={onEditPayment}
          onClose={handleCloseEditDialog}
        />
      )}
    </Card>
  );
}
