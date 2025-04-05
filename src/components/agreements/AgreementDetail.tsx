
import { useCallback, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, differenceInMonths } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Download, Edit, Printer, FilePlus } from 'lucide-react';
import { generatePdfDocument } from '@/utils/agreementUtils';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { usePaymentGeneration } from '@/hooks/use-payment-generation';
import { PaymentEntryDialog } from './PaymentEntryDialog';
import { LegalCaseCard } from './LegalCaseCard';
import { PaymentHistory } from './PaymentHistory';
import { AgreementTrafficFines } from './AgreementTrafficFines';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useTranslation } from '@/contexts/TranslationContext';

interface AgreementDetailProps {
  agreement: Agreement | null;
  onDelete: (id: string) => void;
  rentAmount: number | null;
  contractAmount: number | null;
  onPaymentDeleted: () => void;
  onDataRefresh: () => void;
  onGenerateDocument?: () => void;
}

export function AgreementDetail({
  agreement,
  onDelete,
  rentAmount,
  contractAmount,
  onPaymentDeleted,
  onDataRefresh,
  onGenerateDocument
}: AgreementDetailProps) {
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [lateFeeDetails, setLateFeeDetails] = useState<{
    amount: number;
    daysLate: number;
  } | null>(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const refreshRequested = useRef(false);
  const { t } = useI18nTranslation();
  const { isRTL } = useTranslation();

  const {
    handleSpecialAgreementPayments
  } = usePaymentGeneration(agreement, agreement?.id);

  const handleDelete = useCallback(() => {
    setIsDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (agreement) {
      onDelete(agreement.id);
      setIsDeleteDialogOpen(false);
    }
  }, [agreement, onDelete]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleEdit = useCallback(() => {
    if (agreement) {
      navigate(`/agreements/edit/${agreement.id}`);
    }
  }, [agreement, navigate]);

  const handleDownloadPdf = useCallback(async () => {
    if (agreement) {
      try {
        setIsGeneratingPdf(true);
        toast.info(t('agreements.preparingPdf'));
        const success = await generatePdfDocument(agreement);
        if (success) {
          toast.success(t('agreements.pdfSuccess'));
        } else {
          toast.error(t('agreements.pdfError'));
        }
      } catch (error) {
        console.error("Error generating PDF:", error);
        toast.error(t('agreements.pdfError'));
      } finally {
        setIsGeneratingPdf(false);
      }
    }
  }, [agreement, t]);

  const handleGenerateDocument = useCallback(() => {
    if (agreement && onGenerateDocument) {
      onGenerateDocument();
    } else {
      toast.info(t('agreements.documentGenerationConfig'));
    }
  }, [agreement, onGenerateDocument, t]);

  const handlePaymentSubmit = useCallback(async (
    amount: number, 
    paymentDate: Date, 
    notes?: string, 
    paymentMethod?: string, 
    referenceNumber?: string, 
    includeLatePaymentFee?: boolean,
    isPartialPayment?: boolean
  ) => {
    if (agreement && agreement.id) {
      try {
        const success = await handleSpecialAgreementPayments(
          amount, 
          paymentDate, 
          notes, 
          paymentMethod, 
          referenceNumber, 
          includeLatePaymentFee,
          isPartialPayment
        );
        if (success) {
          setIsPaymentDialogOpen(false);
          if (!refreshRequested.current) {
            refreshRequested.current = true;
            onDataRefresh();
            setTimeout(() => {
              refreshRequested.current = false;
            }, 500);
          }
          toast.success(t('payments.recordSuccess'));
        }
      } catch (error) {
        console.error("Error recording payment:", error);
        toast.error(t('payments.recordError'));
      }
    }
  }, [agreement, handleSpecialAgreementPayments, onDataRefresh, t]);

  const calculateDuration = useCallback((startDate: Date, endDate: Date) => {
    const months = differenceInMonths(endDate, startDate);
    return months > 0 ? months : 1;
  }, []);

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

  const handlePaymentHistoryRefresh = useCallback(() => {
    if (!refreshRequested.current) {
      refreshRequested.current = true;
      onPaymentDeleted();
      setTimeout(() => {
        refreshRequested.current = false;
      }, 500);
    }
  }, [onPaymentDeleted]);

  if (!agreement) {
    return <Alert>
        <AlertDescription>{t('agreements.detailsNotAvailable')}</AlertDescription>
      </Alert>;
  }

  const startDate = agreement.start_date instanceof Date ? agreement.start_date : new Date(agreement.start_date);
  const endDate = agreement.end_date instanceof Date ? agreement.end_date : new Date(agreement.end_date);
  const duration = calculateDuration(startDate, endDate);
  
  const createdDate = agreement.created_at instanceof Date ? agreement.created_at : 
    new Date(agreement.created_at || new Date());

  const formattedStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-500 text-white ml-2">{t('agreements.status.active').toUpperCase()}</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 text-white ml-2">{t('agreements.status.pending').toUpperCase()}</Badge>;
      case 'closed':
        return <Badge className="bg-blue-500 text-white ml-2">{t('agreements.status.closed').toUpperCase()}</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500 text-white ml-2">{t('agreements.status.cancelled').toUpperCase()}</Badge>;
      case 'expired':
        return <Badge className="bg-gray-500 text-white ml-2">{t('agreements.status.expired').toUpperCase()}</Badge>;
      case 'draft':
        return <Badge className="bg-purple-500 text-white ml-2">{t('agreements.status.draft').toUpperCase()}</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white ml-2">{status.toUpperCase()}</Badge>;
    }
  };

  return <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight print:text-2xl">
          {t('agreements.agreement')} {agreement.agreement_number}
          {formattedStatus(agreement.status)}
        </h2>
        <p className="text-muted-foreground">
          {t('agreements.createdOn')} {format(createdDate, 'MMMM d, yyyy')}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('agreements.customerInformation')}</CardTitle>
            <CardDescription>{t('agreements.customerDetails')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="font-medium">{t('common.name')}</p>
                <p>{agreement.customers?.full_name || t('common.notProvided')}</p>
              </div>
              <div>
                <p className="font-medium">{t('common.email')}</p>
                <p>{agreement.customers?.email || t('common.notProvided')}</p>
              </div>
              <div>
                <p className="font-medium">{t('common.phone')}</p>
                <p>{agreement.customers?.phone || agreement.customers?.phone_number || t('common.notProvided')}</p>
              </div>
              <div>
                <p className="font-medium">{t('common.address')}</p>
                <p>{agreement.customers?.address || t('common.notProvided')}</p>
              </div>
              <div>
                <p className="font-medium">{t('customers.driverLicense')}</p>
                <p>{agreement.customers?.driver_license || t('common.notProvided')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('agreements.vehicleInformation')}</CardTitle>
            <CardDescription>{t('agreements.vehicleDetails')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="font-medium">{t('common.vehicle')}</p>
                <p>{agreement.vehicles?.make} {agreement.vehicles?.model} ({agreement.vehicles?.year || t('common.notProvided')})</p>
              </div>
              <div>
                <p className="font-medium">{t('common.licensePlate')}</p>
                <p>{agreement.vehicles?.license_plate}</p>
              </div>
              <div>
                <p className="font-medium">{t('common.color')}</p>
                <p>{agreement.vehicles?.color || t('common.notProvided')}</p>
              </div>
              <div>
                <p className="font-medium">{t('common.vin')}</p>
                <p>{agreement.vehicles?.vin || t('common.notProvided')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('agreements.details')}</CardTitle>
          <CardDescription>{t('agreements.rentalTerms')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <p className="font-medium">{t('agreements.rentalPeriod')}</p>
                <p className="flex items-center">
                  <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                  {format(startDate, "MMMM d, yyyy")} {t('agreements.to')} {format(endDate, "MMMM d, yyyy")}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{t('agreements.duration')}: {duration} {duration === 1 ? t('agreements.month') : t('agreements.months')}</p>
              </div>
              
              <div>
                <p className="font-medium">{t('agreements.additionalDrivers')}</p>
                <p>{agreement.additional_drivers?.length ? agreement.additional_drivers.join(', ') : t('agreements.none')}</p>
              </div>
              
              <div>
                <p className="font-medium">{t('common.notes')}</p>
                <p className="whitespace-pre-line">{agreement.notes || t('agreements.noNotes')}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="font-medium">{t('agreements.monthlyRentAmount')}</p>
                <p className="font-semibold">QAR {rentAmount?.toLocaleString() || '0'}</p>
              </div>
              
              <div>
                <p className="font-medium">{t('agreements.totalContractAmount')}</p>
                <p className="font-semibold">QAR {contractAmount?.toLocaleString() || agreement.total_amount?.toLocaleString() || '0'}</p>
                <p className="text-xs text-muted-foreground">{t('agreements.monthlyRentMultiplied', { duration })}</p>
              </div>
              
              <div>
                <p className="font-medium">{t('agreements.depositAmount')}</p>
                <p>QAR {agreement.deposit_amount?.toLocaleString() || '0'}</p>
              </div>
              
              <div>
                <p className="font-medium">{t('agreements.termsAccepted')}</p>
                <p>{agreement.terms_accepted ? t('common.yes') : t('common.no')}</p>
              </div>
              
              <div>
                <p className="font-medium">{t('agreements.signature')}</p>
                <p>{agreement.signature_url ? t('agreements.signed') : t('agreements.notSigned')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-4 mb-4 print:hidden">
        <Button variant="outline" onClick={handleEdit}>
          <Edit className="mr-2 h-4 w-4" />
          {t('common.edit')}
        </Button>
        
        <Button variant="outline" onClick={handleDownloadPdf} disabled={isGeneratingPdf}>
          <Download className="mr-2 h-4 w-4" />
          {isGeneratingPdf ? t('common.generating') : t('agreements.agreementCopy')}
        </Button>
        <Button variant="outline" onClick={handleGenerateDocument}>
          <FilePlus className="mr-2 h-4 w-4" />
          {t('agreements.generateDocument')}
        </Button>
        <div className="flex-grow"></div>
        <Button variant="destructive" onClick={handleDelete} className="ml-auto">
          {t('common.delete')}
        </Button>
      </div>

      {agreement && <PaymentHistory 
        agreementId={agreement.id}
        rentAmount={rentAmount} 
        onPaymentDeleted={handlePaymentHistoryRefresh} 
        leaseStartDate={agreement.start_date} 
        leaseEndDate={agreement.end_date} 
      />}

      {agreement.start_date && agreement.end_date && (
        <Card>
          <CardHeader>
            <CardTitle>{t('agreements.trafficFines')}</CardTitle>
            <CardDescription>{t('agreements.trafficViolationsDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <AgreementTrafficFines agreementId={agreement.id} startDate={startDate} endDate={endDate} />
          </CardContent>
        </Card>
      )}

      {agreement.id && <LegalCaseCard agreementId={agreement.id} />}

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('agreements.confirmDeletion')}</DialogTitle>
            <DialogDescription>
              {t('agreements.deleteConfirmText', { number: agreement.agreement_number })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={confirmDelete}>{t('common.delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PaymentEntryDialog 
        open={isPaymentDialogOpen} 
        onOpenChange={setIsPaymentDialogOpen} 
        onSubmit={handlePaymentSubmit} 
        defaultAmount={rentAmount || 0} 
        title={t('payments.recordPayment')}
        description={t('payments.recordPaymentDesc')}
        lateFeeDetails={lateFeeDetails} 
        selectedPayment={selectedPayment}
      />
    </div>;
}
