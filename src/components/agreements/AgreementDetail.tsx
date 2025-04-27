
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Download, Edit, Printer, FilePlus } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { PaymentEntryDialog } from './PaymentEntryDialog';
import { AgreementTrafficFines } from './AgreementTrafficFines';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { PaymentHistory } from '@/components/agreements/PaymentHistory';
import LegalCaseCard from './LegalCaseCard';
import { useAgreementDetail } from '@/hooks/use-agreement-detail';
import { AgreementDetailRouteParams } from './AgreementDetail.types';
import { ErrorBoundary } from '@/utils/error-boundary';
import { useDateUtils } from '@/hooks/use-date-utils';

const AgreementDetail = () => {
  const { id } = useParams<AgreementDetailRouteParams>();
  const { formatDate } = useDateUtils();
  
  const {
    agreement,
    isLoading,
    payments,
    paymentsLoading,
    isDeleteDialogOpen,
    isPaymentDialogOpen,
    isGeneratingPdf,
    lateFeeDetails,
    selectedPayment,
    rentAmount,
    contractAmount,
    handleDeleteAgreement: handleDelete,
    confirmDelete,
    handlePrint,
    handleEdit,
    handleDownloadPdf,
    handleGenerateDocument,
    handlePaymentSubmit,
    handlePaymentUpdate,
    setIsDeleteDialogOpen,
    setIsPaymentDialogOpen,
    refreshData: onDataRefresh,
    agreementDuration,
    addPayment
  } = useAgreementDetail(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
          <span className="text-lg font-medium">Loading agreement details...</span>
        </div>
      </div>
    );
  }

  if (!agreement) {
    return (
      <Alert>
        <AlertDescription>Agreement details not available.</AlertDescription>
      </Alert>
    );
  }

  const duration = agreementDuration();

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

  const createdDate = agreement.created_at instanceof Date ? 
    agreement.created_at : 
    new Date(agreement.created_at || new Date());

  // Convert date objects to strings for the components that expect strings
  const startDateString = agreement.start_date ? 
    (agreement.start_date instanceof Date ? 
      agreement.start_date.toISOString() : 
      agreement.start_date) : '';
  
  const endDateString = agreement.end_date ?
    (agreement.end_date instanceof Date ? 
      agreement.end_date.toISOString() : 
      agreement.end_date) : '';

  return (
    <ErrorBoundary>
      <div className="space-y-8">
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
                    {startDateString ? format(new Date(startDateString), "MMMM d, yyyy") : "N/A"} to {endDateString ? format(new Date(endDateString), "MMMM d, yyyy") : "N/A"}
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

        {agreement && 
          <ErrorBoundary>
            <PaymentHistory 
              payments={Array.isArray(payments) ? payments : []} 
              isLoading={paymentsLoading} 
              rentAmount={rentAmount}
              contractAmount={contractAmount}
              onPaymentDeleted={onDataRefresh}
              onPaymentUpdated={handlePaymentUpdate}
              onRecordPayment={(payment) => {
                if (payment && agreement.id && addPayment) {
                  const fullPayment = {
                    ...payment,
                    lease_id: agreement.id,
                    status: 'completed'
                  };
                  addPayment(fullPayment);
                  // Manually refresh data after adding payment
                  onDataRefresh();
                }
              }}
              leaseStartDate={startDateString}
              leaseEndDate={endDateString}
            />
          </ErrorBoundary>
        }

        {agreement.start_date && agreement.end_date && (
          <ErrorBoundary>
            <LegalCaseCard agreementId={agreement.id} />
          </ErrorBoundary>
        )}

        {agreement.start_date && agreement.end_date && 
          <ErrorBoundary>
            <Card>
              <CardHeader>
                <CardTitle>Traffic Fines</CardTitle>
                <CardDescription>Violations during the rental period</CardDescription>
              </CardHeader>
              <CardContent>
                <AgreementTrafficFines 
                  agreementId={agreement.id} 
                  startDate={startDateString} 
                  endDate={endDateString} 
                />
              </CardContent>
            </Card>
          </ErrorBoundary>
        }

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
          handleSubmit={handlePaymentSubmit} 
          defaultAmount={rentAmount || 0} 
          title="Record Rent Payment" 
          description="Record a new rental payment for this agreement." 
          lateFeeDetails={lateFeeDetails} 
          selectedPayment={selectedPayment}
        />
      </div>
    </ErrorBoundary>
  );
};

export default AgreementDetail;
