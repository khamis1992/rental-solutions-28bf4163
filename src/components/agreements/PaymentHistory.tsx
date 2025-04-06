
import React, { useState, useEffect, useRef } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Edit, Trash2, CheckSquare, AlertCircle, Clock, RefreshCw, FileText, ShieldCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { PaymentEditDialog } from './PaymentEditDialog';
import { PaymentEntryDialog } from './PaymentEntryDialog';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/date-utils';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ensureAllMonthlyPayments } from '@/lib/payment-utils';
import { usePayments } from '@/hooks/use-payments';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { useTranslation as useI18nTranslation } from 'react-i18next';

export interface Payment {
  id: string;
  amount: number;
  payment_date: string | null;
  payment_method?: string;
  reference_number?: string | null;
  notes?: string;
  type?: string;
  status?: string;
  late_fine_amount?: number;
  days_overdue?: number;
  lease_id?: string;
  original_due_date?: string | null;
  amount_paid?: number;
  balance?: number;
}

interface PaymentHistoryProps {
  agreementId: string;
  rentAmount: number | null;
  onPaymentDeleted: () => void;
  leaseStartDate?: Date | string;
  leaseEndDate?: Date | string;
}

export function PaymentHistory({
  agreementId,
  rentAmount,
  onPaymentDeleted,
  leaseStartDate,
  leaseEndDate
}: PaymentHistoryProps) {
  const { t } = useI18nTranslation();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeletingPayment, setIsDeletingPayment] = useState(false);
  const [isFixingPayments, setIsFixingPayments] = useState(false);
  const [lateFeeDetails, setLateFeeDetails] = useState<{
    amount: number;
    daysLate: number;
  } | null>(null);
  
  const isDeleteOperationInProgress = useRef(false);
  const isMounted = useRef(true);
  
  const { payments, isLoadingPayments, fetchPayments } = usePayments(agreementId, rentAmount);
  
  console.log(`PaymentHistory for agreement ${agreementId} received ${payments?.length} payments`);
  console.log('PaymentHistory isLoading:', isLoadingPayments);
  
  // Track component mount status to prevent state updates after unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Create debounced refresh function
  const debouncedRefresh = useDebouncedCallback(() => {
    console.log("Running debounced payment refresh");
    if (isMounted.current) {
      fetchPayments(true);
      onPaymentDeleted();
    }
  }, 1000);
  
  useEffect(() => {
    const today = new Date();
    if (today.getDate() > 1) {
      const daysLate = today.getDate() - 1;
      const lateFeeAmount = Math.min(daysLate * 120, 3000);
      setLateFeeDetails({
        amount: lateFeeAmount,
        daysLate: daysLate
      });
    } else {
      setLateFeeDetails(null);
    }
  }, []);
  
  const handleEditPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsEditDialogOpen(true);
  };
  
  const handleRecordPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsPaymentDialogOpen(true);
  };
  
  const handleRecordManualPayment = () => {
    setSelectedPayment(null);
    setIsPaymentDialogOpen(true);
  };
  
  const handleDeletePayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsDeleteConfirmOpen(true);
  };
  
  const confirmDeletePayment = async () => {
    if (!selectedPayment || isDeleteOperationInProgress.current || !isMounted.current) return;
    
    try {
      isDeleteOperationInProgress.current = true;
      setIsDeletingPayment(true);
      
      const { error } = await supabase.from('unified_payments').delete().eq('id', selectedPayment.id);
      
      if (error) {
        toast.error(`${t('payments.deleteError')}: ${error.message}`);
      } else {
        toast.success(t('payments.deleteSuccess'));
        debouncedRefresh();
      }
    } catch (err) {
      console.error('Error deleting payment:', err);
      toast.error(t('payments.deleteError'));
    } finally {
      if (isMounted.current) {
        setIsDeletingPayment(false);
        setIsDeleteConfirmOpen(false);
      }
      isDeleteOperationInProgress.current = false;
    }
  };
  
  const handleFixPayments = async () => {
    if (!agreementId) {
      toast.error(t('payments.noAgreementId'));
      return;
    }
    
    setIsFixingPayments(true);
    toast.info(t('payments.checkingPayments'));
    
    try {
      const result = await ensureAllMonthlyPayments(agreementId);
      
      if (result.success) {
        if (result.generatedCount === 0 && result.updatedCount === 0) {
          toast.success(t('payments.recordsUpToDate'));
        } else {
          toast.success(result.message || t('payments.recordsFixedSuccess'));
          debouncedRefresh();
        }
      } else {
        toast.error(result.message || t('payments.recordsFixFailed'));
      }
    } catch (error) {
      console.error("Error fixing payments:", error);
      toast.error(t('payments.unexpectedError'));
    } finally {
      if (isMounted.current) {
        setIsFixingPayments(false);
      }
    }
  };
  
  const getStatusBadge = (status?: string, daysOverdue?: number, balance?: number, amount?: number) => {
    if (!status) return <Badge className="bg-gray-500">{t('common.unknown')}</Badge>;
    switch (status.toLowerCase()) {
      case 'completed':
      case 'paid':
        return <Badge variant="success">{t('payments.status.paid')}</Badge>;
      case 'partially_paid':
        return <Badge variant="partial">{t('payments.status.partial')}</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">
            {t('payments.status.pending')} {daysOverdue && daysOverdue > 0 ? `(${daysOverdue} ${t('agreements.daysLate')})` : ''}
          </Badge>;
      case 'overdue':
        return <Badge variant="destructive">
            {t('payments.status.overdue')} {daysOverdue && daysOverdue > 0 ? `(${daysOverdue} ${t('common.days')})` : ''}
          </Badge>;
      case 'cancelled':
        return <Badge variant="outline">{t('common.cancelled')}</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };
  
  const getStatusIcon = (status?: string) => {
    if (!status) return <AlertCircle className="h-4 w-4 text-gray-500" />;
    switch (status.toLowerCase()) {
      case 'completed':
      case 'paid':
        return <CheckSquare className="h-4 w-4 text-green-500" />;
      case 'partially_paid':
        return <CheckSquare className="h-4 w-4 text-blue-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <Trash2 className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };
  
  const formatAmount = (payment: Payment) => {
    const baseAmount = payment.amount || 0;
    const amountPaid = payment.amount_paid || 0;
    const balance = payment.balance || 0;
    const displayAmount = baseAmount.toLocaleString();
    if ((payment.status === 'pending' || payment.status === 'overdue') && payment.days_overdue && payment.days_overdue > 0 && payment.late_fine_amount && payment.late_fine_amount > 0) {
      return <>
          QAR {displayAmount}
          <div className="text-xs text-red-500 mt-1">
            +QAR {payment.late_fine_amount.toLocaleString()} {t('payments.lateFee')}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {t('common.total')}: QAR {(baseAmount + payment.late_fine_amount).toLocaleString()}
          </div>
        </>;
    }
    if (payment.status === 'partially_paid' && amountPaid > 0 && balance > 0) {
      return <>
          QAR {displayAmount}
          <div className="text-xs text-blue-500 mt-1">
            {t('payments.paid')}: QAR {amountPaid.toLocaleString()}
          </div>
          <div className="text-xs text-amber-500 mt-1">
            {t('payments.remaining')}: QAR {balance.toLocaleString()}
          </div>
        </>;
    }
    return `QAR ${displayAmount}`;
  };
  
  const startDate = leaseStartDate ? new Date(leaseStartDate) : null;
  const endDate = leaseEndDate ? new Date(leaseEndDate) : null;
  
  return <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t('payments.history')}</CardTitle>
          <CardDescription>{t('payments.historyDesc')}</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchPayments(true)} 
            className="h-8"
            disabled={isLoadingPayments}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingPayments ? 'animate-spin' : ''}`} />
            {t('dashboard.refresh')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleFixPayments}
            disabled={isFixingPayments || isLoadingPayments}
            className="h-8"
          >
            <ShieldCheck className="mr-2 h-4 w-4" />
            {isFixingPayments ? t('payments.fixing') : t('payments.fixPayments')}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleRecordManualPayment}
            className="h-8"
          >
            <DollarSign className="mr-2 h-4 w-4" />
            {t('payments.recordPayment')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoadingPayments ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : payments?.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('common.date')}</TableHead>
                <TableHead>{t('common.amount')}</TableHead>
                <TableHead>{t('payments.method')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead>{t('common.notes')}</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map(payment => (
                <TableRow key={payment.id}>
                  <TableCell>
                    {payment.payment_date ? formatDate(new Date(payment.payment_date), 'PPP') : payment.original_due_date ? <span className="text-yellow-600">{t('common.dueDate')}: {formatDate(new Date(payment.original_due_date), 'PPP')}</span> : t('common.pending')}
                  </TableCell>
                  <TableCell>
                    {formatAmount(payment)}
                  </TableCell>
                  <TableCell>
                    {payment.payment_method ? payment.payment_method : t('common.notProvided')}
                    {payment.reference_number && <div className="text-xs text-muted-foreground mt-1">
                        {t('payments.ref')}: {payment.reference_number}
                      </div>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(payment.status)}
                      <span>{getStatusBadge(payment.status, payment.days_overdue, payment.balance, payment.amount)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate" title={payment.notes || ''}>
                      {payment.notes}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {payment.status === 'partially_paid' || payment.status === 'pending' || payment.status === 'overdue' ? <Button variant="ghost" size="sm" onClick={() => handleRecordPayment(payment)} title={t('payments.recordPayment')}>
                          <DollarSign className="h-4 w-4" />
                        </Button> : <Button variant="ghost" size="sm" onClick={() => handleEditPayment(payment)} title={t('common.edit')}>
                          <Edit className="h-4 w-4" />
                        </Button>}
                      <Button variant="ghost" size="sm" onClick={() => handleDeletePayment(payment)} title={t('common.delete')}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Alert>
            <AlertDescription className="text-center py-4">
              {t('payments.noRecords')}
            </AlertDescription>
          </Alert>
        )}

        {selectedPayment && (
          <PaymentEditDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} payment={selectedPayment} onSaved={() => {
            debouncedRefresh();
          }} />
        )}

        <PaymentEntryDialog 
          open={isPaymentDialogOpen} 
          onOpenChange={setIsPaymentDialogOpen} 
          onSubmit={(amount, paymentDate, notes, paymentMethod, referenceNumber, includeLatePaymentFee, isPartialPayment, targetPaymentId) => {
            console.log("Recording payment with payment ID:", targetPaymentId);
            setIsPaymentDialogOpen(false);
            debouncedRefresh();
          }} 
          defaultAmount={selectedPayment ? selectedPayment.balance || 0 : rentAmount || 0} 
          title={selectedPayment ? t('payments.recordPayment') : t('payments.recordManualPayment')} 
          description={selectedPayment ? t('payments.recordPaymentForItem') : t('payments.recordNewManualPayment')} 
          lateFeeDetails={lateFeeDetails} 
          selectedPayment={selectedPayment} 
        />

        <Dialog open={isDeleteConfirmOpen} onOpenChange={(open) => {
          // Only allow closing if not currently deleting
          if (!isDeletingPayment) {
            setIsDeleteConfirmOpen(open);
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('payments.deletePayment')}</DialogTitle>
              <DialogDescription>
                {t('payments.deleteConfirmation')}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)} disabled={isDeletingPayment}>
                {t('common.cancel')}
              </Button>
              <Button variant="destructive" onClick={confirmDeletePayment} disabled={isDeletingPayment}>
                {isDeletingPayment ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> {t('payments.deleting')}
                  </>
                ) : t('common.delete')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>;
}
