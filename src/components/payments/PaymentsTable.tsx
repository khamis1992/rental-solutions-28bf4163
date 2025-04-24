
import React from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Payment } from '@/hooks/use-payments';
import { PaymentRow } from './PaymentRow';
import { PendingPaymentRow } from './PendingPaymentRow';

interface PaymentsTableProps {
  payments: Payment[];
  pendingPayments: Array<{ due_date: Date; amount: number }>;
  onDeletePayment: (id: string) => void;
  onAddPayment?: () => void;
}

export const PaymentsTable = ({ payments, pendingPayments, onDeletePayment, onAddPayment }: PaymentsTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((payment) => (
          <PaymentRow 
            key={payment.id}
            payment={payment}
            onDeletePayment={onDeletePayment}
          />
        ))}
        
        {pendingPayments.map((pending, index) => (
          <PendingPaymentRow
            key={`pending-${index}`}
            dueDate={pending.due_date}
            amount={pending.amount}
            onAddPayment={onAddPayment!}
          />
        ))}
      </TableBody>
    </Table>
  );
};
