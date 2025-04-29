
import React, { useMemo, useCallback } from 'react';
// Using public asset as demonstration
const heroImg = '/og-image.png';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PaymentRow from './PaymentRow';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import type { Payment } from '@/components/agreements/PaymentHistory.types';

interface PaymentListProps {
  payments: Payment[];
  onDeletePayment?: (paymentId: string) => void;
}

const PaymentList: React.FC<PaymentListProps> = ({ payments, onDeletePayment }) => {
  const memoizedPayments = useMemo(() => payments, [payments]);



  return (
    <>
      <img src={heroImg} alt="Payments" style={{maxWidth: 200, marginBottom: 16}} />
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
          {memoizedPayments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No payments found.
              </TableCell>
            </TableRow>
          ) : (
            memoizedPayments.map((payment) => (
              <PaymentRow payment={payment} key={payment.id} />
            ))
          )}
        </TableBody>
      </Table>
    </>
  );
};

export default PaymentList;
