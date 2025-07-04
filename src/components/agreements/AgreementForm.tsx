import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Agreement } from '@/types/agreement';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { agreementSchema, generateAgreementNumber } from '@/lib/validation-schemas/agreement';
import { toast } from 'sonner';
import { AgreementBasicDetails } from './form/AgreementBasicDetails';
import { AgreementContractTerms } from './form/AgreementContractTerms';
import { VehicleDetailsCard } from './form/VehicleDetailsCard';
import CustomerSection from './CustomerSection';
import { CustomerInfo } from '@/types/customer';
import { agreementPaymentService } from '@/services/AgreementPaymentService';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { errorLogger } from '@/lib/errors/error-logger';

interface AgreementFormProps {
  initialData?: Agreement;
  onSubmit: (data: Agreement) => Promise<void>;
  isSubmitting?: boolean;
  hideBasicDetails?: boolean; // إخفاء قسم التفاصيل الأساسية عند مسح العقد
}

const AgreementForm = ({
  initialData,
  onSubmit,
  isSubmitting = false,
  hideBasicDetails = false
}: AgreementFormProps) => {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null as any);
  const [selectedCustomer, setSelectedCustomer] = useState(null as CustomerInfo | null);
  const [isGeneratingAgreementNumber, setIsGeneratingAgreementNumber] = useState(false);

  // Initialize form with safe default values to prevent controlled/uncontrolled input issues  
  const getDefaultValues = (): Partial<Agreement> => {
    const defaults: Partial<Agreement> = {
      customer_id: '',
      vehicle_id: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      duration_months: 12,
      status: 'active' as const,
      agreement_type: 'lease_to_own' as const,
      agreement_number: '',
      deposit_amount: 0,
      rent_amount: 0,
      daily_late_fee: 120,
      notes: '',
      payment_frequency: 'monthly' as const,
      payment_day: 1
    };

    // If we have initialData, merge safely to prevent undefined values
    if (initialData) {
      const safeInitialData = Object.fromEntries(
        Object.entries(initialData).filter(([_, value]) => value !== undefined && value !== null)
      );
      return { ...defaults, ...safeInitialData };
    }

    return defaults;
  };

  const form = useForm<Agreement>({
    resolver: zodResolver(agreementSchema),
    defaultValues: getDefaultValues(),
  });

  const isEdit = !!initialData?.id;

  // Auto-generate agreement number for new agreements
  useEffect(() => {
    if (!isEdit && !form.getValues('agreement_number')) {
      const generateNumber = async () => {
        try {
          setIsGeneratingAgreementNumber(true);
          const newNumber = await generateAgreementNumber(supabase);
          form.setValue('agreement_number', newNumber);
        } catch (error) {
          errorLogger.logError(error as Error, {
            context: 'AgreementForm.generateAgreementNumber',
            action: 'auto_generate_agreement_number'
          });
          toast.error('فشل في توليد رقم الاتفاقية تلقائياً');
        } finally {
          setIsGeneratingAgreementNumber(false);
        }
      };
      
      generateNumber();
    }
  }, [isEdit, form]);

  // Set initial selections if editing
  useEffect(() => {
    if (initialData?.customers) {
      // تحويل بيانات العميل إلى CustomerInfo مع معالجة القيم null
      const customerInfo: CustomerInfo = {
        id: initialData.customers.id,
        full_name: initialData.customers.full_name,
        email: initialData.customers.email || '',
        phone_number: initialData.customers.phone_number || '',
        driver_license: initialData.customers.driver_license || '',
        nationality: '',
        address: initialData.customers.address || ''
      };
      setSelectedCustomer(customerInfo);
    }
    if (initialData?.vehicles) {
      setSelectedVehicle(initialData.vehicles);
    }
  }, [initialData]);

  // Handle vehicle selection changes
  const handleVehicleChange = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    form.setValue('vehicle_id', vehicle?.id || '');
  };

  // Handle customer selection changes
  const handleCustomerChange = (customer: CustomerInfo) => {
    setSelectedCustomer(customer);
    form.setValue('customer_id', customer?.id || '');
  };

  // Enhanced form submission with payment generation
  const handleSubmit = async (data: Agreement) => {
    if (!termsAccepted) {
      errorLogger.logError(new Error('Terms not accepted'), {
        context: 'AgreementForm.handleSubmit',
        action: 'terms_validation_failed'
      });
      toast.error('يجب الموافقة على الشروط والأحكام');
      return;
    }

    try {
      // Generate agreement number if not provided
      let agreementNumber = data.agreement_number;
      if (!agreementNumber) {
        try {
          agreementNumber = await generateAgreementNumber(supabase);
          console.log('تم توليد رقم اتفاقية جديد:', agreementNumber);
        } catch (error) {
          console.error('خطأ في توليد رقم الاتفاقية:', error);
          toast.error('فشل في توليد رقم الاتفاقية');
        return;
        }
      }
      
      // Prepare agreement data with proper date formatting
      const agreementData = {
        ...data,
        agreement_number: agreementNumber,
        start_date: typeof data.start_date === 'string' ? data.start_date : (data.start_date as Date).toISOString(),
        end_date: typeof data.end_date === 'string' ? data.end_date : (data.end_date as Date).toISOString(),
        // terms_accepted removed - not stored in database
      };

      console.log('🚀 Calling onSubmit with data:', agreementData);
      // Submit the agreement
      await onSubmit(agreementData);
      
      // Show success message
      toast.success(
        isEdit ? 'تم تحديث الاتفاقية بنجاح' : 'تم إنشاء الاتفاقية بنجاح',
        {
          description: `رقم الاتفاقية: ${agreementNumber}`
        }
      );
    } catch (error) {
      console.error('Agreement submission error:', error);
      toast.error('فشل في حفظ الاتفاقية');
    }
  };

  return (
    <div dir="rtl" className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit as any)} className="space-y-6 pb-10">
          {/* Agreement Number Generation Status */}
          {isGeneratingAgreementNumber && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription className="text-right">
                جاري توليد رقم الاتفاقية التلقائي...
              </AlertDescription>
            </Alert>
          )}

          {/* Agreement Number Display */}
          {form.watch('agreement_number') && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-right">
                <div className="font-medium">
                  رقم الاتفاقية: <span className="text-blue-600">{form.watch('agreement_number')}</span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {isEdit ? 'رقم الاتفاقية الحالي' : 'تم توليد رقم الاتفاقية تلقائياً'}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <AgreementBasicDetails 
            form={form} 
            isEdit={isEdit} 
            onVehicleChange={handleVehicleChange}
            onCustomerChange={handleCustomerChange}
            hideCustomerSelector={!!initialData?.customer_id} // إخفاء قسم العميل إذا كان محدد مسبقاً
            hideEntireSection={hideBasicDetails} // إخفاء القسم بالكامل عند مسح العقد
          />
          
          {selectedCustomer && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3 text-right">معلومات العميل</h3>
              <CustomerSection customer={selectedCustomer} />
            </div>
          )}

          {selectedVehicle && (
            <VehicleDetailsCard vehicle={selectedVehicle} />
          )}

          <AgreementContractTerms 
            form={form} 
            termsAccepted={termsAccepted} 
            setTermsAccepted={setTermsAccepted} 
          />

          {/* Terms Acceptance Validation */}
          {!termsAccepted && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-right">
                يجب الموافقة على الشروط والأحكام قبل حفظ الاتفاقية
              </AlertDescription>
            </Alert>
          )}

          {/* تم حذف بطاقة "ما سيحدث عند الحفظ" كما طُلب */}

          <div className="flex justify-start space-x-2 flex-row-reverse gap-2">
            <Button variant="outline" type="button" onClick={() => window.history.back()}>
              إلغاء
            </Button>
            <Button 
              type="submit" 
              className="bg-primary" 
              disabled={isSubmitting || isGeneratingAgreementNumber || !termsAccepted}
              onClick={() => {
                console.log('🔘 Button clicked - states:', {
                  isSubmitting,
                  isGeneratingAgreementNumber,
                  termsAccepted,
                  disabled: isSubmitting || isGeneratingAgreementNumber || !termsAccepted
                });
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  "جاري الحفظ..."
                </>
              ) : (
                isEdit ? "تحديث الاتفاقية" : "حفظ الاتفاقية"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AgreementForm;
