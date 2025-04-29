import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface PaymentRowProps {
  payment: any; // Replace 'any' with the correct type if available
}

const PaymentRow: React.FC<PaymentRowProps> = ({ payment }) => {
  return (
    <TableRow key={payment.id} className="hover:bg-muted/50">
      <TableCell>{payment.date}</TableCell>
      <TableCell>{payment.amount}</TableCell>
      <TableCell>{payment.method}</TableCell>
      <TableCell>
        <Badge variant={payment.status === 'paid' ? 'default' : 'secondary'}>
          {payment.status}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        {/* Action buttons/menus can go here */}
      </TableCell>
    </TableRow>
  );
};

export default React.memo(PaymentRow);
