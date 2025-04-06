
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Payment } from '@/types/payment';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useTranslation as useContextTranslation } from '@/contexts/TranslationContext';
import { useDateFormatter } from '@/lib/date-utils';
import { ensureDate } from '@/lib/date-utils'; // Import the ensureDate helper function

interface PaymentBadgeProps {
  status: string;
}

const PaymentBadge: React.FC<PaymentBadgeProps> = ({ status }) => {
  const { t } = useTranslation();

  const getPaymentStatus = (status: string) => {
    switch (status) {
      case 'paid':
        return { label: t('payments.status.paid'), className: 'bg-green-100 text-green-800' };
      case 'pending':
        return { label: t('payments.status.pending'), className: 'bg-amber-100 text-amber-800' };
      case 'overdue':
        return { label: t('payments.status.overdue'), className: 'bg-red-100 text-red-800' };
      case 'partial':
        return { label: t('payments.status.partial'), className: 'bg-blue-100 text-blue-800' };
      default:
        return { label: t('common.unknown'), className: 'bg-gray-100 text-gray-800' };
    }
  };

  const { label, className } = getPaymentStatus(status);

  return (
    <Badge className={className}>
      {label}
    </Badge>
  );
};

// Update the formatPaymentDate function to use the ensureDate helper
const formatPaymentDate = (date: string | Date): string => {
  const validDate = ensureDate(date);
  if (!validDate) return 'Invalid Date';
  
  try {
    return formatDate(validDate, 'MMM dd, yyyy');
  } catch (error) {
    console.error("Error formatting date:", error);
    return 'Invalid Date';
  }
};

// Import the formatDate function from date-fns to use in the component
import { format as formatDate } from 'date-fns';

interface PaymentListProps {
  payments: Payment[];
  onDeletePayment?: (paymentId: string) => Promise<void>;
  isLoading?: boolean;
  agreementId?: string;
}

export const PaymentList = ({ 
  payments, 
  onDeletePayment,
  isLoading = false,
  agreementId
}: PaymentListProps) => {
  const { t } = useTranslation();
  const { isRTL } = useContextTranslation();
  const { formatDate } = useDateFormatter();
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (selectedPaymentId && onDeletePayment) {
      setIsDeleting(true);
      try {
        await onDeletePayment(selectedPaymentId);
        setIsDeleteDialogOpen(false);
      } catch (error) {
        console.error("Error deleting payment:", error);
        // Handle error appropriately
      } finally {
        setIsDeleting(false);
        setSelectedPaymentId(null);
      }
    }
  };

  const confirmDelete = (paymentId: string) => {
    setSelectedPaymentId(paymentId);
    setIsDeleteDialogOpen(true);
  };

  const getPaymentStatus = (status: string) => {
    switch (status) {
      case 'paid':
        return { label: t('payments.status.paid'), className: 'bg-green-100 text-green-800' };
      case 'pending':
        return { label: t('payments.status.pending'), className: 'bg-amber-100 text-amber-800' };
      case 'overdue':
        return { label: t('payments.status.overdue'), className: 'bg-red-100 text-red-800' };
      case 'partial':
        return { label: t('payments.status.partial'), className: 'bg-blue-100 text-blue-800' };
      default:
        return { label: t('common.unknown'), className: 'bg-gray-100 text-gray-800' };
    }
  };

  // Convert the payments to ensure they have all required fields
  const normalizedPayments: Payment[] = payments.map(payment => ({
    ...payment,
    status: payment.status || 'pending', // Ensure status is always set
    payment_date: payment.payment_date || new Date()
  }));

  return (
    <div className={isRTL ? 'rtl-direction' : ''}>
      <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-6 py-3">{t('payments.date')}</TableHead>
              <TableHead className="px-6 py-3">{t('payments.amount')}</TableHead>
              <TableHead className="px-6 py-3">{t('payments.method')}</TableHead>
              <TableHead className="px-6 py-3">{t('payments.reference')}</TableHead>
              <TableHead className="px-6 py-3">{t('common.status')}</TableHead>
              <TableHead className="px-6 py-3 sr-only">{t('common.edit')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </TableCell>
              </TableRow>
            ) : normalizedPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  {t('payments.noRecords')}
                </TableCell>
              </TableRow>
            ) : (
              normalizedPayments.map((payment) => (
                <TableRow key={payment.id} className="border-b dark:border-gray-700">
                  <TableCell className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                    {formatDate(ensureDate(payment.payment_date) || new Date(), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="px-6 py-4">{formatCurrency(payment.amount)}</TableCell>
                  <TableCell className="px-6 py-4">{payment.payment_method || 'N/A'}</TableCell>
                  <TableCell className="px-6 py-4">{payment.reference || 'N/A'}</TableCell>
                  <TableCell className="px-6 py-4">
                    <PaymentBadge status={payment.status} />
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => confirmDelete(payment.id)}
                      disabled={isLoading}
                    >
                      {t('common.delete')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('payments.deletePayment')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('payments.deleteConfirmation')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className={cn(isDeleting && "cursor-not-allowed")}>
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
