
import React, { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { CarInstallmentContract } from '@/lib/validation-schemas/car-installment';
import { PaymentHistoryTable } from '@/components/payments/PaymentHistoryTable';
import { CarInstallmentPayment } from '@/types/payment';

interface ContractDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: CarInstallmentContract | null;
}

export function ContractDetailDialog({ 
  open,
  onOpenChange,
  contract
}: ContractDetailDialogProps) {
  const { t } = useTranslation();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');
  const [paymentHistory, setPaymentHistory] = useState<CarInstallmentPayment[]>([]);

  useEffect(() => {
    if (contract) {
      setEditedNotes(contract.notes || '');
      // Properly transform contract payments to match CarInstallmentPayment type
      if (contract.payments && contract.payments.length > 0) {
        const formattedPayments: CarInstallmentPayment[] = contract.payments.map(payment => ({
          id: payment.id || '', // Ensure id is not undefined
          contract_id: contract.id || '',
          payment_number: payment.payment_number || '',
          payment_date: payment.payment_date instanceof Date 
            ? payment.payment_date 
            : new Date(payment.payment_date || ''),
          due_date: payment.due_date instanceof Date 
            ? payment.due_date 
            : new Date(payment.due_date || ''),
          amount: payment.amount || 0,
          status: payment.status || 'pending',
          payment_method: payment.payment_method,
          reference: payment.reference,
          notes: payment.notes
        }));
        setPaymentHistory(formattedPayments);
      } else {
        setPaymentHistory([]);
      }
    }
  }, [contract]);

  const handleSaveNotes = () => {
    // Implement save logic here
    toast.success('Notes saved successfully!');
    setIsEditing(false);
  };

  const handleDeleteContract = () => {
    // Implement delete logic here
    toast.success('Contract deleted successfully!');
    onOpenChange(false);
  };

  const renderPaymentsList = () => {
    if (!contract || !paymentHistory.length) return null;

    return (
      <div className="space-y-4 mt-4">
        <h3 className="text-lg font-medium">{t('financials.carSales.paymentHistory')}</h3>
        <PaymentHistoryTable payments={paymentHistory} />
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('financials.carSales.contractDetails')}</DialogTitle>
          <DialogDescription>
            {t('financials.carSales.viewContractDetails')}
          </DialogDescription>
        </DialogHeader>

        {contract ? (
          <div className="space-y-4">
            <div>
              <Label>{t('financials.carSales.contractNumber')}</Label>
              <Input value={contract.contract_number} readOnly />
            </div>
            <div>
              <Label>{t('financials.carSales.customerName')}</Label>
              <Input value={contract.customer_name} readOnly />
            </div>
            <div>
              <Label>{t('financials.carSales.vehicleName')}</Label>
              <Input value={contract.vehicle_name} readOnly />
            </div>
            <div>
              <Label>{t('financials.carSales.totalAmount')}</Label>
              <Input value={contract.total_amount.toString()} readOnly />
            </div>
            <div>
              <Label>{t('financials.carSales.startDate')}</Label>
              <Input value={contract.start_date} readOnly />
            </div>
            <div>
              <Label>{t('financials.carSales.endDate')}</Label>
              <Input value={contract.end_date} readOnly />
            </div>

            <div>
              <Label>{t('common.notes')}</Label>
              {isEditing ? (
                <div className="flex space-x-2">
                  <Input
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                  />
                  <Button size="sm" onClick={handleSaveNotes}>
                    {t('common.save')}
                  </Button>
                </div>
              ) : (
                <div className="flex space-x-2 items-center">
                  <Input value={editedNotes} readOnly />
                  <Button size="sm" variant="secondary" onClick={() => setIsEditing(true)}>
                    {t('common.edit')}
                  </Button>
                </div>
              )}
            </div>

            {renderPaymentsList()}
          </div>
        ) : (
          <div>{t('financials.carSales.noContractDetails')}</div>
        )}

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('financials.carSales.deleteContract')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('financials.carSales.confirmDeleteContract')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
                {t('common.cancel')}
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteContract}>
                {t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
            {t('common.delete')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
