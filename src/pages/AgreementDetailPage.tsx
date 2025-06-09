
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import PageContainer from '@/components/layout/PageContainer';
import { useAgreement } from '@/hooks/use-agreement';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { AgreementStatus } from '@/lib/validation-schemas/agreement';
import { useRentAmount } from '@/hooks/use-rent-amount';
import { AlertTriangle, Calendar, RefreshCcw, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import InvoiceGenerator from '@/components/invoices/InvoiceGenerator';
import { usePayments } from '@/hooks/use-payments';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AgreementDetailWrapper } from '@/components/agreements/AgreementDetailWrapper';
import { generateAgreementReportPdfmake } from '@/utils/agreement-report-utils';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { usePayment } from '@/hooks/use-payment';
import { useAgreementService } from '@/hooks/services/useAgreementService';
import { useTrafficFines } from '@/hooks/use-traffic-fines';

const AgreementDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { 
    agreement,
    isLoading,
    error,
  } = useAgreement(id);
  
  // Use the new agreement service for enhanced deletion
  const { deleteAgreement: enhancedDeleteAgreement } = useAgreementService();
  
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  
  const { rentAmount } = useRentAmount(agreement, id);
  const contractAmount = agreement?.total_amount || null;
  
  // Use our payment hooks with all the necessary functionality
  const {
    payments,
    fetchPayments
  } = usePayments(id || '');
  
  const {
    generatePayment,
    runPaymentMaintenance,
    isPending: paymentIsPending
  } = usePayment(id);

  // Add traffic fines hook
  const { trafficFines } = useTrafficFines();

  const refreshAgreementData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleGenerateDocument = () => {
    setIsDocumentDialogOpen(true);
  };

  // Use our new abstract method instead of direct function call
  const handleGeneratePayment = async () => {
    if (!id || !agreement) return;

    try {
      await generatePayment(id);
      refreshAgreementData();
    } catch (error) {
      console.error("Error generating payment:", error);
    }
  };

  // Use our new abstract method instead of direct function call
  const handleRunMaintenanceJob = async () => {
    try {
      toast.info("Running payment maintenance check...");
      await runPaymentMaintenance();
      refreshAgreementData();
      fetchPayments();
    } catch (error) {
      console.error("Error running maintenance job:", error);
      toast.error("Failed to run maintenance job");
    }
  };

  const handleGenerateReport = async () => {
    if (!agreement) return;
    try {
      // Filter traffic fines for this agreement
      const agreementTrafficFines = trafficFines?.filter(fine => 
        fine.leaseId === agreement.id
      ) || [];
      
      toast.info("Generating Arabic agreement report...");
      await generateAgreementReportPdfmake(agreement, rentAmount, contractAmount, payments, agreementTrafficFines);
      toast.success('Arabic agreement report generated successfully');
    } catch (error) {
      console.error('Error generating Arabic report:', error);
      toast.error('Failed to generate Arabic agreement report');
    }
  };

  // Enhanced delete handler with proper error handling
  const handleDeleteAgreement = async (agreementId: string) => {
    try {
      console.log('handleDeleteAgreement called with ID:', agreementId);
      
      // Call the enhanced delete function and await the result
      await enhancedDeleteAgreement(agreementId);
      
      console.log('Agreement deletion completed, navigating to agreements list');
      navigate('/agreements');
    } catch (error) {
      console.error('Error in handleDeleteAgreement:', error);
      // Error toast is already shown by the service, but we can add additional logging
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Deletion error details:', errorMessage);
    }
  };

  const calculateProgress = () => {
    if (!agreement || !agreement.start_date || !agreement.end_date) return 0;
    const startDate = agreement.start_date instanceof Date ? agreement.start_date : new Date(agreement.start_date);
    const endDate = agreement.end_date instanceof Date ? agreement.end_date : new Date(agreement.end_date);
    const today = new Date();
    if (today < startDate) return 0;
    if (today > endDate) return 100;
    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = today.getTime() - startDate.getTime();
    return Math.min(Math.floor(elapsed / totalDuration * 100), 100);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return "default";
      case 'pending':
        return "secondary";
      case 'closed':
        return "outline";
      case 'cancelled':
        return "destructive";
      case 'expired':
        return "secondary";
      case 'draft':
        return "outline";
      default:
        return "outline";
    }
  };

  // Render loading state while fetching agreement
  if (isLoading) {
    return (
      <PageContainer title="Agreement Details" description="View and manage rental agreement details" backLink="/agreements">
        <div className="space-y-6">
          <Skeleton className="h-12 w-2/3" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full md:col-span-2" />
          </div>
        </div>
      </PageContainer>
    );
  }

  // Render error state if agreement couldn't be loaded
  if (error) {
    return (
      <PageContainer title="Agreement Details" description="View and manage rental agreement details" backLink="/agreements">
        <div className="text-center py-12">
          <div className="flex items-center justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-amber-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Error Loading Agreement</h3>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : 'An unknown error occurred while fetching the agreement details.'}
          </p>
          <Button variant="outline" onClick={() => navigate("/agreements")}>
            Return to Agreements
          </Button>
        </div>
      </PageContainer>
    );
  }

  // Render not found state if agreement doesn't exist
  if (!agreement) {
    return (
      <PageContainer title="Agreement Details" description="View and manage rental agreement details" backLink="/agreements">
        <div className="text-center py-12">
          <div className="flex items-center justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-amber-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Agreement not found</h3>
          <p className="text-muted-foreground mb-4">
            The agreement you're looking for doesn't exist or has been removed.
          </p>
          <Button variant="outline" onClick={() => navigate("/agreements")}>
            Return to Agreements
          </Button>
        </div>
      </PageContainer>
    );
  }

  // Main component rendering with agreement data
  return (
    <PageContainer 
      title="Agreement Details" 
      description="View and manage rental agreement details" 
      backLink="/agreements" 
      actions={
        <>
          {agreement && agreement.status === AgreementStatus.ACTIVE && (
            <HoverCard openDelay={300} closeDelay={200}>
              <HoverCardTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleGeneratePayment} 
                  disabled={paymentIsPending.generatePayment} 
                  className="gap-2 mr-2"
                >
                  <Calendar className="h-4 w-4" />
                  {paymentIsPending.generatePayment ? "Generating..." : "Generate Payment Schedule"}
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-80 p-4 bg-white border shadow-lg rounded-lg">
                <h4 className="font-medium mb-1">Payment Schedule Generation</h4>
                <p className="text-sm text-muted-foreground">
                  Creates a new monthly payment record for this agreement with automatically calculated due amount and late fees. 
                  The payment status will be set to "pending".
                </p>
              </HoverCardContent>
            </HoverCard>
          )}
          <HoverCard openDelay={300} closeDelay={200}>
            <HoverCardTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleGenerateReport} 
                className="gap-2 mr-2"
              >
                <FileText className="h-4 w-4" />
                Generate Arabic Report
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80 p-4 bg-white border shadow-lg rounded-lg">
              <h4 className="font-medium mb-1">Arabic Agreement Report</h4>
              <p className="text-sm text-muted-foreground">
                Generate a detailed Arabic PDF report of this agreement including payment history and contract details.
              </p>
            </HoverCardContent>
          </HoverCard>
          <HoverCard openDelay={300} closeDelay={200}>
            <HoverCardTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRunMaintenanceJob} 
                disabled={paymentIsPending.runMaintenance} 
                className="gap-2"
              >
                <RefreshCcw className="h-4 w-4" />
                {paymentIsPending.runMaintenance ? "Running..." : "Run Payment Maintenance"}
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80 p-4 bg-white border shadow-lg rounded-lg">
              <h4 className="font-medium mb-1">Payment Maintenance</h4>
              <p className="text-sm text-muted-foreground">
                Checks and fixes payment schedules by detecting missing or duplicate payments, 
                updating payment statuses, and recalculating late fees if needed.
              </p>
            </HoverCardContent>
          </HoverCard>
        </>
      }
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <h2 className="text-3xl font-bold tracking-tight">
            Agreement {agreement.agreement_number}
          </h2>
          <Badge variant={getStatusBadgeVariant(agreement.status)}>
            {agreement.status.toUpperCase()}
          </Badge>
        </div>
      </div>

      <Card className="mb-6 overflow-hidden border-0 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md">
        <CardContent className="p-6 bg-zinc-100 rounded-md">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                {agreement.created_at && <>Created on {format(new Date(agreement.created_at), 'MMMM d, yyyy')}</>}
              </p>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white bg-opacity-80 p-4 rounded-lg shadow-sm">
              <p className="text-sm font-medium text-muted-foreground">Monthly Rent</p>
              <p className="text-2xl font-bold">QAR {rentAmount?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-white bg-opacity-80 p-4 rounded-lg shadow-sm">
              <p className="text-sm font-medium text-muted-foreground">Contract Total</p>
              <p className="text-2xl font-bold">QAR {contractAmount?.toLocaleString() || agreement.total_amount?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-white bg-opacity-80 p-4 rounded-lg shadow-sm">
              <p className="text-sm font-medium text-muted-foreground">Deposit</p>
              <p className="text-2xl font-bold">QAR {agreement.deposit_amount?.toLocaleString() || 0}</p>
            </div>
          </div>
          
          {agreement.start_date && agreement.end_date && (
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-1">
                <span>Contract Progress</span>
                <span>{calculateProgress()}%</span>
              </div>
              <Progress value={calculateProgress()} className="h-2" />
              <div className="flex justify-between text-xs mt-1">
                <span>{format(new Date(agreement.start_date), "MMM d, yyyy")}</span>
                <span>{format(new Date(agreement.end_date), "MMM d, yyyy")}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Use the AgreementDetailWrapper which handles both designs */}
      <AgreementDetailWrapper
        agreement={agreement}
        onDelete={handleDeleteAgreement}
        rentAmount={typeof rentAmount === 'number' ? rentAmount : null}
        contractAmount={typeof contractAmount === 'number' ? contractAmount : null}
        onPaymentDeleted={refreshAgreementData}
        onDataRefresh={refreshAgreementData}
        onGenerateDocument={handleGenerateDocument}
      />
      
      <Dialog open={isDocumentDialogOpen} onOpenChange={setIsDocumentDialogOpen}>
        <DialogContent className="max-w-4xl">
          <InvoiceGenerator 
            recordType="agreement" 
            recordId={agreement.id} 
            onClose={() => setIsDocumentDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default AgreementDetailPage;
