import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface TrafficFineRowProps {
  fine: any; // Replace 'any' with the correct type if available
  onPay?: (id: string) => void;
  onDispute?: (id: string) => void;
  onAssign?: (id: string) => void;
}

const TrafficFineRow: React.FC<TrafficFineRowProps> = ({ fine, onPay, onDispute, onAssign }) => {
  return (
    <TableRow key={fine.id}>
      <TableCell>{fine.violationNumber}</TableCell>
      <TableCell>{fine.licensePlate}</TableCell>
      <TableCell>{fine.violationCharge}</TableCell>
      <TableCell>{fine.fineAmount}</TableCell>
      <TableCell>
        <Badge variant={fine.status === 'paid' ? 'default' : 'secondary'}>
          {fine.status}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        {onPay && (
          <Button variant="ghost" size="sm" onClick={() => onPay(fine.id)}>Pay</Button>
        )}
        {onDispute && (
          <Button variant="ghost" size="sm" onClick={() => onDispute(fine.id)}>Dispute</Button>
        )}
        {onAssign && (
          <Button variant="ghost" size="sm" onClick={() => onAssign(fine.id)}>Assign</Button>
        )}
      </TableCell>
    </TableRow>
  );
};

export default React.memo(TrafficFineRow);
