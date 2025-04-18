import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, differenceInMonths } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
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
import { asDbId, LeaseId } from '@/types/database-types';
import { Button } from '@/components/ui/button';
import { AgreementSummaryHeader } from './AgreementSummaryHeader';
import { AgreementActions } from './AgreementActions';
import { AgreementTabs } from './AgreementTabs';

interface AgreementDetailProps {
  agreement: Agreement | null;
  onDelete: (id: string) => void;
  rentAmount: number | null;
  contractAmount: number | null;
  onPaymentDeleted: () => void;
  onDataRefresh: () => void;
  onGenerateDocument?: () => void;
  isGeneratingPayment?: boolean;
  isRunningMaintenance?: boolean;
  isGeneratingPdf?: boolean;
  onGeneratePayment?: () => void;
  onRunMaintenance?: () => void;
}

export function AgreementDetail({
  agreement,
  onDelete,
  rentAmount,
  contractAmount,
  onPaymentDeleted,
  onDataRefresh,
  onGenerateDocument,
  isGeneratingPayment = false,
  isRunningMaintenance = false,
  isGeneratingPdf = false,
  onGeneratePayment,
  onRunMaintenance
}: AgreementDetailProps) {
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
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
  
  React.useEffect(() => {
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
    if (!agreement && !agreementId) {
      toast.error("Agreement information is missing");
      return false;
    }
    
    const queryParams = new URLSearchParams(window.location.search);
    const paymentId = queryParams.get('paymentId');
    
    try {
      let existingPaymentId: string | null = null;
      let existingPaymentAmount: number = 0;
      let existingAmountPaid: number = 0;
      let existingBalance: number = 0;
      
      if (paymentId) {
        const { data: existingPayment, error: queryError } = await supabase
          .from('unified_payments')
          .select('*')
          .eq('id', paymentId)
          .single();
          
        if (queryError) {
          console.error("Error fetching existing payment:", queryError);
        } else if (existingPayment) {
          existingPaymentId = existingPayment.id;
          existingPaymentAmount = existingPayment.amount || 0;
          existingAmountPaid = existingPayment.amount_paid || 0;
          existingBalance = existingPayment.balance || 0;
        }
      }
      
      let dailyLateFee = 120;
      if (!agreement) {
        const { data: leaseData, error: leaseError } = await supabase
          .from('leases')
          .select('daily_late_fee')
          .eq('id', agreementId)
          .single();
          
        if (leaseError) {
          console.error("Error fetching lease data for late fee:", leaseError);
        } else if (leaseData) {
          dailyLateFee = leaseData.daily_late_fee || 120;
        }
      } else {
        dailyLateFee = agreement.daily_late_fee || 120;
      }
      
      let lateFineAmount = 0;
      let daysLate = 0;
      
      if (paymentDate.getDate() > 1) {
        daysLate = paymentDate.getDate() - 1;
        lateFineAmount = Math.min(daysLate * dailyLateFee, 3000);
      }
      
      if (existingPaymentId) {
        const totalPaid = existingAmountPaid + amount;
        const newBalance = existingPaymentAmount - totalPaid;
        const newStatus = newBalance <= 0 ? 'completed' : 'partially_paid';
        
        const { error: updateError } = await supabase
          .from('unified_payments')
          .update({
            amount_paid: totalPaid,
            balance: Math.max(0, newBalance),
            status: newStatus,
            payment_date: paymentDate.toISOString(),
            payment_method: paymentMethod
          })
          .eq('id', existingPaymentId);
          
        if (updateError) {
          console.error("Error updating payment:", updateError);
          toast.error("Failed to record additional payment");
          return false;
        }
        
        toast.success(newStatus === 'completed' ? 
          "Payment completed successfully!" : 
          "Additional payment recorded successfully");
      } else {
        let paymentStatus = 'completed';
        let amountPaid = amount;
        let balance = 0;
        
        if (isPartialPayment) {
          paymentStatus = 'partially_paid';
          const rentAmount = agreement?.rent_amount || 0;
          balance = Math.max(0, rentAmount - amount);
        }
        
        const paymentRecord = {
          lease_id: agreementId,
          amount: agreement?.rent_amount || 0,
          amount_paid: amountPaid,
          balance: balance,
          payment_date: paymentDate.toISOString(),
          payment_method: paymentMethod,
          reference_number: referenceNumber || null,
          description: notes || `Monthly rent payment for ${agreement?.agreement_number}`,
          status: paymentStatus,
          type: 'rent',
          days_overdue: daysLate,
          late_fine_amount: lateFineAmount,
          original_due_date: new Date(paymentDate.getFullYear(), paymentDate.getMonth(), 1).toISOString()
        };
        
        const { data, error } = await supabase
          .from('unified_payments')
          .insert(paymentRecord)
          .select('id')
          .single();
        
        if (error) {
          console.error("Payment recording error:", error);
          toast.error("Failed to record payment");
          return false;
        }
        
        if (lateFineAmount > 0 && includeLatePaymentFee) {
          const lateFeeRecord = {
            lease_id: agreementId,
            amount: lateFineAmount,
            amount_paid: lateFineAmount,
            balance: 0,
            payment_date: paymentDate.toISOString(),
            payment_method: paymentMethod,
            reference_number: referenceNumber || null,
            description: `Late payment fee for ${dateFormat(paymentDate, "MMMM yyyy")} (${daysLate} days late)`,
            status: 'completed',
            type: 'LATE_PAYMENT_FEE',
            late_fine_amount: lateFineAmount,
            days_overdue: daysLate,
            original_due_date: new Date(paymentDate.getFullYear(), paymentDate.getMonth(), 1).toISOString()
          };
          
          const { error: lateFeeError } = await supabase
            .from('unified_payments')
            .insert(lateFeeRecord);
          
          if (lateFeeError) {
            console.error("Late fee recording error:", lateFeeError);
            toast.warning("Payment recorded but failed to record late fee");
          } else {
            toast.success(isPartialPayment ? 
              "Partial payment and late fee recorded successfully" : 
              "Payment and late fee recorded successfully");
          }
        } else {
          toast.success(isPartialPayment ? 
            "Partial payment recorded successfully" : 
            "Payment recorded successfully");
        }
      }
      
      onDataRefresh();
      fetchPayments();
      return true;
    } catch (error) {
      console.error("Unexpected error recording payment:", error);
      toast.error("An unexpected error occurred while recording payment");
      return false;
    }
  }, [agreement, handleSpecialAgreementPayments, onDataRefresh, fetchPayments, agreementId]);

  const calculateDuration = useCallback((startDate: Date, endDate: Date) => {
    const months = differenceInMonths(endDate, startDate);
    return months > 0 ? months : 1;
  }, []);

  React.useEffect(() => {
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

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Summary Header */}
      <AgreementSummaryHeader 
        agreement={agreement} 
        rentAmount={rentAmount} 
      />
      
      {/* Actions Bar */}
      <AgreementActions
        onEdit={handleEdit}
        onDelete={() => setIsDeleteDialogOpen(true)}
        onDownloadPdf={handleDownloadPdf}
        onGeneratePayment={onGeneratePayment || (() => {})}
        onRunMaintenance={onRunMaintenance || (() => {})}
        onGenerateDocument={handleGenerateDocument}
        isGeneratingPayment={isGeneratingPayment}
        isRunningMaintenance={isRunningMaintenance}
        isGeneratingPdf={isGeneratingPdf}
        status={agreement.status}
      />

      {/* Tabbed Interface */}
      <AgreementTabs 
        agreement={agreement}
        payments={payments}
        isLoadingPayments={isLoadingPayments}
        rentAmount={rentAmount}
        onPaymentDeleted={onPaymentDeleted}
        onRefreshPayments={fetchPayments}
      >
        {/* Overview Tab Content */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
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
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Vehicle Information</h3>
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
        
          <Card className="md:col-span-2">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Agreement Details</h3>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <p className="font-medium">Rental Period</p>
                    <p>{format(startDate, "MMMM d, yyyy")} to {format(endDate, "MMMM d, yyyy")}</p>
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
        </div>

        {/* Payment History Tab Content */}
        {agreement && <PaymentHistory 
          payments={Array.isArray(payments) ? payments : []} 
          isLoading={isLoadingPayments} 
          rentAmount={rentAmount} 
          onPaymentDeleted={() => {
            onPaymentDeleted();
            fetchPayments();
          }} 
          leaseStartDate={agreement.start_date} 
          leaseEndDate={agreement.end_date} 
        />}

        {/* Legal Cases Tab Content */}
        {agreement.id && (
          <LegalCaseCard agreementId={agreement.id} />
        )}

        {/* Traffic Fines Tab Content */}
        {agreement.start_date && agreement.end_date && agreement.id && (
          <AgreementTrafficFines 
            agreementId={agreement.id} 
            startDate={startDate} 
            endDate={endDate} 
          />
        )}
      </AgreementTabs>

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
    </div>
  );
}
