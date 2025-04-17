import React, { useCallback, useState, useEffect } from 'react';
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
import { AgreementTrafficFines } from './AgreementTrafficFines';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { usePayments } from '@/hooks/use-payments';
import { PaymentHistory } from '@/components/agreements/PaymentHistory';
import LegalCaseCard from './LegalCaseCard';
import { asDbId, AgreementId, LeaseId } from '@/types/database-types';
import { supabase } from '@/lib/supabase';
import type { Payment } from '@/components/agreements/PaymentHistory.types';

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

  const {
    payments = [],
    isLoading: isLoadingPayments,
    fetchPayments
  } = usePayments(agreement?.id);
  
  useEffect(() => {
    if (agreement?.id) {
      console.log('Fetching payments for agreement:', agreement.id);
      fetchPayments();
    }
  }, [agreement?.id, fetchPayments]);
  
  const {
    handleSpecialAgreementPayments
  } = usePaymentGeneration(agreement, agreement?.id);

  const handleDelete = useCallback(() => {
    if (agreement) {
      const typedId = asDbId<LeaseId>(agreement.id);
      onDelete(typedId);
    }
  }, [agreement, onDelete]);

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
        toast.info("Preparing agreement PDF document...");
        const success = await generatePdfDocument(agreement);
        if (success) {
          toast.success("Agreement PDF downloaded successfully");
        } else {
          toast.error("Failed to generate PDF");
        }
      } catch (error) {
        console.error("Error generating PDF:", error);
        toast.error("Failed to generate PDF");
      } finally {
        setIsGeneratingPdf(false);
      }
    }
  }, [agreement]);

  const handleGenerateDocument = useCallback(() => {
    if (agreement && onGenerateDocument) {
      onGenerateDocument();
    } else {
      toast.info("Document generation functionality is being configured");
    }
  }, [agreement, onGenerateDocument]);

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
          onDataRefresh();
          fetchPayments();
          toast.success("Payment recorded successfully");
        }
      } catch (error) {
        console.error("Error recording payment:", error);
        toast.error("Failed to record payment");
      }
    }
  }, [agreement, handleSpecialAgreementPayments, onDataRefresh, fetchPayments]);

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

  if (!agreement) {
    return <Alert>
        <AlertDescription>Agreement details not available.</AlertDescription>
      </Alert>;
  }

  const startDate = agreement.start_date instanceof Date ? agreement.start_date : new Date(agreement.start_date);
  const endDate = agreement.end_date instanceof Date ? agreement.end_date : new Date(agreement.end_date);
  const duration = calculateDuration(startDate, endDate);

  const formattedStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-500 text-white ml-2">ACTIVE</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 text-white ml-2">PENDING</Badge>;
      case 'closed':
        return <Badge className="bg-blue-500 text-white ml-2">CLOSED</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500 text-white ml-2">CANCELLED</Badge>;
      case 'expired':
        return <Badge className="bg-gray-500 text-white ml-2">EXPIRED</Badge>;
      case 'draft':
        return <Badge className="bg-purple-500 text-white ml-2">DRAFT</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white ml-2">{status.toUpperCase()}</Badge>;
    }
  };

  const createdDate = agreement.created_at instanceof Date ? agreement.created_at : new Date(agreement.created_at || new Date());

  return <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight print:text-2xl">
          Agreement {agreement.agreement_number}
          {formattedStatus(agreement.status)}
        </h2>
        <p className="text-muted-foreground">
          Created on {format(createdDate, 'MMMM d, yyyy')}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>Details about the customer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="font-medium">Name</p>
                <p>{agreement.customers?.full_name || 'N/A'}</p>
              </div>
              <div>
                <p className="font-medium">Email</p>
                <p>{agreement.customers?.email || 'N/A'}</p>
              </div>
              <div>
                <p className="font-medium">Phone</p>
                <p>{agreement.customers?.phone_number || 'N/A'}</p>
              </div>
              <div>
                <p className="font-medium">Address</p>
                <p>{agreement.customers?.address || 'N/A'}</p>
              </div>
              <div>
                <p className="font-medium">Driver License</p>
                <p>{agreement.customers?.driver_license || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vehicle Information</CardTitle>
            <CardDescription>Details about the rented vehicle</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="font-medium">Vehicle</p>
                <p>{agreement.vehicles?.make} {agreement.vehicles?.model} ({agreement.vehicles?.year || 'N/A'})</p>
              </div>
              <div>
                <p className="font-medium">License Plate</p>
                <p>{agreement.vehicles?.license_plate}</p>
              </div>
              <div>
                <p className="font-medium">Color</p>
                <p>{agreement.vehicles?.color || 'N/A'}</p>
              </div>
              <div>
                <p className="font-medium">VIN</p>
                <p>{agreement.vehicles?.vin || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agreement Details</CardTitle>
          <CardDescription>Rental terms and payment information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <p className="font-medium">Rental Period</p>
                <p className="flex items-center">
                  <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                  {format(startDate, "MMMM d, yyyy")} to {format(endDate, "MMMM d, yyyy")}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Duration: {duration} {duration === 1 ? 'month' : 'months'}</p>
              </div>
              
              <div>
                <p className="font-medium">Additional Drivers</p>
                <p>{agreement.additional_drivers?.length ? agreement.additional_drivers.join(', ') : 'None'}</p>
              </div>
              
              <div>
                <p className="font-medium">Notes</p>
                <p className="whitespace-pre-line">{agreement.notes || 'No notes'}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="font-medium">Monthly Rent Amount</p>
                <p className="font-semibold">QAR {rentAmount?.toLocaleString() || '0'}</p>
              </div>
              
              <div>
                <p className="font-medium">Total Contract Amount</p>
                <p className="font-semibold">QAR {contractAmount?.toLocaleString() || agreement.total_amount?.toLocaleString() || '0'}</p>
                <p className="text-xs text-muted-foreground">Monthly rent × {duration} months</p>
              </div>
              
              <div>
                <p className="font-medium">Deposit Amount</p>
                <p>QAR {agreement.deposit_amount?.toLocaleString() || '0'}</p>
              </div>
              
              <div>
                <p className="font-medium">Terms Accepted</p>
                <p>{agreement.terms_accepted ? 'Yes' : 'No'}</p>
              </div>
              
              <div>
                <p className="font-medium">Signature</p>
                <p>{agreement.signature_url ? 'Signed' : 'Not signed'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-4 mb-4 print:hidden">
        <Button variant="outline" onClick={handleEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
        
        <Button variant="outline" onClick={handleDownloadPdf} disabled={isGeneratingPdf}>
          <Download className="mr-2 h-4 w-4" />
          {isGeneratingPdf ? 'Generating...' : 'Agreement Copy'}
        </Button>
        <Button variant="outline" onClick={handleGenerateDocument}>
          <FilePlus className="mr-2 h-4 w-4" />
          Generate Document
        </Button>
        <div className="flex-grow"></div>
        <Button variant="destructive" onClick={handleDelete} className="ml-auto">
          Delete
        </Button>
      </div>

      {agreement && <PaymentHistory 
        payments={Array.isArray(payments) ? payments as import('@/components/agreements/PaymentHistory.types').Payment[] : []} 
        isLoading={isLoadingPayments} 
        rentAmount={rentAmount} 
        onPaymentDeleted={() => {
          onPaymentDeleted();
          fetchPayments();
        }} 
        leaseStartDate={agreement.start_date} 
        leaseEndDate={agreement.end_date} 
      />}

      {agreement.start_date && agreement.end_date && (
        <LegalCaseCard agreementId={agreement.id} />
      )}

      {agreement.start_date && agreement.end_date && <Card>
          <CardHeader>
            <CardTitle>Traffic Fines</CardTitle>
            <CardDescription>Violations during the rental period</CardDescription>
          </CardHeader>
          <CardContent>
            <AgreementTrafficFines agreementId={agreement.id} startDate={startDate} endDate={endDate} />
          </CardContent>
        </Card>}

      {agreement.id && <LegalCaseCard agreementId={agreement.id} />}

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete agreement {agreement.agreement_number}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PaymentEntryDialog 
        open={isPaymentDialogOpen} 
        onOpenChange={setIsPaymentDialogOpen} 
        onSubmit={handlePaymentSubmit} 
        defaultAmount={rentAmount || 0} 
        title="Record Rent Payment" 
        description="Record a new rental payment for this agreement." 
        lateFeeDetails={lateFeeDetails} 
        selectedPayment={selectedPayment}
      />
    </div>;
}
