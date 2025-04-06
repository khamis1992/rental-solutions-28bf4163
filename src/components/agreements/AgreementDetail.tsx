
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate } from '@/lib/date-utils';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, FileText, Calendar, Clock, Car } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PaymentHistory } from '@/components/agreements/PaymentHistory';
import { SimpleAgreement } from '@/hooks/use-agreements';
import { usePayments } from '@/hooks/use-payments';
import { Skeleton } from '@/components/ui/skeleton';
import { getDirectionalClasses } from '@/utils/rtl-utils';

interface AgreementDetailProps {
  agreement: SimpleAgreement | null;
  onDelete: (agreementId: string) => void;
  rentAmount: number | null;
  contractAmount: number | null;
  onPaymentDeleted: () => void;
  onDataRefresh: () => void;
}

export function AgreementDetail({
  agreement,
  onDelete,
  rentAmount,
  contractAmount,
  onPaymentDeleted,
  onDataRefresh
}: AgreementDetailProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const { payments, isLoadingPayments, fetchPayments } = usePayments(agreement?.id, rentAmount);
  const [paymentsUpdated, setPaymentsUpdated] = useState(false);

  const handleEdit = () => {
    if (agreement?.id) {
      navigate(`/agreements/edit/${agreement.id}`);
    }
  };

  const handleDelete = () => {
    if (agreement?.id) {
      onDelete(agreement.id);
    }
  };

  const handlePaymentsUpdate = useCallback((updatedPayments) => {
    setPaymentsUpdated(true);
    fetchPayments(true);
    onDataRefresh();
  }, [fetchPayments, onDataRefresh]);

  useEffect(() => {
    if (paymentsUpdated) {
      setPaymentsUpdated(false);
    }
  }, [paymentsUpdated]);

  if (!agreement) {
    return <div>{t('agreements.noAgreement')}</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{t('agreements.agreementDetails')}</CardTitle>
          <CardDescription>{t('agreements.viewAgreementDetails')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-lg font-semibold">{t('agreements.agreementInfo')}</h4>
              <div className="text-muted-foreground">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  <span>{t('agreements.number')}: {agreement.agreement_number}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{t('agreements.startDate')}: {formatDate(new Date(agreement.start_date))}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>{t('agreements.endDate')}: {formatDate(new Date(agreement.end_date))}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold">{t('agreements.financialInfo')}</h4>
              <div className="text-muted-foreground">
                <span>{t('agreements.rentAmount')}: {formatCurrency(rentAmount || 0)}</span>
                <br />
                <span>{t('agreements.contractAmount')}: {formatCurrency(contractAmount || 0)}</span>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold">{t('agreements.vehicleInfo')}</h4>
              <div className="text-muted-foreground">
                <div className="flex items-center">
                  <Car className="h-4 w-4 mr-2" />
                  <span>{t('agreements.vehicle')}: {agreement.vehicle?.make} {agreement.vehicle?.model}</span>
                </div>
                <div className="flex items-center">
                  <span>{t('agreements.licensePlate')}: {agreement.vehicle?.license_plate}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold">{t('common.status')}</h4>
              <div>
                {agreement.status === 'active' && (
                  <Badge className="bg-green-500">{t('agreements.status.active')}</Badge>
                )}
                {agreement.status === 'ended' && (
                  <Badge variant="outline">{t('agreements.status.ended')}</Badge>
                )}
                {agreement.status === 'pending_payment' && (
                  <Badge className="bg-yellow-500">{t('agreements.status.pendingPayment')}</Badge>
                )}
                {agreement.status === 'cancelled' && (
                  <Badge variant="destructive">{t('agreements.status.cancelled')}</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button variant="secondary" onClick={handleEdit} className="mr-2">
            <Edit className="h-4 w-4 mr-2" />
            {t('common.edit')}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                {t('common.delete')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('agreements.deleteAgreement')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('agreements.deleteConfirmation')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>{t('common.delete')}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('agreements.relatedInfo')}</CardTitle>
          <CardDescription>{t('agreements.relatedInfoDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="payments" className="w-full">
            <TabsList>
              <TabsTrigger value="payments">{t('payments.paymentHistory')}</TabsTrigger>
              <TabsTrigger value="details">{t('agreements.details')}</TabsTrigger>
            </TabsList>
            {/* Payment History Tab */}
            <TabsContent value="payments">
              <PaymentHistory 
                agreementId={agreement.id} 
                payments={payments} 
                onPaymentsUpdated={handlePaymentsUpdate}
              />
            </TabsContent>
            <TabsContent value="details">
              <div>{t('agreements.additionalDetails')}</div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
