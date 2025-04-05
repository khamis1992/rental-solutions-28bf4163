
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';
import { 
  PaymentAmountDisplay, 
  PaymentMethodBadge, 
  PaymentStatusBadge 
} from './PaymentStatus';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { Payment } from '@/hooks/use-payments';

interface PaymentListTableProps {
  payments: Payment[];
  onDelete: (id: string) => void;
}

export const PaymentListTable = ({ payments, onDelete }: PaymentListTableProps) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>{formatDate(payment.payment_date)}</TableCell>
              <TableCell>
                <PaymentAmountDisplay 
                  amount={payment.amount} 
                  late_fine_amount={payment.late_fine_amount} 
                  days_overdue={payment.days_overdue}
                  status={payment.status || ''}
                />
              </TableCell>
              <TableCell>
                {payment.type === "rent" ? "Monthly Rent" : 
                payment.type === "deposit" ? "Security Deposit" : 
                payment.type === "fee" ? "Fee" : 
                payment.type || "Other"}
              </TableCell>
              <TableCell>
                <PaymentMethodBadge method={payment.payment_method || 'cash'} />
              </TableCell>
              <TableCell>
                <PaymentStatusBadge status={payment.status || 'pending'} />
              </TableCell>
              <TableCell className="max-w-[200px] truncate">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="w-full text-left">
                      <span className="block truncate">{payment.notes || "-"}</span>
                    </TooltipTrigger>
                    {payment.notes && (
                      <TooltipContent className="max-w-[300px]">
                        <p className="whitespace-normal">{payment.notes}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-1">
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                  {payment.status?.toLowerCase() !== 'paid' && payment.status?.toLowerCase() !== 'completed' && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => onDelete(payment.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
