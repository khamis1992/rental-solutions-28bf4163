
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useTranslation } from 'react-i18next';
import { useTranslation as useAppTranslation } from '@/contexts/TranslationContext';
import { formatDate, ensureDate } from '@/lib/date-utils';

interface ContractPayment {
  id: string;
  payment_number: number;
  due_date: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue' | 'partial';
  paid_amount?: number;
  payment_date?: string;
  reference?: string;
}

interface ContractPaymentsTableProps {
  payments: ContractPayment[];
  onPaymentClick?: (payment: ContractPayment) => void;
}

export const ContractPaymentsTable: React.FC<ContractPaymentsTableProps> = ({
  payments,
  onPaymentClick
}) => {
  const { t } = useTranslation();
  const { isRTL } = useAppTranslation();
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500 hover:bg-green-600">{t('payments.status.paid')}</Badge>;
      case 'pending':
        return <Badge variant="outline">{t('payments.status.pending')}</Badge>;
      case 'overdue':
        return <Badge variant="destructive">{t('payments.status.overdue')}</Badge>;
      case 'partial':
        return <Badge className="bg-blue-500 hover:bg-blue-600">{t('payments.status.partial')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className={isRTL ? 'text-right' : 'text-left'}>
            {t('payments.ref')}
          </TableHead>
          <TableHead className={isRTL ? 'text-right' : 'text-left'}>
            {t('common.dueDate')}
          </TableHead>
          <TableHead className={isRTL ? 'text-right' : 'text-left'}>
            {t('common.amount')}
          </TableHead>
          <TableHead className={isRTL ? 'text-right' : 'text-left'}>
            {t('payments.paid')}
          </TableHead>
          <TableHead className={isRTL ? 'text-right' : 'text-left'}>
            {t('payments.status.paid')}
          </TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.length > 0 ? (
          payments.map((payment) => (
            <TableRow 
              key={payment.id} 
              onClick={() => onPaymentClick?.(payment)}
              className="cursor-pointer hover:bg-muted/50"
            >
              <TableCell className="font-medium">
                {t('payments.ref')}{payment.payment_number}
              </TableCell>
              <TableCell>
                {ensureDate(payment.due_date) && formatDate(ensureDate(payment.due_date)!)}
              </TableCell>
              <TableCell>
                QAR {payment.amount.toLocaleString()}
              </TableCell>
              <TableCell>
                {payment.status === 'paid' || payment.status === 'partial' ? 
                  `QAR ${(payment.paid_amount || 0).toLocaleString()}` : '-'}
              </TableCell>
              <TableCell>
                {getStatusBadge(payment.status)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isRTL ? 'end' : 'start'}>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onPaymentClick?.(payment);
                    }}>
                      <FileText className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      {t('common.details')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
              {t('payments.noRecords')}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
