import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { User, FileText, Car, CreditCard, CheckCircle } from "lucide-react";
import { useVehicles } from '@/hooks/use-vehicles';

interface CustomerAgreementWizardProps {
  open: boolean;
  onClose: () => void;
  onComplete: (customerData: any, agreementData?: any) => void;
}

export function CustomerAgreementWizard({
  open,
  onClose,
  onComplete
}: CustomerAgreementWizardProps) {
  const [currentStep, setCurrentStep] = useState('customer-basic');
  const [customerData, setCustomerData] = useState({
    full_name: '',
    email: '',
    phone: '',
    nationality: '',
    driver_license: '',
    address: '',
    notes: '',
    status: 'active',
    documents_verified: false,
    terms_accepted: false,
    create_agreement: false
  });
  
  const [agreementData, setAgreementData] = useState({
    agreement_number: '',
    agreement_type: 'short_term',
    status: 'draft',
    vehicle_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    total_amount: 0,
    rent_amount: 0,
    deposit_amount: 0,
    daily_late_fee: 120,
    payment_frequency: 'monthly',
    payment_day: 1,
    notes: '',
    terms_accepted: false
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const { data: vehicles = [] } = useVehicles();

  const steps = [
    { id: 'customer-basic', label: 'معلومات العميل الأساسية', icon: User },
    { id: 'customer-documents', label: 'وثائق العميل', icon: FileText },
    { id: 'customer-review', label: 'مراجعة بيانات العميل', icon: CheckCircle },
    { id: 'agreement-basic', label: 'معلومات الاتفاقية', icon: Car, conditional: true },
    { id: 'agreement-payment', label: 'شروط الدفع', icon: CreditCard, conditional: true },
    { id: 'final-review', label: 'المراجعة النهائية', icon: CheckCircle, conditional: true }
  ];

  const getVisibleSteps = () => {
    if (customerData.create_agreement) {
      return steps;
    }
    return steps.filter(step => !step.conditional);
  };

  const visibleSteps = getVisibleSteps();
  const currentStepIndex = visibleSteps.findIndex(step => step.id === currentStep);

  const handleCustomerInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCustomerData({
      ...customerData,
      [e.target.name]: e.target.value
    });
  };

  const handleCustomerSelectChange = (name: string, value: string) => {
    setCustomerData({
      ...customerData,
      [name]: value
    });
  };

  const handleAgreementInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setAgreementData({
      ...agreementData,
      [e.target.name]: e.target.value
    });
  };

  const handleAgreementSelectChange = (name: string, value: string) => {
    setAgreementData({
      ...agreementData,
      [name]: value
    });
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 'customer-basic':
        if (!customerData.full_name.trim()) {
          toast.error('الاسم الكامل مطلوب');
          return false;
        }
        if (!customerData.email.trim()) {
          toast.error('البريد الإلكتروني مطلوب');
          return false;
        }
        if (!customerData.phone.trim()) {
          toast.error('رقم الجوال مطلوب');
          return false;
        }
        if (!/^[3-9]\d{7}$/.test(customerData.phone)) {
          toast.error('يرجى إدخال رقم جوال صحيح (8 أرقام)');
          return false;
        }
        if (!customerData.email.includes('@')) {
          toast.error('يرجى إدخال بريد إلكتروني صحيح');
          return false;
        }
        return true;
      case 'customer-documents':
        if (!customerData.driver_license.trim()) {
          toast.error('رقم رخصة القيادة مطلوب');
          return false;
        }
        if (!customerData.nationality.trim()) {
          toast.error('الجنسية مطلوبة');
          return false;
        }
        return true;
      case 'customer-review':
        if (!customerData.documents_verified) {
          toast.error('يجب التحقق من الوثائق قبل المتابعة');
          return false;
        }
        if (!customerData.terms_accepted) {
          toast.error('يجب الموافقة على الشروط والأحكام');
          return false;
        }
        return true;
      case 'agreement-basic':
        if (!agreementData.agreement_type) {
          toast.error('نوع الاتفاقية مطلوب');
          return false;
        }
        if (!agreementData.vehicle_id) {
          toast.error('يجب اختيار المركبة');
          return false;
        }
        if (!agreementData.start_date) {
          toast.error('تاريخ البداية مطلوب');
          return false;
        }
        if (!agreementData.end_date) {
          toast.error('تاريخ النهاية مطلوب');
          return false;
        }
        if (new Date(agreementData.end_date) <= new Date(agreementData.start_date)) {
          toast.error('تاريخ النهاية يجب أن يكون بعد تاريخ البداية');
          return false;
        }
        return true;
      case 'agreement-payment':
        if (!agreementData.rent_amount || agreementData.rent_amount <= 0) {
          toast.error('مبلغ الإيجار مطلوب ويجب أن يكون أكبر من صفر');
          return false;
        }
        if (!agreementData.payment_frequency) {
          toast.error('تكرار الدفع مطلوب');
          return false;
        }
        return true;
      case 'final-review':
        if (!agreementData.terms_accepted) {
          toast.error('يجب الموافقة على شروط الاتفاقية');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleContinue = () => {
    if (!validateCurrentStep()) return;

    const currentIndex = currentStepIndex;
    const nextStep = visibleSteps[currentIndex + 1];
    
    if (nextStep) {
      setCurrentStep(nextStep.id);
    }
  };

  const handleBack = () => {
    const currentIndex = currentStepIndex;
    const prevStep = visibleSteps[currentIndex - 1];
    
    if (prevStep) {
      setCurrentStep(prevStep.id);
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    setIsProcessing(true);
    try {
      const customerSubmissionData = {
        ...customerData,
        phone: customerData.phone.replace(/^\+974/, '').trim()
      };
      
      let agreementSubmissionData = null;
      if (customerData.create_agreement) {
        agreementSubmissionData = {
          ...agreementData,
          total_amount: Number(agreementData.total_amount),
          rent_amount: Number(agreementData.rent_amount),
          deposit_amount: Number(agreementData.deposit_amount),
          daily_late_fee: Number(agreementData.daily_late_fee),
          payment_day: Number(agreementData.payment_day)
        };
      }
      
      onComplete(customerSubmissionData, agreementSubmissionData);
    } catch (error) {
      toast.error("فشل في معالجة البيانات");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderCustomerBasicInfo = () => (
    <div className="space-y-4" dir="rtl">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="full_name" className="text-right">الاسم الكامل *</Label>
          <Input 
            id="full_name" 
            name="full_name" 
            value={customerData.full_name} 
            onChange={handleCustomerInputChange}
            placeholder="أدخل الاسم الكامل"
            className="text-right"
            dir="rtl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-right">البريد الإلكتروني *</Label>
          <Input 
            id="email" 
            name="email" 
            type="email"
            value={customerData.email} 
            onChange={handleCustomerInputChange}
            placeholder="example@email.com"
            className="text-right"
            dir="ltr"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-right">رقم الجوال *</Label>
          <Input 
            id="phone" 
            name="phone" 
            value={customerData.phone} 
            onChange={handleCustomerInputChange}
            placeholder="33123456"
            className="text-right"
            dir="ltr"
          />
          <p className="text-xs text-muted-foreground text-right">
            أدخل 8 أرقام فقط. سيتم إضافة رمز الدولة +974 تلقائياً.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="nationality" className="text-right">الجنسية *</Label>
          <Input 
            id="nationality" 
            name="nationality" 
            value={customerData.nationality} 
            onChange={handleCustomerInputChange}
            placeholder="أدخل الجنسية"
            className="text-right"
            dir="rtl"
          />
        </div>
      </div>
    </div>
  );

  const renderCustomerDocuments = () => (
    <div className="space-y-4" dir="rtl">
      <div className="space-y-2">
        <Label htmlFor="driver_license" className="text-right">رقم رخصة القيادة *</Label>
        <Input 
          id="driver_license" 
          name="driver_license" 
          value={customerData.driver_license} 
          onChange={handleCustomerInputChange}
          placeholder="أدخل رقم رخصة القيادة"
          className="text-right"
          dir="ltr"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address" className="text-right">العنوان</Label>
        <Textarea 
          id="address" 
          name="address" 
          value={customerData.address} 
          onChange={handleCustomerInputChange}
          placeholder="أدخل عنوان العميل"
          className="text-right"
          dir="rtl"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="status" className="text-right">حالة العميل</Label>
        <Select onValueChange={(value) => handleCustomerSelectChange('status', value)} value={customerData.status} dir="rtl">
          <SelectTrigger className="text-right">
            <SelectValue placeholder="اختر حالة العميل" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">نشط</SelectItem>
            <SelectItem value="inactive">غير نشط</SelectItem>
            <SelectItem value="pending_review">قيد المراجعة</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes" className="text-right">ملاحظات</Label>
        <Textarea 
          id="notes" 
          name="notes" 
          value={customerData.notes} 
          onChange={handleCustomerInputChange}
          placeholder="ملاحظات إضافية عن العميل"
          className="text-right"
          dir="rtl"
        />
      </div>
    </div>
  );

  const renderCustomerReview = () => (
    <div className="space-y-4" dir="rtl">
      <div className="bg-slate-50 p-4 rounded-md">
        <h3 className="text-sm font-medium mb-3 text-right">ملخص بيانات العميل</h3>
        <div className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <span className="text-slate-500 text-right">الاسم الكامل:</span>
            <span className="text-right">{customerData.full_name}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-slate-500 text-right">البريد الإلكتروني:</span>
            <span className="text-right">{customerData.email}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-slate-500 text-right">رقم الجوال:</span>
            <span className="text-right">+974{customerData.phone}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-slate-500 text-right">الجنسية:</span>
            <span className="text-right">{customerData.nationality}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-slate-500 text-right">رخصة القيادة:</span>
            <span className="text-right">{customerData.driver_license}</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="border rounded-md p-4">
          <div className="flex items-top space-x-2 flex-row-reverse">
            <Checkbox 
              id="documents_verified" 
              checked={customerData.documents_verified}
              onCheckedChange={(checked) => setCustomerData(prev => ({ ...prev, documents_verified: checked as boolean }))}
            />
            <Label htmlFor="documents_verified" className="text-sm font-medium text-right">
              أؤكد أن جميع الوثائق والمعلومات قد تم التحقق منها
            </Label>
          </div>
        </div>
        
        <div className="border rounded-md p-4">
          <div className="flex items-top space-x-2 flex-row-reverse">
            <Checkbox 
              id="terms_accepted" 
              checked={customerData.terms_accepted}
              onCheckedChange={(checked) => setCustomerData(prev => ({ ...prev, terms_accepted: checked as boolean }))}
            />
            <Label htmlFor="terms_accepted" className="text-sm font-medium text-right">
              أوافق على الشروط والأحكام الخاصة بإضافة العميل
            </Label>
          </div>
        </div>

        <div className="border rounded-md p-4 bg-blue-50">
          <div className="flex items-top space-x-2 flex-row-reverse">
            <Checkbox 
              id="create_agreement" 
              checked={customerData.create_agreement}
              onCheckedChange={(checked) => {
                setCustomerData(prev => ({ ...prev, create_agreement: checked as boolean }));
                if (!checked && (currentStep.startsWith('agreement-') || currentStep === 'final-review')) {
                  setCurrentStep('customer-review');
                }
              }}
            />
            <Label htmlFor="create_agreement" className="text-sm font-medium text-right">
              إنشاء اتفاقية إيجار للعميل مباشرة
            </Label>
          </div>
          <p className="text-xs text-muted-foreground text-right mt-2">
            يمكنك إنشاء اتفاقية إيجار للعميل في نفس العملية
          </p>
        </div>
      </div>
    </div>
  );

  const renderAgreementBasic = () => (
    <div className="space-y-4" dir="rtl">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="agreement_type" className="text-right">نوع الاتفاقية *</Label>
          <Select onValueChange={(value) => handleAgreementSelectChange('agreement_type', value)} value={agreementData.agreement_type} dir="rtl">
            <SelectTrigger className="text-right">
              <SelectValue placeholder="اختر نوع الاتفاقية" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="short_term">إيجار قصير المدى</SelectItem>
              <SelectItem value="lease_to_own">إيجار منتهي بالتمليك</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="vehicle_id" className="text-right">المركبة *</Label>
          <Select onValueChange={(value) => handleAgreementSelectChange('vehicle_id', value)} value={agreementData.vehicle_id} dir="rtl">
            <SelectTrigger className="text-right">
              <SelectValue placeholder="اختر المركبة" />
            </SelectTrigger>
            <SelectContent>
              {vehicles.filter((vehicle: any) => vehicle.status === 'available').map((vehicle: any) => (
                <SelectItem key={vehicle.id} value={vehicle.id}>
                  {vehicle.make} {vehicle.model} - {vehicle.license_plate}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start_date" className="text-right">تاريخ البداية *</Label>
            <Input 
              id="start_date" 
              name="start_date" 
              type="date"
              value={agreementData.start_date} 
              onChange={handleAgreementInputChange}
              className="text-right"
              dir="rtl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end_date" className="text-right">تاريخ النهاية *</Label>
            <Input 
              id="end_date" 
              name="end_date" 
              type="date"
              value={agreementData.end_date} 
              onChange={handleAgreementInputChange}
              className="text-right"
              dir="rtl"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderAgreementPayment = () => (
    <div className="space-y-4" dir="rtl">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="rent_amount" className="text-right">مبلغ الإيجار *</Label>
          <Input 
            id="rent_amount" 
            name="rent_amount" 
            type="number"
            value={agreementData.rent_amount} 
            onChange={handleAgreementInputChange}
            placeholder="0"
            className="text-right"
            dir="ltr"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="deposit_amount" className="text-right">مبلغ الضمان</Label>
          <Input 
            id="deposit_amount" 
            name="deposit_amount" 
            type="number"
            value={agreementData.deposit_amount} 
            onChange={handleAgreementInputChange}
            placeholder="0"
            className="text-right"
            dir="ltr"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="payment_frequency" className="text-right">تكرار الدفع *</Label>
          <Select onValueChange={(value) => handleAgreementSelectChange('payment_frequency', value)} value={agreementData.payment_frequency} dir="rtl">
            <SelectTrigger className="text-right">
              <SelectValue placeholder="اختر تكرار الدفع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">أسبوعي</SelectItem>
              <SelectItem value="monthly">شهري</SelectItem>
              <SelectItem value="quarterly">ربع سنوي</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="payment_day" className="text-right">يوم الدفع</Label>
          <Input 
            id="payment_day" 
            name="payment_day" 
            type="number"
            min="1"
            max="31"
            value={agreementData.payment_day} 
            onChange={handleAgreementInputChange}
            className="text-right"
            dir="ltr"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="daily_late_fee" className="text-right">رسوم التأخير اليومية</Label>
        <Input 
          id="daily_late_fee" 
          name="daily_late_fee" 
          type="number"
          value={agreementData.daily_late_fee} 
          onChange={handleAgreementInputChange}
          placeholder="120"
          className="text-right"
          dir="ltr"
        />
      </div>
    </div>
  );

  const renderFinalReview = () => {
    const selectedVehicle = vehicles.find((v: any) => v.id === agreementData.vehicle_id);
    
    return (
      <div className="space-y-4" dir="rtl">
        <div className="bg-slate-50 p-4 rounded-md">
          <h3 className="text-sm font-medium mb-3 text-right">ملخص العميل والاتفاقية</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-right mb-2">بيانات العميل:</h4>
              <div className="space-y-1 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-slate-500 text-right">الاسم:</span>
                  <span className="text-right">{customerData.full_name}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-slate-500 text-right">الجوال:</span>
                  <span className="text-right">+974{customerData.phone}</span>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="text-sm font-medium text-right mb-2">بيانات الاتفاقية:</h4>
              <div className="space-y-1 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-slate-500 text-right">المركبة:</span>
                  <span className="text-right">{selectedVehicle ? `${selectedVehicle.make} ${selectedVehicle.model}` : 'غير محدد'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-slate-500 text-right">مبلغ الإيجار:</span>
                  <span className="text-right">{agreementData.rent_amount} ريال</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-slate-500 text-right">المدة:</span>
                  <span className="text-right">{agreementData.start_date} إلى {agreementData.end_date}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border rounded-md p-4">
          <div className="flex items-top space-x-2 flex-row-reverse">
            <Checkbox 
              id="agreement_terms_accepted" 
              checked={agreementData.terms_accepted}
              onCheckedChange={(checked) => setAgreementData(prev => ({ ...prev, terms_accepted: checked as boolean }))}
            />
            <Label htmlFor="agreement_terms_accepted" className="text-sm font-medium text-right">
              أوافق على جميع الشروط والأحكام للعميل والاتفاقية
            </Label>
          </div>
        </div>
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'customer-basic':
        return renderCustomerBasicInfo();
      case 'customer-documents':
        return renderCustomerDocuments();
      case 'customer-review':
        return renderCustomerReview();
      case 'agreement-basic':
        return renderAgreementBasic();
      case 'agreement-payment':
        return renderAgreementPayment();
      case 'final-review':
        return renderFinalReview();
      default:
        return <div className="text-center p-8">خطوة غير معروفة</div>;
    }
  };

  const isLastStep = currentStepIndex === visibleSteps.length - 1;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-right" dir="rtl">
            {customerData.create_agreement ? 'إضافة عميل واتفاقية جديدة' : 'إضافة عميل جديد'}
          </DialogTitle>
          <DialogDescription className="text-right" dir="rtl">
            {customerData.create_agreement 
              ? 'إضافة عميل جديد مع إنشاء اتفاقية إيجار في نفس العملية'
              : 'إضافة عميل جديد إلى النظام خطوة بخطوة'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">
              الخطوة {currentStepIndex + 1} من {visibleSteps.length}
            </span>
            <span className="text-sm font-medium">
              {visibleSteps[currentStepIndex]?.label}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${((currentStepIndex + 1) / visibleSteps.length) * 100}%` }}
            ></div>
          </div>
        </div>
        
        <div className="min-h-[300px]">
          {renderCurrentStep()}
        </div>
        
        <Separator />
        
        <DialogFooter className="gap-2 sm:gap-0" dir="rtl">
          {currentStepIndex > 0 && (
            <Button variant="outline" onClick={handleBack} disabled={isProcessing}>
              السابق
            </Button>
          )}
          
          {!isLastStep ? (
            <Button onClick={handleContinue}>
              التالي
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isProcessing ? 'جاري المعالجة...' : 
               customerData.create_agreement ? 'إنشاء العميل والاتفاقية' : 'إنشاء العميل'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 