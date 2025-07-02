
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '@/styles/legal-rtl.css';
import { differenceInMonths } from 'date-fns';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { toast } from 'sonner';
import { generateModernAgreementPDF } from '@/utils/modern-agreement-pdf';
import { PaymentEntryDialog } from '../PaymentEntryDialog';
import { AgreementDeletionDialog } from '../dialogs/AgreementDeletionDialog';
import { Agreement } from '@/types/agreement';
import { Payment } from '@/types/payment.types';
import { usePaymentManagement } from '@/hooks/payment/use-payment-management';
import { useLoadingStates } from '@/hooks/payment/use-loading-states';
import { useDialogVisibility } from '@/utils/api/dialog-utils';
import { usePaymentCalculation } from '@/hooks/payment/use-payment-calculation';
import { AgreementOverviewCard } from './tabs/AgreementOverviewCard';
import { PaymentManagementCard } from './tabs/PaymentManagementCard';
import { DocumentsCard } from './tabs/DocumentsCard';
import { SettingsCard } from './tabs/SettingsCard';
import { TrafficFinesTab } from './tabs/TrafficFinesTab';
import { FileText, CreditCard, FileImage, Settings, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface RedesignedAgreementDetailProps {
  agreement: Agreement | null;
  onDelete: (id: string) => void;
  rentAmount: number | null;
  contractAmount: number | null;
  onPaymentDeleted: () => void;
  onDataRefresh: () => void;
  onGenerateDocument?: () => void;
}

export function RedesignedAgreementDetail({
  agreement,
  onDelete,
  rentAmount,
  contractAmount,
  onPaymentDeleted,
  onDataRefresh,
  onGenerateDocument
}: RedesignedAgreementDetailProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Use the dialog management hook
  const { openDialog, closeDialog, isDialogVisible } = useDialogVisibility({
    delete: false,
    payment: false
  });
  
  // Use our loading states hook for PDF generation
  const { loadingStates, setLoading, setIdle } = useLoadingStates({
    generatingPdf: false
  });

  // Use payment management hook
  const {
    payments,
    isLoading: isLoadingPayments,
    updatePayment: updatePaymentMutation,
    addPayment: addPaymentMutation,
    deletePayment: deletePaymentMutation,
    refetch: fetchPayments
  } = usePaymentManagement(agreement?.id);
  
  // Helper function to safely convert date string to Date object
  const ensureDate = (dateValue: string | Date): Date => {
    if (typeof dateValue === 'string') {
      return new Date(dateValue);
    }
    return dateValue;
  };

  // Use payment calculation hook with correct parameters
  const paymentMetrics = usePaymentCalculation(
    payments, 
    contractAmount,
    agreement?.start_date ? ensureDate(agreement.start_date) : null,
    agreement?.end_date ? ensureDate(agreement.end_date) : null
  );

  // Handle agreement deletion
  const confirmDelete = useCallback(() => {
    if (agreement) {
      onDelete(agreement.id);
      closeDialog('delete');
    }
  }, [agreement, onDelete, closeDialog]);

  // Edit agreement
  const handleEdit = useCallback(() => {
    if (agreement) {
      navigate(`/agreements/edit/${agreement.id}`);
    }
  }, [agreement, navigate]);

  // Download PDF - محدث للنظام الجديد
  const handleDownloadPdf = useCallback(async () => {
    if (agreement) {
      try {
        setLoading('generatingPdf');
        toast.info("جاري تحضير ملف PDF للعقد...");
        
        // جلب بيانات العميل للحصول على صورة البطاقة الشخصية
        let customerIdCardImage: string | undefined;
        if (agreement.customer_id) {
          try {
            const { data: customerData, error: customerError } = await supabase
              .from('profiles')
              .select('id_card_image')
              .eq('id', agreement.customer_id)
              .single();
            
            if (customerError) {
              console.warn('تعذر جلب بيانات العميل:', customerError);
            } else if (customerData?.id_card_image) {
              customerIdCardImage = customerData.id_card_image;
              console.log('تم العثور على صورة البطاقة الشخصية للعميل');
            }
          } catch (error) {
            console.warn('خطأ في جلب صورة البطاقة الشخصية:', error);
          }
        }
        
        // تحضير بيانات العقد للنظام الجديد
        const agreementData = {
          ...agreement,
          agreement_number: agreement.agreement_number || '',
          start_date: ensureDate(agreement.start_date),
          end_date: ensureDate(agreement.end_date),
          created_at: ensureDate(agreement.created_at),
          updated_at: ensureDate(agreement.updated_at),
          total_amount: contractAmount || 0,
        };
        
        // استخدام النظام الجديد المتطور مع صورة البطاقة الشخصية  
        await generateModernAgreementPDF({
          ...agreementData,
          start_date: agreementData.start_date.toISOString(),
          end_date: agreementData.end_date.toISOString(),
          customers: agreementData.customers ? {
            full_name: agreementData.customers.full_name,
            phone_number: agreementData.customers.phone_number || undefined,
            nationality: (agreementData.customers as any).nationality || undefined,
            driver_license: agreementData.customers.driver_license || undefined,
            email: agreementData.customers.email || undefined,
            id_number: (agreementData.customers as any).id_number || undefined,
          } : undefined,
          vehicles: agreementData.vehicles ? {
            make: agreementData.vehicles.make || undefined,
            model: agreementData.vehicles.model || undefined,
            year: agreementData.vehicles.year || undefined,
            license_plate: agreementData.vehicles.license_plate || undefined,
            color: agreementData.vehicles.color || undefined,
            vin: agreementData.vehicles.vin || undefined,
          } : undefined,
        },
          payments || [], // الدفعات
          [], // المخالفات المرورية - يمكن إضافتها لاحقاً
          customerIdCardImage // صورة البطاقة الشخصية
        );
        
        if (customerIdCardImage) {
          toast.success("تم إنشاء ملف PDF بنجاح مع إرفاق صورة البطاقة الشخصية");
        } else {
          toast.success("تم إنشاء ملف PDF بنجاح - لم يتم العثور على صورة البطاقة الشخصية");
        }
      } catch (error) {
        console.error("خطأ في إنشاء ملف PDF:", error);
        toast.error("فشل في إنشاء ملف PDF");
      } finally {
        setIdle('generatingPdf');
      }
    }
  }, [agreement, payments, setLoading, setIdle]);

  // Record payment
  const handleRecordPayment = useCallback(async (payment: Partial<Payment>) => {
    try {
      await addPaymentMutation(payment);
      onDataRefresh();
    } catch (error) {
      console.error('Failed to record payment:', error);
    }
  }, [addPaymentMutation, onDataRefresh]);

  // Update payment
  const handleUpdatePayment = useCallback(async (payment: Partial<Payment>) => {
    if (payment.id) {
      try {
        const success = await updatePaymentMutation.mutateAsync({ id: payment.id, data: payment });
        if (success) {
          onDataRefresh();
        }
        return !!success;
      } catch (error) {
        console.error('Failed to update payment:', error);
        return false;
      }
    }
    return false;
  }, [updatePaymentMutation, onDataRefresh]);

  // Delete payment
  const handleDeletePayment = useCallback(async (paymentId: string) => {
    try {
      await deletePaymentMutation.mutateAsync(paymentId);
      onPaymentDeleted();
    } catch (error) {
      console.error('Failed to delete payment:', error);
    }
  }, [deletePaymentMutation, onPaymentDeleted]);
  
  // Convert onGenerateDocument to a Promise
  const handleGenerateDocument = useCallback(async (): Promise<void> => {
    return new Promise<void>((resolve) => {
      if (onGenerateDocument) {
        onGenerateDocument();
      }
      resolve();
    });
  }, [onGenerateDocument]);

  if (!agreement) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground legal-rtl" dir="rtl">
          لم يتم اختيار عقد
        </div>
      </Card>
    );
  }

  // Calculate duration for details card
  const startDate = ensureDate(agreement.start_date);
  const endDate = ensureDate(agreement.end_date);
  const duration = startDate && endDate ? differenceInMonths(endDate, startDate) : 0;

  // Helper function to get date string safely
  const getDateString = (date: string | Date): string => {
    if (typeof date === 'string') {
      return date;
    }
    return date.toISOString();
  };

  return (
    <div className="space-y-6 legal-rtl" dir="rtl">
      {/* Header with Agreement Info and Debug Toggle */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        {/* Title area moved to far right */}
        <div className="space-y-2 text-right order-1 lg:order-1">
          <div className="flex items-center gap-3 flex-row-reverse">
            <h1 className="text-2xl font-bold">تفاصيل العقد</h1>
            <Badge variant="outline" className="px-3 py-1">
              {agreement.agreement_number || 'بدون رقم'}
            </Badge>
            <Badge 
              variant={agreement.status === 'active' ? 'default' : 'secondary'}
              className="px-3 py-1"
            >
              {agreement.status === 'active' ? 'نشط' : agreement.status}
            </Badge>
          </div>
          <p className="text-muted-foreground text-right">
            إدارة معلومات العقد والمدفوعات والوثائق ذات الصلة
          </p>
        </div>
      </div>

      {/* Main Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5" dir="rtl">
          <TabsTrigger value="overview" className="flex items-center gap-2 flex-row-reverse">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">نظرة عامة</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2 flex-row-reverse">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">المدفوعات</span>
          </TabsTrigger>
          <TabsTrigger value="traffic-fines" className="flex items-center gap-2 flex-row-reverse">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">المخالفات</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2 flex-row-reverse">
            <FileImage className="h-4 w-4" />
            <span className="hidden sm:inline">الوثائق</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2 flex-row-reverse">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">الإعدادات</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <AgreementOverviewCard
            agreement={agreement}
            duration={duration}
            rentAmount={rentAmount}
            contractAmount={contractAmount}
          />
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6 mt-6">
          <PaymentManagementCard
            agreement={agreement}
            payments={payments}
            isLoading={isLoadingPayments}
            rentAmount={rentAmount}
            contractAmount={contractAmount}
            paymentMetrics={paymentMetrics}
            onPaymentDeleted={handleDeletePayment}
            onPaymentUpdated={handleUpdatePayment}
            onRecordPayment={handleRecordPayment}
            fetchPayments={fetchPayments}
            getDateString={getDateString}
          />
        </TabsContent>

        {/* Traffic Fines Tab */}
        <TabsContent value="traffic-fines" className="space-y-6 mt-6">
          <TrafficFinesTab
            agreementId={agreement.id}
            vehicleLicensePlate={agreement.vehicles?.license_plate || undefined}
          />
        </TabsContent>

        {/* Documents & Legal Tab */}
        <TabsContent value="documents" className="space-y-6 mt-6">
          <DocumentsCard
            agreement={agreement}
            onEdit={handleEdit}
            onDownloadPdf={handleDownloadPdf}
            onGenerateDocument={handleGenerateDocument}
            onDelete={() => openDialog('delete')}
            isGeneratingPdf={loadingStates.generatingPdf}
            getDateString={getDateString}
          />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6 mt-6">
          <SettingsCard
            agreement={agreement}
            onEdit={handleEdit}
            onDelete={() => openDialog('delete')}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AgreementDeletionDialog
        open={isDialogVisible('delete')}
        onOpenChange={() => closeDialog('delete')}
        agreementId={agreement.id}
        agreementNumber={agreement.agreement_number || 'غير معروف'}
        onConfirmDelete={async () => confirmDelete()}
      />

      {isDialogVisible('payment') && (
        <PaymentEntryDialog
          open={isDialogVisible('payment')}
          onOpenChange={() => closeDialog('payment')}
          onSubmit={async (amount, date, notes, method, reference) => {
            const payment: Partial<Payment> = {
              amount,
              payment_date: date.toISOString(),
              description: notes,
              payment_method: method,
              reference_number: reference,
              lease_id: agreement.id,
              status: 'paid'
            };
            await handleRecordPayment(payment);
            closeDialog('payment');
            return true;
          }}
          defaultAmount={rentAmount || 0}
          title="تسجيل دفعة"
          description="إضافة دفعة جديدة لهذا العقد"
          leaseId={agreement.id}
          rentAmount={rentAmount}
          selectedPayment={null}
        />
      )}
    </div>
  );
}
