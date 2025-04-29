import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import type { Customer } from '@/lib/validation-schemas/customer';
import StatusBadge from './StatusBadge';

interface CustomerRowProps {
  customer: Customer;
}

const CustomerRow: React.FC<CustomerRowProps> = ({ customer }) => {
  return (
    <TableRow key={customer.id} className="hover:bg-muted/50">
      <TableCell className="font-medium">
        <Link to={`/customers/${customer.id}`} className="text-primary hover:underline">
          {customer.full_name}
        </Link>
      </TableCell>
      <TableCell>{customer.email || 'N/A'}</TableCell>
      <TableCell>{customer.phone || 'N/A'}</TableCell>
      <TableCell>
        <StatusBadge status={customer.status} />
      </TableCell>
      <TableCell className="text-right">
        {/* Actions menu or buttons can be placed here */}
      </TableCell>
    </TableRow>
  );
};

export default React.memo(CustomerRow);
