import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Scan, 
  User, 
  CreditCard, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Save
} from 'lucide-react';
import { toast } from 'sonner';
import IdCardScanner from './IdCardScanner';
import { useIdCardScanner, ExtractedIdData } from '@/hooks/use-id-card-scanner';

// مخطط التحقق من صحة البيانات
const customerSchema = z.object({
  full_name: z.string().min(2, 'الاسم يجب أن يكون أكثر من حرفين'),
  id_number: z.string()
    .regex(/^\d{11}$/, 'رقم الهوية يجب أن يكون 11 رقم')
    .min(11, 'رقم الهوية يجب أن يكون 11 رقم'),
  nationality: z.string().min(2, 'الجنسية مطلوبة'),
  date_of_birth: z.string().min(1, 'تاريخ الميلاد مطلوب'),
  phone_number: z.string()
    .regex(/^\+974\d{8}$/, 'رقم الهاتف يجب أن يبدأ بـ +974 ويتبعه 8 أرقام'),
  email: z.string().email('البريد الإلكتروني غير صحيح').optional().or(z.literal('')),
  address: z.string().optional(),
  driver_license: z.string().optional(),
  emergency_contact: z.string().optional(),
  id_expiry_date: z.string().optional(),
  gender: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormWithIdScannerProps {
  onSubmit: (data: CustomerFormData) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<CustomerFormData>;
  isSubmitting?: boolean;
  isArabic?: boolean;
}

export const CustomerFormWithIdScanner: React.FC<CustomerFormWithIdScannerProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isSubmitting = false,
  isArabic = true
}) => {
  const [showScanner, setShowScanner] = useState(false);
  const [scannedData, setScannedData] = useState<ExtractedIdData | null>(null);
  const [isAutoFilled, setIsAutoFilled] = useState(false);

  // إعداد النموذج
  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      full_name: initialData?.full_name || '',
      id_number: initialData?.id_number || '',
      nationality: initialData?.nationality || '',
      date_of_birth: initialData?.date_of_birth || '',
      phone_number: initialData?.phone_number || '',
      email: initialData?.email || '',
      address: initialData?.address || '',
      driver_license: initialData?.driver_license || '',
      emergency_contact: initialData?.emergency_contact || '',
      id_expiry_date: initialData?.id_expiry_date || '',
      gender: initialData?.gender || '',
    }
  });

  // hook مسح البطاقة
  const idCardScanner = useIdCardScanner({
    onSuccess: (data) => {
      setScannedData(data);
      applyScannedData(data);
      toast.success(isArabic ? 'تم استخراج البيانات بنجاح!' : 'Data extracted successfully!');
    },
    onError: (error) => {
      toast.error(isArabic ? `خطأ في المسح: ${error}` : `Scan error: ${error}`);
    }
  });

  // تطبيق البيانات المستخرجة على النموذج
  const applyScannedData = useCallback((data: ExtractedIdData) => {
    // تحديث الحقول بالبيانات المستخرجة
    form.setValue('full_name', data.fullName);
    form.setValue('id_number', data.idNumber);
    form.setValue('nationality', data.nationality);
    form.setValue('date_of_birth', data.dateOfBirth);
    form.setValue('id_expiry_date', data.expiryDate);
    
    if (data.phoneNumber) {
      form.setValue('phone_number', data.phoneNumber);
    }
    
    if (data.address) {
      form.setValue('address', data.address);
    }
    
    if (data.gender) {
      form.setValue('gender', data.gender);
    }

    setIsAutoFilled(true);
    setShowScanner(false);
    
    // تفعيل validation لإظهار أي أخطاء محتملة
    form.trigger();
  }, [form]);

  // معالجة إرسال النموذج
  const handleSubmit = async (data: CustomerFormData) => {
    try {
      await onSubmit(data);
      toast.success(isArabic ? 'تم حفظ بيانات العميل بنجاح!' : 'Customer data saved successfully!');
    } catch (error) {
      console.error('خطأ في حفظ العميل:', error);
      toast.error(isArabic ? 'فشل في حفظ البيانات' : 'Failed to save data');
    }
  };

  // إعادة تعيين النموذج
  const handleReset = () => {
    form.reset();
    setScannedData(null);
    setIsAutoFilled(false);
    toast.info(isArabic ? 'تم إعادة تعيين النموذج' : 'Form reset');
  };

  return (
    <div className="space-y-6" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Header مع زر المسح */}
      <Card>
        <CardHeader>
          <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
            <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
              <User className="h-6 w-6" />
              {isArabic ? 'بيانات العميل' : 'Customer Information'}
            </CardTitle>
            
            <div className={`flex gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
              {/* زر المسح الذكي */}
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowScanner(true)}
                className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}
              >
                <Scan className="h-4 w-4" />
                {isArabic ? 'مسح البطاقة الشخصية' : 'Scan ID Card'}
              </Button>
              
              {/* زر إعادة التعيين */}
              {(isAutoFilled || Object.values(form.getValues()).some(val => val !== '')) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {isArabic ? 'إعادة تعيين' : 'Reset'}
                </Button>
              )}
            </div>
          </div>
          
          {/* إشعار البيانات المستخرجة */}
          {isAutoFilled && scannedData && (
            <Alert className="mt-4 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <span>
                    {isArabic ? 'تم ملء البيانات تلقائياً من البطاقة الشخصية' : 'Data auto-filled from ID card'}
                  </span>
                  <Badge variant="secondary" className="mr-2">
                    {scannedData.confidence}% {isArabic ? 'دقة' : 'Accuracy'}
                  </Badge>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* المعلومات الأساسية */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                        <User className="h-4 w-4" />
                        {isArabic ? 'الاسم الكامل *' : 'Full Name *'}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className={isArabic ? 'text-right' : 'text-left'}
                          dir={isArabic ? 'rtl' : 'ltr'}
                          placeholder={isArabic ? 'أدخل الاسم الكامل' : 'Enter full name'}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="id_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                        <CreditCard className="h-4 w-4" />
                        {isArabic ? 'رقم الهوية *' : 'ID Number *'}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="text-left"
                          dir="ltr"
                          placeholder="12345678901"
                          maxLength={11}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nationality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                        <MapPin className="h-4 w-4" />
                        {isArabic ? 'الجنسية *' : 'Nationality *'}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className={isArabic ? 'text-right' : 'text-left'}
                          dir={isArabic ? 'rtl' : 'ltr'}
                          placeholder={isArabic ? 'قطري، سعودي، مصري...' : 'Qatari, Saudi, Egyptian...'}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date_of_birth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                        <Calendar className="h-4 w-4" />
                        {isArabic ? 'تاريخ الميلاد *' : 'Date of Birth *'}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="date"
                          className="text-left"
                          dir="ltr"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                        <Phone className="h-4 w-4" />
                        {isArabic ? 'رقم الهاتف *' : 'Phone Number *'}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="text-left"
                          dir="ltr"
                          placeholder="+97412345678"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                        <Mail className="h-4 w-4" />
                        {isArabic ? 'البريد الإلكتروني' : 'Email'}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="email"
                          className="text-left"
                          dir="ltr"
                          placeholder="example@email.com"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                        <MapPin className="h-4 w-4" />
                        {isArabic ? 'العنوان' : 'Address'}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className={isArabic ? 'text-right' : 'text-left'}
                          dir={isArabic ? 'rtl' : 'ltr'}
                          placeholder={isArabic ? 'العنوان بالتفصيل' : 'Detailed address'}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="driver_license"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                        <CreditCard className="h-4 w-4" />
                        {isArabic ? 'رقم رخصة القيادة' : 'Driver License Number'}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="text-left"
                          dir="ltr"
                          placeholder={isArabic ? 'رقم رخصة القيادة' : 'License number'}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* الحقول الإضافية من البطاقة */}
              {(scannedData?.expiryDate || scannedData?.gender) && (
                <div className="border-t pt-6">
                  <h3 className={`text-lg font-semibold mb-4 ${isArabic ? 'text-right' : 'text-left'}`}>
                    {isArabic ? 'معلومات إضافية من البطاقة' : 'Additional Information from ID'}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {scannedData?.expiryDate && (
                      <FormField
                        control={form.control}
                        name="id_expiry_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={isArabic ? 'text-right' : 'text-left'}>
                              {isArabic ? 'تاريخ انتهاء البطاقة' : 'ID Expiry Date'}
                            </FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="date"
                                className="text-left"
                                dir="ltr"
                                readOnly
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {scannedData?.gender && (
                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={isArabic ? 'text-right' : 'text-left'}>
                              {isArabic ? 'الجنس' : 'Gender'}
                            </FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className={isArabic ? 'text-right' : 'text-left'}
                                dir={isArabic ? 'rtl' : 'ltr'}
                                readOnly
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* أزرار الإجراءات */}
              <div className={`flex gap-4 pt-6 border-t ${isArabic ? 'flex-row-reverse' : ''}`}>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 max-w-xs"
                >
                  {isSubmitting ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {isSubmitting ? 
                    (isArabic ? 'جاري الحفظ...' : 'Saving...') : 
                    (isArabic ? 'حفظ العميل' : 'Save Customer')
                  }
                </Button>
                
                {onCancel && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onCancel}
                    disabled={isSubmitting}
                  >
                    {isArabic ? 'إلغاء' : 'Cancel'}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* مربع حوار المسح */}
      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className={isArabic ? 'text-right' : 'text-left'}>
              {isArabic ? 'مسح البطاقة الشخصية' : 'Scan ID Card'}
            </DialogTitle>
          </DialogHeader>
          
          <IdCardScanner
            onDataExtracted={(data) => {
              setScannedData(data);
              applyScannedData(data);
            }}
            onClose={() => setShowScanner(false)}
            isArabic={isArabic}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerFormWithIdScanner; 