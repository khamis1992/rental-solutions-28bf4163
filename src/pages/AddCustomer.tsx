import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import CustomerFormWithIdScanner from '@/components/customers/CustomerFormWithIdScanner';
import { useCustomers } from '@/hooks/use-customers';
import { Customer } from '@/lib/validation-schemas/customer';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const AddCustomer = () => {
  const navigate = useNavigate();
  const { createCustomer } = useCustomers();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      // تحويل البيانات للصيغة المطلوبة
      const customerData: Customer = {
        full_name: data.full_name,
        id_number: data.id_number,
        nationality: data.nationality,
        date_of_birth: data.date_of_birth,
        phone_number: data.phone_number,
        email: data.email || undefined,
        address: data.address || undefined,
        driver_license: data.driver_license || undefined,
        emergency_contact: data.emergency_contact || undefined,
        // إضافة البيانات الجديدة من مسح البطاقة
        id_expiry_date: data.id_expiry_date || undefined,
        gender: data.gender || undefined,
        status: 'active', // تعيين الحالة الافتراضية
      };

      const result = await createCustomer.mutateAsync(customerData);
      
      // إظهار رسالة نجاح مع خيارات للمستخدم
      toast.success('✅ تم إضافة العميل بنجاح!', {
        description: `تم إنشاء ملف العميل: ${data.full_name}`,
        action: {
          label: 'عرض قائمة العملاء',
          onClick: () => navigate('/customers')
        },
        duration: 5000,
      });

      // لا نقوم بـ navigate تلقائياً - نبقى في نفس الصفحة للسماح بإضافة عملاء أخرين
      // يمكن للمستخدم الانتقال لقائمة العملاء عبر الزر في رسالة النجاح
      
    } catch (error) {
      console.error('Error creating customer:', error);
      toast.error('❌ فشل في إنشاء العميل', {
        description: error instanceof Error ? error.message : 'حدث خطأ غير معروف'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/customers');
  };

  return (
    <PageContainer
      title="إضافة عميل جديد"
      description="إنشاء سجل عميل جديد باستخدام مسح البطاقة الشخصية أو الإدخال اليدوي"
    >
      {/* زر العودة */}
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => navigate('/customers')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          العودة للعملاء
        </Button>
      </div>

      {/* نموذج العميل مع مسح البطاقة */}
      <CustomerFormWithIdScanner
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
        isArabic={true}
      />
    </PageContainer>
  );
};

export default AddCustomer;
