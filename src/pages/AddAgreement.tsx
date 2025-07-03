import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import AgreementWithCustomerSteps from '@/components/agreements/AgreementWithCustomerSteps';
import { useAgreementService } from '@/hooks/services/useAgreementService';
import { Agreement } from '@/types/agreement';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { agreementPaymentService } from '@/services/AgreementPaymentService';
import { supabase } from '@/lib/supabase';

const AddAgreement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { createAgreement } = useAgreementService();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [formInteracted, setFormInteracted] = useState(false);

  // استقبال البيانات من معالج العقود
  const prefilledData = location.state?.prefilledData;
  const fromContractProcessor = location.state?.fromContractProcessor;

  // عرض رسالة ترحيب إذا جاءت البيانات من معالج العقود
  useEffect(() => {
    if (fromContractProcessor && prefilledData) {
      console.log('📋 تم استقبال بيانات من معالج العقود:', prefilledData);
      console.log('🔍 نوع البيانات:', typeof prefilledData);
      console.log('🔍 مفاتيح البيانات:', Object.keys(prefilledData));
      console.log('🔍 معرف العميل:', prefilledData.customer_id);
      console.log('🔍 بيانات المركبة:', prefilledData.vehicle_data);
      
      toast.success('مرحباً! 🎉', {
        description: 'تم تعبئة النموذج تلقائياً بالبيانات المستخرجة من العقد',
        duration: 5000
      });
    } else {
      console.log('❌ لم يتم استقبال بيانات من معالج العقود');
      console.log('📋 location.state:', location.state);
    }
  }, [fromContractProcessor, prefilledData]);

  // تتبع تغييرات حالة الحماية
  useEffect(() => {
    console.log('🔄 Protection state changed:', { 
      hasUnsavedChanges, 
      formInteracted, 
      isSubmitting,
      protectionActive: hasUnsavedChanges && formInteracted && !isSubmitting
    });
  }, [hasUnsavedChanges, formInteracted, isSubmitting]);

  // نظام حماية متقدم من refresh وإغلاق الصفحة
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && !isSubmitting && formInteracted) {
        console.log('🛡️ beforeunload triggered - showing confirmation');
        // المتصفحات الحديثة تظهر رسالة افتراضية
        e.preventDefault();
        e.returnValue = ''; // Chrome يحتاج هذا
        return ''; // Safari يحتاج هذا
      }
    };

    // منع استخدام F5 و Ctrl+R
    const handleKeyDown = (e: KeyboardEvent) => {
      if (hasUnsavedChanges && !isSubmitting && formInteracted) {
        // F5
        if (e.key === 'F5') {
          e.preventDefault();
          if (confirm('هل أنت متأكد من تحديث الصفحة؟ ستفقد جميع البيانات المدخلة.')) {
            window.location.reload();
          }
          return false;
        }
        
        // Ctrl+R أو Cmd+R
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
          e.preventDefault();
          if (confirm('هل أنت متأكد من تحديث الصفحة؟ ستفقد جميع البيانات المدخلة.')) {
            window.location.reload();
          }
          return false;
        }
      }
    };

    if (hasUnsavedChanges && formInteracted) {
      window.addEventListener('beforeunload', handleBeforeUnload);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [hasUnsavedChanges, isSubmitting, formInteracted]);

  // تتبع تفاعل المستخدم مع النموذج
  useEffect(() => {
         const handleFormInteraction = () => {
       if (!formInteracted) {
         console.log('🟡 Form interaction detected - Enabling protection');
         setFormInteracted(true);
         setHasUnsavedChanges(true);
       }
     };

    // مراقبة جميع أحداث التفاعل مع النموذج
    const formInputs = ['input', 'select', 'textarea'];
    const handleInputChange = () => handleFormInteraction();
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('form') || target.closest('.agreement-form-rtl')) {
        handleFormInteraction();
      }
    };

    // إضافة event listeners
    formInputs.forEach(input => {
      document.addEventListener(input, handleInputChange);
    });
    document.addEventListener('click', handleClick);
    document.addEventListener('focus', handleInputChange, true);

    return () => {
      formInputs.forEach(input => {
        document.removeEventListener(input, handleInputChange);
      });
      document.removeEventListener('click', handleClick);
      document.removeEventListener('focus', handleInputChange, true);
         };
   }, [formInteracted]);

  // حماية من navigation الداخلي باستخدام popstate
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (hasUnsavedChanges && formInteracted && !isSubmitting) {
        const confirmed = confirm(
          'هل أنت متأكد من مغادرة هذه الصفحة؟ ستفقد جميع البيانات المدخلة غير المحفوظة.'
        );
        
        if (!confirmed) {
          // منع الرجوع
          window.history.pushState(null, '', window.location.href);
        } else {
          setHasUnsavedChanges(false);
          setFormInteracted(false);
        }
      }
    };

    if (hasUnsavedChanges && formInteracted) {
      // إضافة state جديد للتاريخ لمنع الرجوع
      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', handlePopState);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasUnsavedChanges, formInteracted, isSubmitting]);

  // دالة لإنشاء أو البحث عن المركبة
  const findOrCreateVehicle = async (vehicleData: any) => {
    try {
      // الحصول على رقم اللوحة من مصادر مختلفة
      const plateNumber = vehicleData?.vehicle_plate_number || vehicleData?.vehicle_data?.plate_number;
      
      console.log('🔍 البحث عن مركبة برقم اللوحة:', plateNumber);
      console.log('🔍 بيانات المركبة الواردة:', vehicleData);
      
      if (!plateNumber) {
        console.log('❌ رقم اللوحة غير متوفر');
        return null;
      }

      // البحث عن المركبة بالرقم أولاً
      const { data: existingVehicle, error: searchError } = await supabase
        .from('vehicles')
        .select('id')
        .eq('license_plate', plateNumber)
        .single();

      if (existingVehicle && !searchError) {
        console.log('✅ تم العثور على مركبة موجودة:', existingVehicle.id);
        return existingVehicle.id;
      }

      console.log('🆕 إنشاء مركبة جديدة...');

      // إنشاء مركبة جديدة إذا لم توجد
      const newVehicle = {
        make: vehicleData.vehicle_data?.make || vehicleData.vehicle_make || 'غير محدد',
        model: vehicleData.vehicle_data?.model || vehicleData.vehicle_model || 'غير محدد',
        year: vehicleData.vehicle_data?.year || vehicleData.vehicle_year || new Date().getFullYear(),
        license_plate: plateNumber,
        color: vehicleData.vehicle_data?.color || vehicleData.vehicle_color || 'غير محدد',
        vin: vehicleData.vehicle_data?.vin || vehicleData.vehicle_vin || '',
        status: 'available' as const,
        // تم حذف created_at و updated_at لأن Supabase ينشئهما تلقائياً
      };

      console.log('🚗 بيانات المركبة الجديدة:', newVehicle);

      const { data: createdVehicle, error: createError } = await supabase
        .from('vehicles')
        .insert(newVehicle)
        .select('id')
        .single();

      if (createError) {
        console.error('❌ خطأ في إنشاء المركبة:', createError);
        return null;
      }

      console.log('✅ تم إنشاء مركبة جديدة:', createdVehicle.id);
      return createdVehicle.id;
    } catch (error) {
      console.error('خطأ في العثور على أو إنشاء المركبة:', error);
      return null;
    }
  };

  const handleSubmit = async (data: Agreement) => {
    console.log('🚀 handleSubmit called with data:', data);
    setIsSubmitting(true);
    // إيقاف الحماية عند بدء الحفظ
    setHasUnsavedChanges(false);
    setFormInteracted(false);
    try {
      console.log('🔄 بدء إنشاء الاتفاقية:', data);
      console.log('📊 البيانات المرسلة:', {
        customer_id: data.customer_id,
        vehicle_id: data.vehicle_id,
        vehicle_plate_number: (data as any).vehicle_plate_number,
        start_date: data.start_date,
        rent_amount: data.rent_amount,
        deposit_amount: data.deposit_amount
      });
      
      // التحقق من وجود البيانات المطلوبة
      if (!data.customer_id) {
        console.error('❌ معرف العميل مفقود');
        throw new Error('معرف العميل مطلوب لإنشاء الاتفاقية');
      }

      // إنشاء أو البحث عن المركبة إذا كانت البيانات متوفرة
      let vehicleId = data.vehicle_id;
      console.log('🔍 فحص بيانات المركبة:', {
        vehicle_id: data.vehicle_id,
        vehicle_plate_number: (data as any).vehicle_plate_number,
        vehicle_data: (data as any).vehicle_data
      });
      
      if (!vehicleId && ((data as any).vehicle_plate_number || (data as any).vehicle_data?.plate_number)) {
        console.log('🔍 البحث عن أو إنشاء مركبة من بيانات مسح العقد...');
        vehicleId = await findOrCreateVehicle(data);
        if (vehicleId) {
          data.vehicle_id = vehicleId;
          console.log('✅ تم تعيين معرف المركبة:', vehicleId);
        }
      }
      
      console.log('📞 استدعاء createAgreement...');
      console.log('📞 استدعاء createAgreement...');
      // إنشاء الاتفاقية أولاً
      const result = await createAgreement(data);
      console.log('📋 نتيجة createAgreement:', result);
      console.log('📋 نتيجة createAgreement:', result);
      
      if (result) {
        console.log('تم إنشاء الاتفاقية بنجاح:', result);
        
        // عرض رسالة النجاح فوراً
        toast.success('تم إنشاء الاتفاقية بنجاح', {
          description: 'جاري إنشاء جدولة الدفعات...',
          duration: 3000
        });

        try {
          // إنشاء جدولة الدفعات للاتفاقية الجديدة
          console.log('بدء إنشاء جدولة الدفعات للاتفاقية:', result.id);
          
          // إنشاء object مطابق لنوع Agreement المطلوب مع type assertion
          const agreementForPayments = {
            id: result.id,
            customer_id: result.customer_id,
            vehicle_id: result.vehicle_id || '',
            start_date: typeof result.start_date === 'string' ? result.start_date : result.start_date.toISOString(),
            end_date: typeof result.end_date === 'string' ? result.end_date : result.end_date.toISOString(),
            rent_amount: result.rent_amount || 0,
            payment_frequency: result.payment_frequency || 'monthly',
            payment_day: result.payment_day || 1,
            deposit_amount: result.deposit_amount || 0,
            agreement_type: result.agreement_type || 'lease_to_own',
            agreement_number: result.agreement_number || '',
            status: result.status,
            daily_late_fee: result.daily_late_fee || 120,
            notes: result.notes || ''
          } as Agreement;
          
          const paymentResult = await agreementPaymentService.createPaymentScheduleForAgreement(agreementForPayments);

          if (paymentResult.success) {
            toast.success('تم إنشاء الاتفاقية وجدولة الدفعات بنجاح', {
              description: `تم إنشاء ${paymentResult.scheduleCount} دفعة مجدولة`,
              duration: 4000
            });
          } else {
            console.error('فشل في إنشاء جدولة الدفعات:', paymentResult.error);
            toast.success('تم إنشاء الاتفاقية بنجاح', {
              description: 'سيتم إنشاء جدولة الدفعات عند عرض تفاصيل العقد',
              duration: 4000
            });
          }
        } catch (paymentError) {
          console.error('خطأ في إنشاء جدولة الدفعات:', paymentError);
          toast.success('تم إنشاء الاتفاقية بنجاح', {
            description: 'سيتم إنشاء جدولة الدفعات عند عرض تفاصيل العقد',
            duration: 4000
          });
        }
        
        // مسح حالة التغييرات غير المحفوظة بعد النجاح
        console.log('✅ Agreement saved successfully - Disabling protection');
        setHasUnsavedChanges(false);
        setFormInteracted(false);
        
        // الانتقال مباشرة إلى صفحة تفاصيل العقد الجديد بدون timeout
        navigate(`/agreements/${result.id}`, { replace: true });
      }
    } catch (error) {
      console.error('Error creating agreement:', error);
      toast.error('فشل في إنشاء الاتفاقية', {
        description: error instanceof Error ? error.message : 'حدث خطأ غير معروف'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer
      title="إنشاء اتفاقية إيجار جديدة"
      description="إنشاء اتفاقية إيجار جديدة مع جدولة دفعات تلقائية"
      dir="rtl"
      forceTitleLeft={true}
    >
      <div className="max-w-4xl mx-auto space-y-6" dir="rtl">
        {/* مؤشر حالة الحماية */}
        {hasUnsavedChanges && formInteracted && (
          <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
            <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              تم تفعيل الحماية من فقدان البيانات. سيتم تحذيرك قبل مغادرة الصفحة أو تحديثها.
            </AlertDescription>
          </Alert>
        )}

        {/* Agreement Form */}
        <Card className="agreement-form-rtl">
          <CardHeader>
            <CardTitle className="text-right">تفاصيل الاتفاقية</CardTitle>
          </CardHeader>
          <CardContent>
            <AgreementWithCustomerSteps
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              prefilledData={prefilledData}
            />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default AddAgreement;
