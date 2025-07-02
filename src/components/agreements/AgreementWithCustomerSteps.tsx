import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { Alert, AlertDescription } from '@/components/ui/alert';

import { CheckCircle, Users, FileText, ArrowLeft, Upload } from 'lucide-react';
import { CustomerOnboardingWizard } from '@/components/customers/CustomerOnboardingWizard';
import AgreementForm from './AgreementForm';
import CustomerSelector from '@/components/customers/CustomerSelector';
import CarRentalContractProcessor from './CarRentalContractProcessor';
import { CustomerInfo } from '@/types/customer';
import { Agreement } from '@/types/agreement';
import { Customer } from '@/lib/validation-schemas/customer';
import { useCustomers } from '@/hooks/use-customers';
import { toast } from 'sonner';

interface AgreementWithCustomerStepsProps {
  onSubmit: (data: Agreement) => Promise<void>;
  isSubmitting?: boolean;
  prefilledData?: any; // البيانات المُعبأة مسبقاً من معالج العقود
}

type Step = 'customer-choice' | 'customer-selection' | 'agreement-creation' | 'pdf-processing';

const AgreementWithCustomerSteps: React.FC<AgreementWithCustomerStepsProps> = ({
  onSubmit,
  isSubmitting = false,
  prefilledData
}) => {
  // تتبع البيانات الواردة
  console.log('🔍 AgreementWithCustomerSteps received props:', {
    isSubmitting,
    prefilledData,
    hasPrefilledData: !!prefilledData
  });

  const [currentStep, setCurrentStep] = useState<Step>('customer-choice');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerInfo | null>(null);
  const [customerWizardOpen, setCustomerWizardOpen] = useState(false);
  const [, setCreatingCustomer] = useState(false);
  const [pdfProcessorOpen, setPdfProcessorOpen] = useState(false);
  const [contractData, setContractData] = useState<any>(null);
  const { createCustomer } = useCustomers();

  const steps = [
    { id: 'customer-choice' as const, title: 'اختيار العميل', icon: Users },
    { id: 'agreement-creation' as const, title: 'تفاصيل الاتفاقية', icon: FileText }
  ];

  // معالجة البيانات المُعبأة مسبقاً من معالج العقود
  useEffect(() => {
    console.log('🔄 useEffect triggered for prefilledData:', {
      hasPrefilledData: !!prefilledData,
      prefilledDataKeys: prefilledData ? Object.keys(prefilledData) : []
    });
    
    if (prefilledData) {
      console.log('🎯 تم استقبال بيانات مُعبأة مسبقاً:', prefilledData);
      
      // إنشاء بيانات العميل من prefilledData
      if (prefilledData.customer) {
        console.log('👤 بيانات العميل من معالج العقود:', prefilledData.customer);
        setSelectedCustomer(prefilledData.customer);
      } else if (prefilledData.customer_id) {
        // العميل موجود بمعرف فقط، نحتاج لإنشاء كائن CustomerInfo
        console.log('👤 معرف العميل:', prefilledData.customer_id);
        const customerInfo: CustomerInfo = {
          id: prefilledData.customer_id,
          full_name: prefilledData.customer_name || 'عميل من معالج العقود',
          email: prefilledData.customer_email || '',
          phone_number: prefilledData.customer_phone || '',
          driver_license: prefilledData.customer_license || '',
          nationality: prefilledData.customer_nationality || '',
          address: prefilledData.customer_address || ''
        };
        setSelectedCustomer(customerInfo);
      }
      
      // تعيين بيانات العقد
      setContractData(prefilledData);
      
      // الانتقال مباشرة لخطوة إنشاء الاتفاقية
      console.log('🚀 الانتقال لخطوة إنشاء الاتفاقية...');
      setCurrentStep('agreement-creation');
      
      toast.success('تم تعبئة النموذج تلقائياً! 🎉', {
        description: 'البيانات من معالج العقود جاهزة للمراجعة'
      });
    } else {
      console.log('❌ لم يتم استقبال بيانات مُعبأة مسبقاً');
    }
  }, [prefilledData]);

  const handleCustomerChoice = (choice: 'existing' | 'new' | 'pdf') => {
    if (choice === 'existing') {
      setCurrentStep('customer-selection');
    } else if (choice === 'new') {
      setCustomerWizardOpen(true);
    } else if (choice === 'pdf') {
      setPdfProcessorOpen(true);
    }
  };

  const handleExistingCustomerSelect = (customer: CustomerInfo) => {
    setSelectedCustomer(customer);
    setCurrentStep('agreement-creation');
    toast.success(`تم اختيار العميل: ${customer.full_name || 'غير محدد'}`);
  };

  const handleCustomerCreation = async (customerData: Customer) => {
    setCreatingCustomer(true);
    try {
      const newCustomer = await createCustomer.mutateAsync(customerData);
      
      // Convert the created customer to CustomerInfo format
      const customerInfo: CustomerInfo = {
        id: newCustomer.id ?? '',
        full_name: newCustomer.full_name ?? '',
        email: newCustomer.email ?? '',
        phone_number: newCustomer.phone ?? '',
        driver_license: newCustomer.driver_license ?? '',
        nationality: newCustomer.nationality ?? '',
        address: newCustomer.address ?? ''
      };
      
      setSelectedCustomer(customerInfo);
      setCustomerWizardOpen(false);
      setCurrentStep('agreement-creation');
      toast.success('تم إنشاء العميل بنجاح');
    } catch (error) {
      console.error('Error creating customer:', error);
      toast.error('فشل في إنشاء العميل', {
        description: error instanceof Error ? error.message : 'حدث خطأ غير معروف'
      });
    } finally {
      setCreatingCustomer(false);
    }
  };

  const handleContractDataExtracted = (customerData: CustomerInfo, contractData: any) => {
    console.log('🔍 Contract Data Extracted:', { customerData, contractData });
    
    // 🎯 التأكد من تنسيق التاريخ الصحيح
    let startDate = contractData.contract?.startDate || '';
    console.log('📅 تاريخ البداية المستخرج:', startDate);
    
    // تحويل التاريخ إلى تنسيق YYYY-MM-DD إذا لم يكن كذلك
    if (startDate && !startDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // إذا كان التاريخ بصيغة DD/MM/YYYY أو DD-MM-YYYY
      const dateParts = startDate.split(/[\/\-\.]/);
      if (dateParts.length === 3) {
        const [day, month, year] = dateParts;
        if (year.length === 4) {
          startDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          console.log('🔄 تم تحويل التاريخ إلى:', startDate);
        }
      }
    }
    
    // تحويل أسماء الحقول لتتطابق مع نموذج الاتفاقية
    const formattedContractData = {
      // بيانات التاريخ والمبالغ من العقد المستخرج
      start_date: startDate, // التاريخ بالتنسيق الصحيح
      monthly_rent: contractData.contract?.monthlyRent || 0,
      contract_duration_months: contractData.contract?.contractDuration || 12,
      deposit_amount: contractData.contract?.depositAmount || 0,
      
      // بيانات المركبة من العقد
      vehicle_data: {
        make: contractData.vehicle?.brand || '',
        model: 'غير محدد', // لأننا حذفنا الموديل
        year: contractData.vehicle?.manufacturingYear || new Date().getFullYear(),
        plate_number: contractData.vehicle?.registrationNumber || '',
        color: contractData.vehicle?.color || 'غير محدد',
        vin: contractData.vehicle?.chassisNumber || ''
      },
      
      // معلومات إضافية
      confidence: contractData.confidence || 0,
      extraction_method: contractData.debugInfo?.extractionMethod || 'unknown'
    };
    
    console.log('✅ Formatted Contract Data for Form:', formattedContractData);
    console.log('🎯 تاريخ البداية النهائي:', formattedContractData.start_date);
    console.log('💰 مبلغ الضمان المستخرج:', formattedContractData.deposit_amount);
    
    setSelectedCustomer(customerData);
    setContractData(formattedContractData);
    setPdfProcessorOpen(false);
    setCurrentStep('agreement-creation');
    toast.success(`تم استخراج البيانات بنجاح من العقد! (دقة: ${formattedContractData.confidence}%)`);
  };

  // const getCurrentStepIndex = () => {
  //   return steps.findIndex(step => step.id === currentStep);
  // };

  if (currentStep === 'customer-choice') {
    return (
      <div className="space-y-6" dir="rtl">
        {/* Step Indicator */}
        <div className="flex items-center justify-center space-x-4 space-x-reverse mb-8">
          {steps.map((step, index) => {
            // Determine step status based on current step
            // const isFirstStep = index === 0;
            // const isLastStep = index === steps.length - 1;
            
            let isActive = false;
            let isCompleted = false;
            
            if (step.id === 'customer-choice') {
              isActive = currentStep === 'customer-choice' || currentStep === 'customer-selection';
              isCompleted = (currentStep as string) === 'agreement-creation';
            } else if (step.id === 'agreement-creation') {
              isActive = (currentStep as string) === 'agreement-creation';
              isCompleted = false;
            }
            
            const StepIcon = step.icon;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  isCompleted ? 'bg-green-500 border-green-500 text-white' :
                  isActive ? 'bg-blue-500 border-blue-500 text-white' :
                  'bg-gray-100 border-gray-300 text-gray-500'
                }`}>
                  {isCompleted ? <CheckCircle className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                </div>
                <span className={`mr-2 text-sm font-medium ${
                  isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <ArrowLeft className="w-4 h-4 text-gray-400 mx-4" />
                )}
              </div>
            );
          })}
        </div>

        {/* Customer Choice Step */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right flex items-center gap-2">
              <Users className="w-5 h-5" />
              اختر طريقة إضافة العميل
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-right">
                يمكنك اختيار عميل موجود في النظام أو إنشاء عميل جديد الآن. 
                إذا اخترت إنشاء عميل جديد، ستنتقل إلى نموذج إنشاء العميل أولاً، 
                ثم ستعود تلقائياً لإنشاء الاتفاقية مع بيانات العميل الجديد.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="cursor-pointer border-2 hover:border-green-500 transition-colors"
                    onClick={() => handleCustomerChoice('new')}>
                <CardContent className="p-6 text-center">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-medium">إنشاء عميل جديد</h3>
                    <p className="text-sm text-muted-foreground text-center">
                      إنشاء سجل عميل جديد قبل إنشاء الاتفاقية
                    </p>
                    <Badge variant="outline">خطوة إضافية</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer border-2 hover:border-purple-500 transition-colors"
                    onClick={() => handleCustomerChoice('pdf')}>
                <CardContent className="p-6 text-center">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Upload className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-medium">معالجة عقد إيجار سيارة</h3>
                    <p className="text-sm text-muted-foreground text-center">
                      رفع عقد PDF واستخراج بيانات العميل والمركبة تلقائياً
                    </p>
                    <Badge variant="outline" className="bg-purple-50 text-purple-700">استخراج ذكي</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer border-2 hover:border-blue-500 transition-colors" 
                    onClick={() => handleCustomerChoice('existing')}>
                <CardContent className="p-6 text-center">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-medium">اختيار عميل موجود</h3>
                    <p className="text-sm text-muted-foreground text-center">
                      اختر من قائمة العملاء المسجلين في النظام
                    </p>
                    <Badge variant="secondary">الخيار الأسرع</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Customer Creation Wizard */}
        <CustomerOnboardingWizard
          open={customerWizardOpen}
          onClose={() => setCustomerWizardOpen(false)}
          onComplete={handleCustomerCreation}
        />

        {/* Car Rental Contract Processor Dialog */}
        <CarRentalContractProcessor
          open={pdfProcessorOpen}
          onDataExtracted={handleContractDataExtracted}
          onClose={() => setPdfProcessorOpen(false)}
        />
      </div>
    );
  }

  if (currentStep === 'customer-selection') {
    return (
      <div className="space-y-6" dir="rtl">
        {/* Step Indicator */}
        <div className="flex items-center justify-center space-x-4 space-x-reverse mb-8">
          {steps.map((step, index) => {
            let isActive = false;
            let isCompleted = false;
            
            if (step.id === 'customer-choice') {
              isActive = true; // customer-choice is active in customer-selection step
              isCompleted = false;
            } else if (step.id === 'agreement-creation') {
              isActive = false;
              isCompleted = false;
            }
            
            const StepIcon = step.icon;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  isCompleted ? 'bg-green-500 border-green-500 text-white' :
                  isActive ? 'bg-blue-500 border-blue-500 text-white' :
                  'bg-gray-100 border-gray-300 text-gray-500'
                }`}>
                  {isCompleted ? <CheckCircle className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                </div>
                <span className={`mr-2 text-sm font-medium ${
                  isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <ArrowLeft className="w-4 h-4 text-gray-400 mx-4" />
                )}
              </div>
            );
          })}
        </div>

        {/* Customer Selection Step */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right flex items-center gap-2">
              <Users className="w-5 h-5" />
              اختر العميل من القائمة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-right">
                ابحث عن العميل المطلوب واختره لإنشاء العقد.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <label className="text-sm font-medium text-right block">
                البحث عن العميل
                <span className="text-red-500 mr-1">*</span>
              </label>
              <CustomerSelector
                selectedCustomer={selectedCustomer}
                onCustomerSelect={handleExistingCustomerSelect}
                placeholder="البحث عن عميل بالاسم أو رقم الهاتف..."
                inputClassName="text-right"
              />
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setCurrentStep('customer-choice')}>
                السابق
              </Button>
              {selectedCustomer && (
                <Button onClick={() => setCurrentStep('agreement-creation')}>
                  التالي
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentStep === 'agreement-creation') {
    return (
      <div className="space-y-6" dir="rtl">
        {/* Step Indicator */}
        <div className="flex items-center justify-center space-x-4 space-x-reverse mb-8">
          {steps.map((step, index) => {
            let isActive = false;
            let isCompleted = false;
            
            if (step.id === 'customer-choice') {
              isActive = false;
              isCompleted = true; // customer-choice is completed when in agreement-creation
            } else if (step.id === 'agreement-creation') {
              isActive = true; // agreement-creation is active
              isCompleted = false;
            }
            
            const StepIcon = step.icon;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  isCompleted ? 'bg-green-500 border-green-500 text-white' :
                  isActive ? 'bg-blue-500 border-blue-500 text-white' :
                  'bg-gray-100 border-gray-300 text-gray-500'
                }`}>
                  {isCompleted ? <CheckCircle className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                </div>
                <span className={`mr-2 text-sm font-medium ${
                  isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <ArrowLeft className="w-4 h-4 text-gray-400 mx-4" />
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Customer Display */}
        {selectedCustomer && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-right">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">تم اختيار العميل: {selectedCustomer.full_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedCustomer.phone_number && <span>الهاتف: <span className="phone-number-ltr" dir="ltr">{selectedCustomer.phone_number}</span></span>}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setCurrentStep('customer-choice')}>
                  تغيير العميل
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Agreement Form with Preselected Customer */}
        <AgreementForm
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          hideBasicDetails={!!contractData} // إخفاء التفاصيل الأساسية عند وجود بيانات من مسح العقد
          initialData={selectedCustomer ? {
            customer_id: selectedCustomer.id,
            customers: selectedCustomer,
            // إضافة بيانات من PDF إذا كانت متوفرة - ملء تلقائي شامل
            ...(contractData && {
              // بيانات التاريخ والمبالغ
              start_date: contractData.start_date,
              rent_amount: contractData.monthly_rent,
              contract_duration_months: contractData.contract_duration_months || 12,
              
              // بيانات المركبة من PDF
              vehicle_make: contractData.vehicle_data?.make,
              vehicle_model: contractData.vehicle_data?.model,
              vehicle_year: contractData.vehicle_data?.year,
              vehicle_plate_number: contractData.vehicle_data?.plate_number,
              vehicle_color: contractData.vehicle_data?.color,
              vehicle_vin: contractData.vehicle_data?.vin,
              
              // الحقول الافتراضية المحسوبة تلقائياً
              payment_frequency: 'monthly', // دائماً شهري
              payment_day: 1, // دائماً اليوم الأول
              daily_late_fee: 120, // دائماً 120 ريال
              agreement_type: 'lease_to_own', // إيجار منتهي بالتملك
              status: 'active', // نشط
              
              // مبلغ الضمان - إدخال يدوي فقط (لا حساب تلقائي)
              deposit_amount: contractData.deposit_amount || 0,
              total_amount: contractData.monthly_rent && contractData.contract_duration_months 
                ? (contractData.monthly_rent * contractData.contract_duration_months) + (contractData.deposit_amount || 0)
                : 0,
              
              // تاريخ انتهاء العقد المحسوب
              end_date: contractData.start_date && contractData.contract_duration_months 
                ? new Date(new Date(contractData.start_date).setMonth(
                    new Date(contractData.start_date).getMonth() + contractData.contract_duration_months
                  )).toISOString().split('T')[0]
                : undefined,
              
              // ملاحظات مع رقم العقد الأصلي
              notes: contractData.original_contract_number 
                ? `رقم العقد الأصلي: ${contractData.original_contract_number}\nتم استخراج البيانات تلقائياً من العقد المرفوع`
                : 'تم استخراج البيانات تلقائياً من العقد المرفوع'
            })
          } as any : undefined}
        />
      </div>
    );
  }

  return null;
};

export default AgreementWithCustomerSteps; 