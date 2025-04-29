import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface ExpenseRowProps {
  expense: any; // Replace 'any' with the correct type if available
}

const ExpenseRow: React.FC<ExpenseRowProps> = ({ expense }) => {
  return (
    <TableRow key={expense.id} className="hover:bg-muted/50">
      <TableCell>{expense.date}</TableCell>
      <TableCell>{expense.description}</TableCell>
      <TableCell>{expense.category}</TableCell>
      <TableCell>{expense.amount}</TableCell>
      <TableCell>
        <Badge variant={expense.status === 'paid' ? 'default' : 'secondary'}>
          {expense.status}
        </Badge>
      </TableCell>
      <TableCell>{expense.type}</TableCell>
      <TableCell className="text-right">
        {/* Action buttons/menus can go here */}
      </TableCell>
    </TableRow>
  );
};

export default React.memo(ExpenseRow);
