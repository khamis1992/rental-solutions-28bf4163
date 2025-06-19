import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import AgreementWithCustomerSteps from '@/components/agreements/AgreementWithCustomerSteps';
import { useAgreementService } from '@/hooks/services/useAgreementService';
import { Agreement } from '@/types/agreement';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Calculator, Clock, CheckCircle } from 'lucide-react';
import { agreementPaymentService } from '@/services/AgreementPaymentService';

const AddAgreement = () => {
  const navigate = useNavigate();
  const { createAgreement } = useAgreementService();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: Agreement) => {
    setIsSubmitting(true);
    try {
      console.log('بدء إنشاء الاتفاقية:', data);
      
      // إنشاء الاتفاقية أولاً
      const result = await createAgreement(data);
      
      if (result) {
        console.log('تم إنشاء الاتفاقية بنجاح:', result);
        
        toast.success('تم إنشاء الاتفاقية بنجاح', {
          description: 'سيتم إنشاء جدولة الدفعات تلقائياً في الخلفية...'
        });

        try {
          // إنشاء جدولة الدفعات للاتفاقية الجديدة
          console.log('بدء إنشاء جدولة الدفعات للاتفاقية:', result.id);
          
          const paymentResult = await agreementPaymentService.createPaymentScheduleForAgreement({
            ...result,
            start_date: result.start_date,
            end_date: result.end_date,
            rent_amount: result.rent_amount,
            payment_frequency: result.payment_frequency || 'monthly',
            payment_day: result.payment_day || 1,
            deposit_amount: result.deposit_amount || 0
          });

          if (paymentResult.success) {
            toast.success('تم إنشاء الاتفاقية وجدولة الدفعات بنجاح', {
              description: `تم إنشاء ${paymentResult.scheduleCount} دفعة مجدولة تلقائياً`
            });
          } else {
            console.error('فشل في إنشاء جدولة الدفعات:', paymentResult.error);
            toast.success('تم إنشاء الاتفاقية بنجاح', {
              description: 'سيتم إنشاء جدولة الدفعات تلقائياً عند عرض تفاصيل العقد'
            });
          }
        } catch (paymentError) {
          console.error('خطأ في إنشاء جدولة الدفعات:', paymentError);
          toast.success('تم إنشاء الاتفاقية بنجاح', {
            description: 'سيتم إنشاء جدولة الدفعات تلقائياً عند عرض تفاصيل العقد'
          });
        }
        
        // الانتقال إلى صفحة تفاصيل العقد الجديد
        setTimeout(() => {
          navigate(`/agreements/${result.id}`);
        }, 2000);
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
      title="إنشاء اتفاقية إيجار جديدة مع جدولة دفعات تلقائية"
      description="إنشاء اتفاقية إيجار جديدة مع جدولة دفعات تلقائية"

      dir="rtl"
    >
      <div className="max-w-4xl mx-auto space-y-6" dir="rtl">
        {/* Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-right flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                اتفاقية شاملة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground text-right">
                جميع التفاصيل اللازمة لإنشاء اتفاقية إيجار مكتملة
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-right flex items-center gap-2">
                <Calculator className="h-4 w-4 text-green-500" />
                جدولة تلقائية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground text-right">
                إنشاء جدولة دفعات تلقائية فوري بناءً على المدة والمبلغ
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-right flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-500" />
                توفير الوقت
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground text-right">
                لا حاجة لإدخال الدفعات يدوياً - النظام يتولى كل شيء تلقائياً
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Instructions Alert */}
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="text-right">
            <div className="space-y-2">
              <div className="font-medium">خطوات إنشاء الاتفاقية:</div>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>اختر العميل من القائمة أو ابحث عنه بالاسم أو الهاتف</li>
                <li>حدد المركبة المراد تأجيرها</li>
                <li>أدخل تواريخ الإيجار ومبلغ الإيجار الشهري</li>
                <li>راجع التفاصيل ووافق على الشروط</li>
                <li>احفظ الاتفاقية وستُنشأ جدولة الدفعات تلقائياً فوراً</li>
              </ol>
            </div>
          </AlertDescription>
        </Alert>

        {/* Agreement Form */}
        <Card className="agreement-form-rtl">
          <CardHeader>
            <CardTitle className="text-right">تفاصيل الاتفاقية</CardTitle>
          </CardHeader>
          <CardContent>
            <AgreementWithCustomerSteps
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          </CardContent>
        </Card>

        {/* Benefits Information */}
        <Alert variant="default">
          <AlertDescription className="text-right">
            <div className="space-y-2">
              <div className="font-medium">مزايا النظام التلقائي الجديد:</div>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>إنشاء فوري لجدولة دفعات مفصلة حسب المدة المحددة</li>
                <li>حساب تلقائي للمبالغ بناءً على تكرار الدفع</li>
                <li>تتبع حالة كل دفعة (معلقة، مدفوعة، متأخرة)</li>
                <li>إصلاح تلقائي للاتفاقيات القديمة التي تفتقد للمدفوعات</li>
                <li>تقارير مالية شاملة وتحليلات فورية</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    </PageContainer>
  );
};

export default AddAgreement;
