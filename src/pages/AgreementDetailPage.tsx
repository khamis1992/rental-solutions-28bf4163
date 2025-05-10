import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import PageContainer from '@/components/layout/PageContainer';
import { SimpleAgreement } from '@/hooks/use-agreements';
import { useAgreement } from '@/hooks/use-agreement';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Agreement, forceGeneratePaymentForAgreement, AgreementStatus } from '@/lib/validation-schemas/agreement';
import { useRentAmount } from '@/hooks/use-rent-amount';
import { AlertTriangle, Calendar, RefreshCcw, FileText, User, Car, Gavel, BarChart, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import InvoiceGenerator from '@/components/invoices/InvoiceGenerator';
import { adaptSimpleToFullAgreement } from '@/utils/agreement-utils';
import { supabase } from '@/lib/supabase';
import { manuallyRunPaymentMaintenance } from '@/lib/supabase';
import { getDateObject } from '@/lib/date-utils';
import { usePayments } from '@/hooks/use-payments';
import { fixAgreementPayments } from '@/lib/supabase';
import { ensureArray } from '@/lib/type-helpers';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AgreementDetail } from '@/components/agreements/AgreementDetail';
import PaymentList from '@/components/payments/PaymentList';
import LegalCaseCard from '@/components/agreements/LegalCaseCard';
import { AgreementTrafficFines } from '@/components/agreements/AgreementTrafficFines';
import { AgreementTrafficFineAnalytics } from '@/components/agreements/legal/AgreementTrafficFineAnalytics';
import { asDbId, AgreementId } from '@/types/database-types';
import { PaymentHistory } from '@/components/agreements/PaymentHistory';
import { PaymentEntryDialog } from '@/components/agreements/PaymentEntryDialog';
import CustomerSection from '@/components/agreements/CustomerSection';
import VehicleSection from '@/components/agreements/VehicleSection';
import { generateAgreementReport } from '@/utils/agreement-report-utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

const AgreementDetailPage = () => {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const { 
    agreement,
    isLoading,
    error,
    deleteAgreement
  } = useAgreement(id);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  const [isGeneratingPayment, setIsGeneratingPayment] = useState(false);
  const [isRunningMaintenance, setIsRunningMaintenance] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const {
    rentAmount,
    contractAmount
  } = useRentAmount(agreement, id);
  const {
    payments,
    isLoading: isLoadingPayments,
    fetchPayments,
    addPayment,
    deletePayment,
    updatePayment
  } = usePayments(id || '');

  // Monitor for duplicate payments and fix them if needed
  useEffect(() => {
    if (id && !isLoading && agreement && Array.isArray(payments) && payments.length > 0) {
      const paymentDates = payments.filter(p => p.original_due_date).map(p => {
        const date = new Date(p.original_due_date as string);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      });
      const monthCounts = paymentDates.reduce((acc, date) => {
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const hasDuplicates = Object.values(monthCounts).some(count => count > 1);
      if (hasDuplicates) {
        console.log("Detected duplicate payments - will fix automatically");
        fixAgreementPayments(id).then(() => {
          fetchPayments();
        });
      }
    }
  }, [id, isLoading, agreement, payments, fetchPayments]);

  const refreshAgreementData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleGenerateDocument = () => {
    setIsDocumentDialogOpen(true);
  };

  const handleGeneratePayment = async () => {
    if (!id || !agreement) return;
    setIsGeneratingPayment(true);
    try {
      const result = await forceGeneratePaymentForAgreement(supabase, id);
      if (result.success) {
        toast.success("Payment schedule generated successfully");
        refreshAgreementData();
      } else {
        toast.error(`Failed to generate payment: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error generating payment:", error);
      toast.error("Failed to generate payment schedule");
    } finally {
      setIsGeneratingPayment(false);
    }
  };

  const handleRunMaintenanceJob = async () => {
    if (!id) return;
    setIsRunningMaintenance(true);
    try {
      toast.info("Running payment maintenance check...");
      const result = await manuallyRunPaymentMaintenance();
      if (result.success) {
        toast.success(result.message || "Payment schedule maintenance completed");
        refreshAgreementData();
        fetchPayments();
      } else {
        toast.error(result.message || "Payment maintenance failed");
      }
    } catch (error) {
      console.error("Error running maintenance job:", error);
      toast.error("Failed to run maintenance job");
    } finally {
      setIsRunningMaintenance(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!agreement) return;
    
    try {
      const doc = generateAgreementReport(agreement, rentAmount, contractAmount, payments);
      doc.save(`agreement-report-${agreement.agreement_number}.pdf`);
      toast.success('Agreement report generated successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate agreement report');
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
        return "success";
      case 'pending':
        return "warning";
      case 'closed':
        return "outline";
      case 'cancelled':
        return "destructive";
      case 'expired':
        return "secondary";
      case 'draft':
        return "default";
      default:
        return "default";
    }
  };

  const handlePaymentSubmit = async (
    amount: number, 
    paymentDate: Date, 
    notes?: string, 
    paymentMethod?: string, 
    referenceNumber?: string,
    includeLatePaymentFee?: boolean
  ) => {
    if (!id) return;
    
    try {
      const newPayment = {
        amount,
        payment_date: paymentDate.toISOString(),
        lease_id: id,
        payment_method: paymentMethod,
        reference_number: referenceNumber,
        notes,
        status: 'completed',
        description: notes || 'Payment'
      };
      
      await addPayment(newPayment);
      toast.success('Payment recorded successfully');
      fetchPayments();
      setIsPaymentDialogOpen(false);
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!id) return;
    
    try {
      await deletePayment(paymentId);
      fetchPayments();
      toast.success('Payment deleted successfully');
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast.error('Failed to delete payment');
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
  return <PageContainer title="Agreement Details" description="View and manage rental agreement details" backLink="/agreements" actions={
    <>
      {agreement && agreement.status === AgreementStatus.ACTIVE && (
        <HoverCard openDelay={300} closeDelay={200}>
          <HoverCardTrigger asChild>
            <Button variant="outline" size="sm" onClick={handleGeneratePayment} disabled={isGeneratingPayment} className="gap-2 mr-2">
              <Calendar className="h-4 w-4" />
              {isGeneratingPayment ? "Generating..." : "Generate Payment Schedule"}
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
            Generate Report
          </Button>
        </HoverCardTrigger>
        <HoverCardContent className="w-80 p-4 bg-white border shadow-lg rounded-lg">
          <h4 className="font-medium mb-1">Agreement Report</h4>
          <p className="text-sm text-muted-foreground">
            Generate a detailed PDF report of this agreement including payment history and contract details.
          </p>
        </HoverCardContent>
      </HoverCard>
      <HoverCard openDelay={300} closeDelay={200}>
        <HoverCardTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRunMaintenanceJob} 
            disabled={isRunningMaintenance} 
            className="gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            {isRunningMaintenance ? "Running..." : "Run Payment Maintenance"}
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
  }>
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center space-x-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Agreement {agreement.agreement_number}
        </h2>
        <Badge variant={getStatusBadgeVariant(agreement.status)}>
          {agreement.status.toUpperCase()}
        </Badge>
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={() => navigate(`/agreements/edit/${agreement.id}`)}>
          Edit
        </Button>
        <Button variant="destructive" size="sm" onClick={() => deleteAgreement(agreement.id)}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>
    </div>

    <Card className="mb-6 overflow-hidden border-0 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md">
      <CardContent className="p-6 bg-zinc-100 rounded-md">
        <div className="space-y-6">
          <div className="hidden">
            <AgreementDetail 
              agreement={agreement} 
              onDelete={deleteAgreement} 
              rentAmount={rentAmount} 
              contractAmount={contractAmount} 
              onPaymentDeleted={refreshAgreementData} 
              onDataRefresh={refreshAgreementData} 
              onGenerateDocument={handleGenerateDocument} 
            />
          </div>
        </div>
        
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
        
        {agreement.start_date && agreement.end_date && <div className="mt-6">
            <div className="flex justify-between text-sm mb-1">
              <span>Contract Progress</span>
              <span>{calculateProgress()}%</span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
            <div className="flex justify-between text-xs mt-1">
              <span>{format(new Date(agreement.start_date), "MMM d, yyyy")}</span>
              <span>{format(new Date(agreement.end_date), "MMM d, yyyy")}</span>
            </div>
          </div>}
      </CardContent>
    </Card>

    <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid grid-cols-4">
        <TabsTrigger value="overview" className="flex gap-2">
          <FileText className="h-4 w-4" /> Overview
        </TabsTrigger>
        <TabsTrigger value="payments" className="flex gap-2">
          <BarChart className="h-4 w-4" /> Payments
        </TabsTrigger>
        <TabsTrigger value="details" className="flex gap-2">
          <User className="h-4 w-4" /> Customer & Vehicle
        </TabsTrigger>
        <TabsTrigger value="legal" className="flex gap-2">
          <Gavel className="h-4 w-4" /> Legal & Compliance
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Agreement Summary</CardTitle>
            <CardDescription>Key details about the rental agreement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Customer</h3>
                  <p className="text-sm text-muted-foreground mb-1">Name</p>
                  <p>{agreement.customers?.full_name || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground mt-2 mb-1">Contact</p>
                  <p>{agreement.customers?.phone_number || 'N/A'}</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Rental Period</h3>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {agreement.start_date && format(new Date(agreement.start_date), "MMMM d, yyyy")} to {agreement.end_date && format(new Date(agreement.end_date), "MMMM d, yyyy")}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Vehicle</h3>
                  <p className="text-sm text-muted-foreground mb-1">Details</p>
                  <p>{agreement.vehicles?.make} {agreement.vehicles?.model} ({agreement.vehicles?.year || 'N/A'})</p>
                  <p className="text-sm text-muted-foreground mt-2 mb-1">License Plate</p>
                  <p>{agreement.vehicles?.license_plate || 'N/A'}</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Additional Information</h3>
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p className="whitespace-pre-line">{agreement.notes || 'No notes'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="payments" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>Track payments and financial transactions for this agreement</CardDescription>
          </CardHeader>
          <CardContent>
            {Array.isArray(payments) && 
              <PaymentHistory 
                payments={payments}
                isLoading={isLoadingPayments} 
                rentAmount={rentAmount} 
                contractAmount={agreement?.total_amount || null}
                onPaymentDeleted={handleDeletePayment}
                leaseStartDate={agreement.start_date}
                leaseEndDate={agreement.end_date}
                onRecordPayment={(payment) => {
                  if (payment && id) {
                    const fullPayment = {
                      ...payment,
                      lease_id: id,
                      status: 'completed'
                    };
                    addPayment(fullPayment);
                    fetchPayments();
                  }
                }}
                onPaymentUpdated={async (payment) => {
                  if (!payment.id) return false;
                  try {
                    await updatePayment({
                      id: payment.id,
                      data: payment
                    });
                    fetchPayments();
                    toast.success('Payment updated successfully');
                    return true;
                  } catch (error) {
                    console.error('Error updating payment:', error);
                    toast.error('Failed to update payment');
                    return false;
                  }
                }}
                leaseId={id}
              />
            }
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="details" className="space-y-6">
        {agreement?.customers && (
          <CustomerSection 
            customer={agreement.customers} 
            onEdit={() => navigate(`/customers/${agreement.customer_id}/edit`)}
          />
        )}
        
        {agreement?.vehicles && (
          <VehicleSection 
            vehicle={agreement.vehicles}
            onViewDetails={() => navigate(`/vehicles/${agreement.vehicle_id}`)}
          />
        )}
      </TabsContent>
      
      <TabsContent value="legal" className="space-y-6">
        {agreement.start_date && agreement.end_date && (
          <AgreementTrafficFineAnalytics 
            agreementId={agreement.id} 
            startDate={new Date(agreement.start_date)} 
            endDate={new Date(agreement.end_date)} 
          />
        )}
        
        {agreement.start_date && agreement.end_date && <Card>
            <CardHeader>
              <CardTitle>Traffic Fines</CardTitle>
              <CardDescription>Violations during the rental period</CardDescription>
            </CardHeader>
            <CardContent>
              <AgreementTrafficFines agreementId={agreement.id} startDate={new Date(agreement.start_date)} endDate={new Date(agreement.end_date)} />
            </CardContent>
          </Card>}
        
        {agreement.id && <LegalCaseCard agreementId={agreement.id} />}
      </TabsContent>
    </Tabs>
    
    <Dialog open={isDocumentDialogOpen} onOpenChange={setIsDocumentDialogOpen}>
      <DialogContent className="max-w-4xl">
        <InvoiceGenerator recordType="agreement" recordId={agreement.id} onClose={() => setIsDocumentDialogOpen(false)} />
      </DialogContent>
    </Dialog>

    <PaymentEntryDialog
      open={isPaymentDialogOpen}
      onOpenChange={setIsPaymentDialogOpen}
      onSubmit={handlePaymentSubmit}
      defaultAmount={rentAmount || 0}
      title="Record Payment"
      description="Enter payment details to record a new payment"
    />
  </PageContainer>;
};

export default AgreementDetailPage;
