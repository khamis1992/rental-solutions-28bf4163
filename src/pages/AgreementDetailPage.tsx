
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '@/styles/legal-rtl.css';
import { format } from 'date-fns';
import PageContainer from '@/components/layout/PageContainer';
import { useAgreement } from '@/hooks/use-agreement';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { AgreementStatus } from '@/lib/validation-schemas/agreement';
import { useRentAmount } from '@/hooks/use-rent-amount';
import { AlertTriangle, FileText } from 'lucide-react';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import InvoiceGenerator from '@/components/invoices/InvoiceGenerator';
import { usePayments } from '@/hooks/use-payments';

import { Card, CardContent } from '@/components/ui/card';
import { AgreementDetailWrapper } from '@/components/agreements/AgreementDetailWrapper';
import { generateAgreementReportPdfmake } from '@/utils/agreement-report-utils';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { usePayment } from '@/hooks/use-payment';
import { useAgreementService } from '@/hooks/services/useAgreementService';
import { useTrafficFines } from '@/hooks/use-traffic-fines';
import { agreementPaymentService } from '@/services/AgreementPaymentService';
import { supabase } from '@/lib/supabase';
import { RecordPaymentDialog } from '@/components/payments/RecordPaymentDialog';
import { EnhancedFinancialSummary } from '@/components/legal/EnhancedFinancialSummary';

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
  const [autoPaymentCreationAttempted, setAutoPaymentCreationAttempted] = useState(false);
  
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

  // Additional state for financial integration
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isFinancialExpanded, setIsFinancialExpanded] = useState(true);

  // Automatic payment schedule creation
  useEffect(() => {
    const createPaymentScheduleIfNeeded = async () => {
      // Only attempt once and if we have an agreement
      if (autoPaymentCreationAttempted || !agreement?.id || isLoading) {
        return;
      }

      // Mark as attempted to prevent multiple calls
      setAutoPaymentCreationAttempted(true);

      console.log('🔄 Auto-checking payments for agreement on page load:', agreement.id);

      try {
        // Check directly from database to get the most current data
        const { data: existingPayments, error: paymentsError } = await supabase
          .from('unified_payments')
          .select('id')
          .eq('lease_id', agreement.id)
          .limit(1);

        if (paymentsError) {
          console.warn('⚠️ Error checking payments on page load:', paymentsError);
          return;
        }

        const hasPayments = existingPayments && existingPayments.length > 0;
        console.log(`📊 Page load check: Found ${existingPayments?.length || 0} payments for agreement ${agreement.id}`);

        if (hasPayments) {
          console.log('ℹ️ Payments already exist, no auto-creation needed');
          return;
        }

        // No payments found, create them automatically
        console.log('🚀 No payments found on page load, creating automatically...');
        const result = await agreementPaymentService.createPaymentScheduleByAgreementId(agreement.id);

        if (result.success && result.scheduleCount > 0) {
          console.log('✅ Payment schedule auto-created on page load');
          
          // Refresh payments data
          setTimeout(() => {
            fetchPayments();
            setRefreshTrigger(prev => prev + 1);
          }, 1000);
        }
      } catch (error) {
        console.warn('⚠️ Could not auto-create payment schedule on page load:', error);
        // Don't show error toast here as this is a background operation
      }
    };

    // Run after a delay to ensure all data is loaded
    const timeoutId = setTimeout(createPaymentScheduleIfNeeded, 1500);
    return () => clearTimeout(timeoutId);
  }, [agreement?.id, isLoading, fetchPayments, autoPaymentCreationAttempted]);

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
      
      generateAgreementReportPdfmake(agreement, rentAmount, contractAmount, payments, agreementTrafficFines);
      toast.success('Agreement report generated successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate agreement report');
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

  const handlePaymentAction = (action: 'add' | 'reminder' | 'report') => {
    switch (action) {
      case 'add':
        setIsPaymentDialogOpen(true);
        break;
      case 'reminder':
        toast.info('إرسال تذكير للعميل...');
        // TODO: Implement reminder functionality
        break;
      case 'report':
        handleGenerateReport();
        break;
      default:
        break;
    }
  };

  // Render loading state while fetching agreement
  if (isLoading) {
    return (
      <PageContainer title="تفاصيل العقد" description="تفاصيل العقد" dir="rtl" forceTitleLeft={true}>
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
      <PageContainer title="تفاصيل العقد" description="تفاصيل العقد">
        <div className="text-center py-12 legal-rtl" dir="rtl">
          <div className="flex items-center justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-amber-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-right">حدث خطأ أثناء تحميل العقد</h3>
          <p className="text-muted-foreground mb-4 text-right">
            {error instanceof Error ? error.message : 'حدث خطأ غير معروف أثناء جلب تفاصيل العقد.'}
          </p>
          <Button variant="outline" onClick={() => navigate("/agreements")}>العودة إلى العقود</Button>
        </div>
      </PageContainer>
    );
  }

  // Render not found state if agreement doesn't exist
  if (!agreement) {
    return (
      <PageContainer title="تفاصيل العقد" description="تفاصيل العقد">
        <div className="text-center py-12 legal-rtl" dir="rtl">
          <div className="flex items-center justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-amber-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-right">العقد غير موجود</h3>
          <p className="text-muted-foreground mb-4 text-right">
            العقد الذي تبحث عنه غير موجود أو تم حذفه.
          </p>
          <Button variant="outline" onClick={() => navigate("/agreements")}>العودة إلى العقود</Button>
        </div>
      </PageContainer>
    );
  }

  // Main component rendering with agreement data
  return (
    <PageContainer 
      title="تفاصيل العقد" 
      description="تفاصيل العقد"
      dir="rtl"
      forceTitleLeft={true}
    >
      <div className="legal-rtl" dir="rtl">
      <div className="flex justify-between items-center mb-4" dir="rtl">
        {/* Title and badges moved to far right */}
        <div className="flex items-center space-x-reverse space-x-2">
          <h2 className="text-3xl font-bold tracking-tight text-right">
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {agreement.agreement_number}
            </span>
          </h2>
          <Badge variant={getStatusBadgeVariant(agreement.status)}>
            {agreement.status.toUpperCase() === 'ACTIVE' && 'نشط'}
            {agreement.status.toUpperCase() === 'PENDING' && 'معلق'}
            {agreement.status.toUpperCase() === 'CLOSED' && 'مغلق'}
            {agreement.status.toUpperCase() === 'CANCELLED' && 'ملغى'}
            {agreement.status.toUpperCase() === 'EXPIRED' && 'منتهي'}
            {agreement.status.toUpperCase() === 'DRAFT' && 'مسودة'}
            {!['ACTIVE','PENDING','CLOSED','CANCELLED','EXPIRED','DRAFT'].includes(agreement.status.toUpperCase()) && agreement.status}
          </Badge>
        </div>
        
        {/* All action buttons moved to far left */}
        <div className="flex items-center gap-2 flex-row-reverse">
          <HoverCard openDelay={300} closeDelay={200}>
            <HoverCardTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleGenerateReport} 
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                إنشاء تقرير
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80 p-4 bg-white border shadow-lg rounded-lg">
              <h4 className="font-medium mb-1">تقرير العقد</h4>
              <p className="text-sm text-muted-foreground">
                إنشاء تقرير PDF مفصل لهذا العقد يشمل سجل الدفعات وتفاصيل العقد.
              </p>
            </HoverCardContent>
          </HoverCard>
        </div>
      </div>

      <Card className="mb-6 overflow-hidden border-0 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md">
        <CardContent className="p-6 bg-zinc-100 rounded-md text-right" dir="rtl">
          <div className="flex flex-col md:flex-row justify-between items-start mb-4">
            <div className="space-y-1 text-right">
              <h3 className="text-xl font-semibold text-right">
                تفاصيل العقد
              </h3>
              <p className="text-sm text-muted-foreground text-right">
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-medium">
                  {agreement.agreement_number}
                </span>
              </p>
              <p className="text-sm text-muted-foreground text-right">
                إدارة معلومات العقد والمدفوعات والوثائق ذات الصلة
              </p>
              {agreement.created_at && (
                <p className="text-sm text-muted-foreground text-right">
                  تم الإنشاء في {format(new Date(agreement.created_at), 'd MMMM, yyyy', {locale: undefined})}
                </p>
              )}
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4" dir="rtl">
            <div className="bg-white bg-opacity-80 p-4 rounded-lg shadow-sm text-right">
              <p className="text-sm font-medium text-muted-foreground text-right">الإيجار الشهري</p>
              <p className="text-2xl font-bold text-right">ر.ق {rentAmount?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-white bg-opacity-80 p-4 rounded-lg shadow-sm text-right">
              <p className="text-sm font-medium text-muted-foreground text-right">إجمالي العقد</p>
              <p className="text-2xl font-bold text-right">ر.ق {contractAmount?.toLocaleString() || agreement.total_amount?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-white bg-opacity-80 p-4 rounded-lg shadow-sm text-right">
              <p className="text-sm font-medium text-muted-foreground text-right">الضمان</p>
              <p className="text-2xl font-bold text-right">ر.ق {agreement.deposit_amount?.toLocaleString() || 0}</p>
            </div>
          </div>
          
          {agreement.start_date && agreement.end_date && (
            <div className="mt-6" dir="rtl">
              <div className="flex justify-between text-sm mb-1 text-right">
                <span>{calculateProgress()}%</span>
                <span>تقدم العقد</span>
              </div>
              <Progress value={calculateProgress()} className="h-2" />
              <div className="flex justify-between text-xs mt-1 text-right">
                <span>{format(new Date(agreement.end_date), "d MMMM, yyyy", {locale: undefined})}</span>
                <span>{format(new Date(agreement.start_date), "d MMMM, yyyy", {locale: undefined})}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Financial Summary - New Design */}
      {agreement && isFinancialExpanded && (() => {
        // Calculate financial data for the enhanced summary
        const overduePayments = payments.filter(p => p.status === 'overdue');
        const overduePaymentsCount = overduePayments.length;
        const monthlyRentAmount = rentAmount || 0;
        const totalOverdueAmount = overduePayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const totalLateFees = overduePaymentsCount * 3000; // 3000 QAR per month as per business // rules - removed unused variable// حساب إجمالي المخالفات المرورية لهذا العقد
        const agreementTrafficFines = trafficFines?.filter(fine => 
          fine.leaseId === agreement.id
        ) || [];
        const totalTrafficFines = agreementTrafficFines.reduce((sum, fine) => sum + (fine.fineAmount || 0), 0);
        
        console.log(`🚗 المخالفات المرورية للعقد ${agreement.id}:`, {
          totalFines: trafficFines?.length || 0,
          agreementFines: agreementTrafficFines.length,
          totalAmount: totalTrafficFines,
          fineDetails: agreementTrafficFines.map(f => ({ 
            id: f.id, 
            leaseId: f.leaseId, 
            amount: f.fineAmount,
            licensePlate: f.licensePlate
          }))
        });
        
        const grandTotal = totalOverdueAmount + totalLateFees + totalTrafficFines;

                 // Show enhanced summary if there are overdue payments
         if (overduePaymentsCount > 0) {
           return (
             <div className="mb-6">
               <EnhancedFinancialSummary
                 overduePaymentsCount={overduePaymentsCount}
                 monthlyRentAmount={monthlyRentAmount}
                 totalOverdueAmount={totalOverdueAmount}
                 totalLateFees={totalLateFees}
                 trafficFinesAmount={totalTrafficFines}
                 grandTotal={grandTotal}
               />
             </div>
           );
         }
         
         // Show status indicator when no overdue payments
         if (payments.length > 0) {
           return (
             <div className="mb-6">
               <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                 <CardContent className="p-6 text-center">
                   <div className="flex items-center justify-center gap-3 mb-2">
                     <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                     <h3 className="text-lg font-semibold text-green-800">
                       ✅ الوضع المالي للعقد ممتاز
                     </h3>
                   </div>
                   <p className="text-green-700 text-sm">
                     لا توجد مدفوعات متأخرة • جميع الدفعات محدثة
                   </p>
                 </CardContent>
               </Card>
             </div>
           );
         }
         
         return null;
      })()}

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

      {/* Add payment dialog */}
      <RecordPaymentDialog 
        open={isPaymentDialogOpen} 
        onOpenChange={setIsPaymentDialogOpen}
      />
      </div>
    </PageContainer>
  );
};

export default AgreementDetailPage;
