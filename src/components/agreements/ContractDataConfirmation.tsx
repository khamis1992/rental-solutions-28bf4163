import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { 
  User, 
  Car, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  Calendar,
  CreditCard,
  Phone,
  Contact,
  Loader2
} from 'lucide-react';
import { CustomerInfo } from '@/types/customer';
import { customerService } from '@/services/CustomerService';
import { useNavigate } from 'react-router-dom';
import { useAgreementService } from '@/hooks/services/useAgreementService';
import { agreementPaymentService } from '@/services/AgreementPaymentService';
import { supabase } from '@/lib/supabase';
import { Agreement } from '@/types/agreement';
import { bypass } from '@/lib/typescript-bypass';

interface ContractDataConfirmationProps {
  customerData: CustomerInfo;
  contractData: any;
  onBack: () => void;
  onClose: () => void;
}

export const ContractDataConfirmation: React.FC<ContractDataConfirmationProps> = ({
  customerData,
  contractData,
  onBack,
  onClose
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  
  // استيراد خدمات إنشاء الاتفاقية
  const { createAgreement } = useAgreementService();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-QA', {
      style: 'currency',
      currency: 'QAR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // دالة لتحويل الأرقام إلى العربية
  const toArabicNumbers = (str: string | number) => {
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return String(str).replace(/[0-9]/g, (digit) => arabicNumbers[parseInt(digit)]);
  };

  const formatCurrencyArabic = (amount: number) => {
    const formatted = new Intl.NumberFormat('ar-QA', {
      minimumFractionDigits: 2
    }).format(amount);
    return toArabicNumbers(formatted) + ' ر.ق';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'غير محدد';
    try {
      const date = new Date(dateString);
      const formatted = date.toLocaleDateString('ar-QA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      return toArabicNumbers(formatted);
    } catch {
      return toArabicNumbers(dateString);
    }
  };

  const calculateEndDate = (startDate: string, duration: number) => {
    if (!startDate || !duration) return 'غير محدد';
    try {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setMonth(end.getMonth() + duration);
      return formatDate(end.toISOString());
    } catch {
      return 'غير محدد';
    }
  };

  // دالة لحساب تاريخ الانتهاء بصيغة ISO للاتفاقية
  const calculateEndDateISO = (startDate: string, duration: number): string => {
    if (!startDate || !duration) return new Date().toISOString();
    try {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setMonth(end.getMonth() + duration);
      return end.toISOString();
    } catch {
      return new Date().toISOString();
    }
  };

  // دالة لإنشاء أو البحث عن المركبة
  const findOrCreateVehicle = async (vehicleData: any) => {
    try {
      const plateNumber = vehicleData.registrationNumber;
      console.log('🔍 البحث عن مركبة برقم اللوحة:', plateNumber);
      
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
        make: vehicleData.brand || 'غير محدد',
        model: 'غير محدد',
        year: vehicleData.manufacturingYear || new Date().getFullYear(),
        license_plate: plateNumber,
        color: vehicleData.color || 'غير محدد',
        vin: vehicleData.chassisNumber || '',
        status: 'available' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
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

  const handleCreateAgreement = async () => {
    setIsCreating(true);
    
    try {
      console.log('🚀 بدء إنشاء العميل والمركبة والاتفاقية...');
      
      // 1. إنشاء العميل أولاً
      console.log('👤 إنشاء العميل:', customerData);
      
      const newCustomer = {
        full_name: customerData.full_name,
        email: customerData.email || '',
        phone_number: customerData.phone_number,
        driver_license: customerData.driver_license,
        nationality: customerData.nationality || 'قطرية',
        address: customerData.address || 'الدوحة'
      };

      const customerResult = await customerService.createCustomer(newCustomer);
      
      if (!customerResult.success || !customerResult.data) {
        throw new Error('فشل في إنشاء العميل');
      }

      const createdCustomer = customerResult.data;
      console.log('✅ تم إنشاء العميل بنجاح:', createdCustomer.id);
      
      toast.success('تم إنشاء العميل بنجاح! 👤', {
        description: 'جاري إنشاء المركبة...',
        duration: 2000
      });

      // 2. إنشاء أو البحث عن المركبة
      console.log('🚗 إنشاء أو البحث عن المركبة:', contractData.vehicle);
      const vehicleId = await findOrCreateVehicle(contractData.vehicle);
      
      if (!vehicleId) {
        throw new Error('فشل في إنشاء أو العثور على المركبة');
      }

      toast.success('تم إنشاء المركبة بنجاح! 🚗', {
        description: 'جاري إنشاء الاتفاقية...',
        duration: 2000
      });

      // 3. تحضير بيانات الاتفاقية
      const submissionData = bypass.any({
        customer_id: createdCustomer.id,
        vehicle_id: vehicleId,
        start_date: contractData.contract.startDate,
        end_date: calculateEndDateISO(contractData.contract.startDate, contractData.contract.contractDuration || 12),
        rent_amount: contractData.contract.monthlyRent || 0,
        deposit_amount: contractData.contract.depositAmount || 0,
        contract_duration_months: contractData.contract.contractDuration || 12,
        payment_frequency: 'monthly' as const,
        payment_day: 1,
        daily_late_fee: 120,
        agreement_type: 'lease_to_own' as const,
        status: 'active' as const,
        notes: `تم إنشاؤها من معالج العقود - دقة الاستخراج: ${contractData.confidence}%`,
        agreement_number: '', // سيتم توليده تلقائياً
        total_amount: (contractData.contract.monthlyRent || 0) * (contractData.contract.contractDuration || 12) + (contractData.contract.depositAmount || 0)
      });

      console.log('📋 بيانات الاتفاقية المحضرة:', submissionData);

      // 4. إنشاء الاتفاقية
      console.log('📝 إنشاء الاتفاقية...');
      const createdAgreement = await createAgreement(submissionData);
      
      if (!createdAgreement) {
        throw new Error('فشل في إنشاء الاتفاقية');
      }

      console.log('✅ تم إنشاء الاتفاقية بنجاح:', createdAgreement.id);

      toast.success('تم إنشاء الاتفاقية بنجاح! 📝', {
        description: 'جاري إنشاء جدولة الدفعات...',
        duration: 2000
      });

      // 5. إنشاء جدولة الدفعات
      try {
        console.log('💰 إنشاء جدولة الدفعات للاتفاقية:', createdAgreement.id);
        
        const paymentResult = await agreementPaymentService.createPaymentScheduleForAgreement(bypass.any(createdAgreement));

        if (paymentResult.success) {
          toast.success('تم إنشاء الاتفاقية وجدولة الدفعات بنجاح! 🎉', {
            description: `تم إنشاء ${paymentResult.scheduleCount} دفعة مجدولة`,
            duration: 3000
          });
        } else {
          console.error('فشل في إنشاء جدولة الدفعات:', paymentResult.error);
          toast.success('تم إنشاء الاتفاقية بنجاح! 📝', {
            description: 'سيتم إنشاء جدولة الدفعات عند عرض تفاصيل العقد',
            duration: 3000
          });
        }
      } catch (paymentError) {
        console.error('خطأ في إنشاء جدولة الدفعات:', paymentError);
        toast.success('تم إنشاء الاتفاقية بنجاح! 📝', {
          description: 'سيتم إنشاء جدولة الدفعات عند عرض تفاصيل العقد',
          duration: 3000
        });
      }

      // 6. إغلاق المعالج والانتقال لصفحة الاتفاقية المُنشأة
      onClose();
      
      // الانتقال مباشرة إلى صفحة تفاصيل الاتفاقية الجديدة
      navigate(`/agreements/${createdAgreement.id}`, { 
        replace: true,
        state: {
          fromContractProcessor: true,
          justCreated: true
        }
      });

    } catch (error) {
      console.error('❌ خطأ في إنشاء العميل والاتفاقية:', error);
      toast.error('فشل في إنشاء الاتفاقية', {
        description: error instanceof Error ? error.message : 'حدث خطأ غير معروف'
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">تأكيد البيانات المستخرجة</h2>
        <p className="text-gray-600">راجع البيانات التالية قبل إنشاء الاتفاقية</p>
      </div>

      {/* Confidence Badge */}
      {contractData.confidence && (
        <div className="flex justify-center">
          <Badge variant={contractData.confidence >= 80 ? "default" : "secondary"} className="text-sm">
            دقة الاستخراج: {toArabicNumbers(contractData.confidence)}%
          </Badge>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* بيانات العميل */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              بيانات العميل
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">الاسم الكامل:</span>
                <span className="font-semibold">{customerData.full_name}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">رقم الهوية القطرية:</span>
                <span className="font-semibold flex items-center gap-1">
                  <Contact className="w-4 h-4" />
                  {customerData.driver_license}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">رقم الهاتف:</span>
                <span className="font-semibold flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {customerData.phone_number}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">الجنسية:</span>
                <span className="font-semibold">{customerData.nationality || 'قطرية'}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">العنوان:</span>
                <span className="font-semibold">{customerData.address}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* بيانات المركبة */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="w-5 h-5 text-green-600" />
              بيانات المركبة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">الماركة:</span>
                <span className="font-semibold">{contractData.vehicle.brand}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">رقم اللوحة:</span>
                <span className="font-semibold">{contractData.vehicle.registrationNumber}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">سنة التصنيع:</span>
                <span className="font-semibold">{toArabicNumbers(contractData.vehicle.manufacturingYear || '')}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">اللون:</span>
                <span className="font-semibold">{contractData.vehicle.color}</span>
              </div>
              
              {contractData.vehicle.chassisNumber && (
                <div className="flex justify-between">
                  <span className="text-gray-600">رقم الشاسيه:</span>
                  <span className="font-semibold text-xs">{contractData.vehicle.chassisNumber}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* بيانات العقد */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            تفاصيل العقد
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <div className="text-sm text-gray-600">تاريخ البداية</div>
              <div className="font-semibold">{formatDate(contractData.contract.startDate)}</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CreditCard className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <div className="text-sm text-gray-600">الإيجار الشهري</div>
              <div className="font-semibold">{formatCurrencyArabic(contractData.contract.monthlyRent || 0)}</div>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <CreditCard className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
              <div className="text-sm text-gray-600">مبلغ الضمان</div>
              <div className="font-semibold">{formatCurrencyArabic(contractData.contract.depositAmount || 0)}</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <div className="text-sm text-gray-600">مدة العقد</div>
              <div className="font-semibold">{toArabicNumbers(contractData.contract.contractDuration || 0)} شهر</div>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex justify-between">
              <span className="text-gray-600">تاريخ انتهاء العقد:</span>
              <span className="font-semibold">
                {calculateEndDate(contractData.contract.startDate, contractData.contract.contractDuration || 12)}
              </span>
            </div>
            
            <div className="text-center py-4 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-700">
                إجمالي قيمة العقد: {formatCurrencyArabic(
                  (contractData.contract.monthlyRent || 0) * (contractData.contract.contractDuration || 1) + 
                  (contractData.contract.depositAmount || 0)
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* تحذير */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="text-right">
          <strong>ملاحظة مهمة:</strong> سيتم إنشاء العميل والاتفاقية تلقائياً بناءً على البيانات المعروضة أعلاه. 
          يمكنك تعديل تفاصيل الاتفاقية لاحقاً في الصفحة التالية.
        </AlertDescription>
      </Alert>

      {/* أزرار التحكم */}
      <div className="flex justify-between gap-4">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isCreating}
        >
          العودة للتعديل
        </Button>
        
        <Button
          onClick={handleCreateAgreement}
          disabled={isCreating}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {isCreating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin ml-2" />
              جاري إنشاء الاتفاقية...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 ml-2" />
              إنشاء العميل والاتفاقية
            </>
          )}
        </Button>
      </div>
    </div>
  );
}; 