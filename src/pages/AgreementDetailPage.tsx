import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import PageContainer from '@/components/layout/PageContainer';
import { useAgreements, SimpleAgreement } from '@/hooks/use-agreements';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Agreement, forceGeneratePaymentForAgreement, AgreementStatus } from '@/lib/validation-schemas/agreement';
import { useRentAmount } from '@/hooks/use-rent-amount';
import { AlertTriangle, Calendar, RefreshCcw, FileText, User, Car, Gavel, BarChart, Trash2 } from 'lucide-react';
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
import { asDbId, AgreementId } from '@/types/database-types';
import { PaymentEntryDialog } from '@/components/agreements/PaymentEntryDialog';

const AgreementDetailPage = () => {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const {
    getAgreement,
    deleteAgreement
  } = useAgreements();
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  const [isGeneratingPayment, setIsGeneratingPayment] = useState(false);
  const [isRunningMaintenance, setIsRunningMaintenance] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const {
    rentAmount,
    contractAmount
  } = useRentAmount(agreement, id);
  const {
    payments,
    isLoading: isLoadingPayments,
    fetchPayments
  } = usePayments(id || '');

  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  const fetchAgreementData = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const data = await getAgreement(id);
      if (data) {
        const adaptedAgreement = adaptSimpleToFullAgreement(data);
        if (adaptedAgreement.start_date) {
          const safeDate = getDateObject(adaptedAgreement.start_date);
          adaptedAgreement.start_date = safeDate || new Date();
        }
        if (adaptedAgreement.end_date) {
          const safeDate = getDateObject(adaptedAgreement.end_date);
          adaptedAgreement.end_date = safeDate || new Date();
        }
        if (adaptedAgreement.created_at) {
          const safeDate = getDateObject(adaptedAgreement.created_at);
          adaptedAgreement.created_at = safeDate;
        }
        if (adaptedAgreement.updated_at) {
          const safeDate = getDateObject(adaptedAgreement.updated_at);
          adaptedAgreement.updated_at = safeDate;
        }
        setAgreement(adaptedAgreement);
        fetchPayments();
      } else {
        toast.error("Agreement not found");
        navigate("/agreements");
      }
    } catch (error) {
      console.error('Error fetching agreement:', error);
      toast.error('Failed to load agreement details');
    } finally {
      setIsLoading(false);
      setHasAttemptedFetch(true);
    }
  };

  useEffect(() => {
    if (id && (!hasAttemptedFetch || refreshTrigger > 0)) {
      fetchAgreementData();
    }
  }, [id, refreshTrigger]);

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
  }, [id, isLoading, agreement, payments]);

  const handleDelete = async (agreementId: string) => {
    try {
      await deleteAgreement.mutateAsync(agreementId);
      toast.success("Agreement deleted successfully");
      navigate("/agreements");
    } catch (error) {
      console.error("Error deleting agreement:", error);
      toast.error("Failed to delete agreement");
    }
  };

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

  const handlePaymentSubmit = (
    amount: number, 
    paymentDate: Date, 
    notes?: string, 
    paymentMethod?: string, 
    referenceNumber?: string,
    includeLatePaymentFee?: boolean
  ) => {
    setIsPaymentDialogOpen(false);
  };

  return <PageContainer title="Agreement Details" description="View and manage rental agreement details" backLink="/agreements" actions={<>
          {agreement && agreement.status === AgreementStatus.ACTIVE && <Button variant="outline" size="sm" onClick={handleGeneratePayment} disabled={isGeneratingPayment} className="gap-2 mr-2">
              <Calendar className="h-4 w-4" />
              {isGeneratingPayment ? "Generating..." : "Generate Payment Schedule"}
            </Button>}
          <Button variant="outline" size="sm" onClick={handleRunMaintenanceJob} disabled={isRunningMaintenance} className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            {isRunningMaintenance ? "Running..." : "Run Payment Maintenance"}
          </Button>
        </>}>
      {isLoading ? <div className="space-y-6">
          <Skeleton className="h-12 w-2/3" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full md:col-span-2" />
          </div>
        </div> : agreement ? <>
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
              <Button variant="destructive" size="sm" onClick={() => handleDelete(agreement.id)}>
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
                    onDelete={handleDelete} 
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
                  {agreement && <PaymentList agreementId={agreement.id} onDeletePayment={refreshAgreementData} />}
                </CardContent>
              </Card>
              
              {Array.isArray(payments) && payments.length > 0 && <Card>
                  <CardHeader>
                    <CardTitle>Payment Analytics</CardTitle>
                    <CardDescription>Financial metrics for this agreement</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <p className="text-sm font-medium text-muted-foreground">Total Paid</p>
                        <p className="text-2xl font-bold">
                          QAR {payments.reduce((sum, payment) => sum + (payment.amount_paid || 0), 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <p className="text-sm font-medium text-muted-foreground">Remaining Balance</p>
                        <p className="text-2xl font-bold">
                          QAR {((agreement?.total_amount || 0) - payments.reduce((sum, payment) => sum + (payment.amount_paid || 0), 0)).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <p className="text-sm font-medium text-muted-foreground">Late Fees</p>
                        <p className="text-2xl font-bold">
                          QAR {payments.reduce((sum, payment) => sum + (payment.late_fine_amount || 0), 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>}
            </TabsContent>
            
            <TabsContent value="details" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Customer Information
                    </CardTitle>
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
                    <CardTitle className="flex items-center gap-2">
                      <Car className="h-5 w-5" />
                      Vehicle Information
                    </CardTitle>
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
                  <CardTitle>Agreement Terms</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="font-medium">Monthly Rent</p>
                      <p className="font-semibold">QAR {rentAmount?.toLocaleString() || '0'}</p>
                    </div>
                    
                    <div>
                      <p className="font-medium">Total Contract Amount</p>
                      <p className="font-semibold">QAR {contractAmount?.toLocaleString() || agreement.total_amount?.toLocaleString() || '0'}</p>
                    </div>
                    
                    <div>
                      <p className="font-medium">Deposit Amount</p>
                      <p>QAR {agreement.deposit_amount?.toLocaleString() || '0'}</p>
                    </div>
                    
                    <div>
                      <p className="font-medium">Daily Late Fee</p>
                      <p>QAR {agreement.daily_late_fee?.toLocaleString() || '0'}</p>
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
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="legal" className="space-y-6">
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
          
          <PaymentHistory 
            payments={Array.isArray(payments) ? payments : []} 
            isLoading={isLoading} 
            rentAmount={rentAmount} 
            onPaymentDeleted={() => {
              refreshAgreementData();
              fetchPayments();
            }} 
            leaseStartDate={agreement?.start_date} 
            leaseEndDate={agreement?.end_date}
            onRecordPayment={() => setIsPaymentDialogOpen(true)}
          />

          {agreement.start_date && agreement.end_date && (
            <LegalCaseCard agreementId={agreement.id} />
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
            title="Record Rent Payment" 
            description="Record a new rental payment for this agreement." 
            // lateFeeDetails={lateFeeDetails} //TODO
            // selectedPayment={selectedPayment} //TODO
          />
        </> : <div className="text-center py-12">
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
        </div>}
    </PageContainer>;
};

export default AgreementDetailPage;
