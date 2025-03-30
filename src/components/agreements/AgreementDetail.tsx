
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, differenceInMonths } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PaymentList } from '@/components/payments/PaymentList';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { AgreementTrafficFines } from './AgreementTrafficFines';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Download, Edit, Printer, DollarSign, FilePlus } from 'lucide-react';
import { generatePdfDocument } from '@/utils/agreementUtils';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { usePaymentGeneration } from '@/hooks/use-payment-generation';
import { PaymentEntryDialog } from './PaymentEntryDialog';
import { LegalCaseCard } from './LegalCaseCard';

interface AgreementDetailProps {
  agreement: Agreement | null;
  onDelete: (id: string) => void;
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
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const { handleSpecialAgreementPayments } = usePaymentGeneration(agreement, agreement?.id);
  
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
      navigate(`/agreements/${agreement.id}/edit`);
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

  const handleRecordPayment = useCallback(() => {
    setIsPaymentDialogOpen(true);
  }, []);

  const handleGenerateDocument = useCallback(() => {
    if (agreement) {
      // This would navigate to document generation, just show toast for now
      toast.info("Document generation functionality coming soon");
    }
  }, [agreement]);

  const handlePaymentSubmit = useCallback(async (amount: number, paymentDate: Date, notes?: string) => {
    if (agreement && agreement.id) {
      try {
        const success = await handleSpecialAgreementPayments(amount, paymentDate, notes);
        if (success) {
          setIsPaymentDialogOpen(false);
          onDataRefresh();
          toast.success("Payment recorded successfully");
        }
      } catch (error) {
        console.error("Error recording payment:", error);
        toast.error("Failed to record payment");
      }
    }
  }, [agreement, handleSpecialAgreementPayments, onDataRefresh]);

  const calculateDuration = useCallback((startDate: Date, endDate: Date) => {
    const months = differenceInMonths(endDate, startDate);
    return months > 0 ? months : 1; // Ensure at least 1 month
  }, []);

  if (!agreement) {
    return (
      <Alert>
        <AlertDescription>Agreement details not available.</AlertDescription>
      </Alert>
    );
  }

  // Ensure dates are Date objects
  const startDate = agreement.start_date instanceof Date 
    ? agreement.start_date 
    : new Date(agreement.start_date);
    
  const endDate = agreement.end_date instanceof Date
    ? agreement.end_date
    : new Date(agreement.end_date);

  const duration = calculateDuration(startDate, endDate);

  const formattedStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-500 text-white">ACTIVE</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 text-white">PENDING</Badge>;
      case 'closed':
        return <Badge className="bg-blue-500 text-white">CLOSED</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500 text-white">CANCELLED</Badge>;
      case 'expired':
        return <Badge className="bg-gray-500 text-white">EXPIRED</Badge>;
      case 'draft':
        return <Badge className="bg-purple-500 text-white">DRAFT</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">{status.toUpperCase()}</Badge>;
    }
  };

  const createdDate = agreement.created_at instanceof Date 
    ? agreement.created_at 
    : new Date(agreement.created_at || new Date());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            Agreement {agreement.agreement_number}
          </h1>
          <p className="text-sm text-muted-foreground">
            Created on {format(createdDate, 'MMMM d, yyyy')}
          </p>
        </div>
        <div>
          {formattedStatus(agreement.status)}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Customer Information</CardTitle>
            <CardDescription>Details about the customer</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium">Name</p>
                <p className="text-sm">{agreement.customers?.full_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm">{agreement.customers?.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Phone</p>
                <p className="text-sm">{agreement.customers?.phone_number || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Address</p>
                <p className="text-sm">{agreement.customers?.address || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Driver License</p>
                <p className="text-sm">{agreement.customers?.driver_license || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Vehicle Information</CardTitle>
            <CardDescription>Details about the rented vehicle</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium">Vehicle</p>
                <p className="text-sm">{agreement.vehicles?.make} {agreement.vehicles?.model} ({agreement.vehicles?.year || 'N/A'})</p>
              </div>
              <div>
                <p className="text-sm font-medium">License Plate</p>
                <p className="text-sm">{agreement.vehicles?.license_plate}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Color</p>
                <p className="text-sm">{agreement.vehicles?.color || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium">VIN</p>
                <p className="text-sm">{agreement.vehicles?.vin || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Agreement Details</CardTitle>
          <CardDescription>Rental terms and payment information</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium">Rental Period</p>
                <p className="text-sm">
                  {format(startDate, "MMMM d, yyyy")} to {format(endDate, "MMMM d, yyyy")}
                </p>
                <p className="text-xs text-muted-foreground">Duration: {duration} {duration === 1 ? 'month' : 'months'}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium">Additional Drivers</p>
                <p className="text-sm">{agreement.additional_drivers?.length ? agreement.additional_drivers.join(', ') : 'None'}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium">Notes</p>
                <p className="text-sm whitespace-pre-line">{agreement.notes || 'No notes'}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium">Monthly Rent Amount</p>
                <p className="text-sm font-semibold">QAR {rentAmount?.toLocaleString() || '0'}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium">Total Contract Amount</p>
                <p className="text-sm font-semibold">QAR {contractAmount?.toLocaleString() || agreement.total_amount?.toLocaleString() || '0'}</p>
                <p className="text-xs text-muted-foreground">Monthly rent × {duration} months</p>
              </div>
              
              <div>
                <p className="text-sm font-medium">Deposit Amount</p>
                <p className="text-sm">QAR {agreement.deposit_amount?.toLocaleString() || '0'}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium">Terms Accepted</p>
                <p className="text-sm">{agreement.terms_accepted ? 'Yes' : 'No'}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium">Signature</p>
                <p className="text-sm">{agreement.signature_url ? 'Signed' : 'Not signed'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <Button variant="outline" size="sm" onClick={handleEdit} className="h-9">
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
        <Button variant="outline" size="sm" onClick={handlePrint} className="h-9">
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleDownloadPdf}
          disabled={isGeneratingPdf}
          className="h-9"
        >
          <Download className="mr-2 h-4 w-4" />
          {isGeneratingPdf ? 'Generating...' : 'Download PDF'}
        </Button>
        <Button 
          variant="outline"
          size="sm"
          onClick={handleGenerateDocument}
          className="h-9"
        >
          <FilePlus className="mr-2 h-4 w-4" />
          Generate Document
        </Button>
        <Button 
          variant="default" 
          size="sm"
          className="h-9 bg-blue-600 hover:bg-blue-700 text-white ml-auto"
          onClick={handleRecordPayment}
        >
          <DollarSign className="mr-2 h-4 w-4" />
          Record Payment
        </Button>
        <div className="flex-grow"></div>
        <Button 
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          className="h-9"
        >
          Delete
        </Button>
      </div>

      <Card className="mt-8">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-medium">Payment History</CardTitle>
              <CardDescription>View and manage payment records</CardDescription>
            </div>
            {rentAmount && agreement.status.toLowerCase() === 'active' && (
              <div className="flex items-center">
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Missing 1 payment
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <PaymentList 
            agreementId={agreement.id} 
            onPaymentDeleted={onPaymentDeleted}
          />
        </CardContent>
      </Card>

      {agreement.start_date && agreement.end_date && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Traffic Fines</CardTitle>
            <CardDescription>Violations during the rental period</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <AgreementTrafficFines
              agreementId={agreement.id}
              startDate={startDate}
              endDate={endDate}
            />
          </CardContent>
        </Card>
      )}
      
      {agreement.id && (
        <LegalCaseCard agreementId={agreement.id} />
      )}

      {/* Delete Confirmation Dialog */}
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

      {/* Payment Entry Dialog */}
      <PaymentEntryDialog 
        open={isPaymentDialogOpen} 
        onOpenChange={setIsPaymentDialogOpen}
        onSubmit={handlePaymentSubmit}
        defaultAmount={rentAmount || 0}
        title="Record Rent Payment"
        description="Record a new rental payment for this agreement."
      />
    </div>
  );
}
