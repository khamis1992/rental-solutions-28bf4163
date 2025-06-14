import React, { useState, useEffect } from 'react';
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
import { User, Car, CreditCard, CheckCircle } from "lucide-react";
import { useCustomers } from '@/hooks/use-customers';
import { useVehicles } from '@/hooks/use-vehicles';

interface AgreementOnboardingWizardProps {
  open: boolean;
  onClose: () => void;
  onComplete: (formData: any) => void;
  preSelectedCustomerId?: string | null;
}

export function AgreementOnboardingWizard({
  open,
  onClose,
  onComplete,
  preSelectedCustomerId
}: AgreementOnboardingWizardProps) {
  // Initialize with preSelectedCustomerId if provided
  const [currentStep, setCurrentStep] = useState(preSelectedCustomerId ? 'selection' : 'basic');
  const [formData, setFormData] = useState(() => ({
    agreement_number: '',
    agreement_type: 'short_term',
    status: 'draft',
    customer_id: preSelectedCustomerId || '',
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
  }));
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: customers = [] } = useCustomers();
  const { data: vehicles = [] } = useVehicles();

  // Show success message when customer is pre-selected and customers are loaded
  useEffect(() => {
    if (preSelectedCustomerId && customers.length > 0) {
      const customer = customers.find(c => c.id === preSelectedCustomerId);
      if (customer) {
        toast.success(`تم تحديد العميل مسبقاً: ${customer.full_name}`);
      }
    }
  }, [preSelectedCustomerId, customers]);

  const steps = [
    { id: 'basic', label: 'المعلومات الأساسية', icon: User },
    { id: 'selection', label: 'اختيار العميل والمركبة', icon: Car },
    { id: 'payment', label: 'شروط الدفع', icon: CreditCard },
    { id: 'review', label: 'المراجعة والتأكيد', icon: CheckCircle }
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 'basic':
        if (!formData.agreement_type) {
          toast.error('نوع الاتفاقية مطلوب');
          return false;
        }
        if (!formData.start_date) {
          toast.error('تاريخ البداية مطلوب');
          return false;
        }
        if (!formData.end_date) {
          toast.error('تاريخ النهاية مطلوب');
          return false;
        }
        if (new Date(formData.end_date) <= new Date(formData.start_date)) {
          toast.error('تاريخ النهاية يجب أن يكون بعد تاريخ البداية');
          return false;
        }
        return true;
      case 'selection':
        if (!formData.customer_id) {
          toast.error('يجب اختيار العميل');
          return false;
        }
        if (!formData.vehicle_id) {
          toast.error('يجب اختيار المركبة');
          return false;
        }
        return true;
      case 'payment':
        if (!formData.rent_amount || formData.rent_amount <= 0) {
          toast.error('مبلغ الإيجار مطلوب ويجب أن يكون أكبر من صفر');
          return false;
        }
        if (!formData.payment_frequency) {
          toast.error('تكرار الدفع مطلوب');
          return false;
        }
        return true;
      case 'review':
        if (!formData.terms_accepted) {
          toast.error('يجب الموافقة على الشروط والأحكام');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleContinue = () => {
    if (!validateCurrentStep()) return;

    if (currentStep === 'basic') {
      setCurrentStep('selection');
    } else if (currentStep === 'selection') {
      setCurrentStep('payment');
    } else if (currentStep === 'payment') {
      setCurrentStep('review');
    }
  };

  const handleBack = () => {
    if (currentStep === 'review') {
      setCurrentStep('payment');
    } else if (currentStep === 'payment') {
      setCurrentStep('selection');
    } else if (currentStep === 'selection') {
      setCurrentStep('basic');
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    setIsProcessing(true);
    try {
      const submissionData = {
        ...formData,
        total_amount: Number(formData.total_amount),
        rent_amount: Number(formData.rent_amount),
        deposit_amount: Number(formData.deposit_amount),
        daily_late_fee: Number(formData.daily_late_fee),
        payment_day: Number(formData.payment_day)
      };
      
      onComplete(submissionData);
    } catch (error) {
      toast.error("فشل في معالجة بيانات الاتفاقية");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderBasicInfo = () => (
    <div className="space-y-4" dir="rtl">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="agreement_number" className="text-right">رقم الاتفاقية</Label>
          <Input 
            id="agreement_number" 
            name="agreement_number" 
            value={formData.agreement_number} 
            onChange={handleInputChange}
            placeholder="سيتم التوليد تلقائياً إذا ترك فارغاً"
            className="text-right"
            dir="rtl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="agreement_type" className="text-right">نوع الاتفاقية *</Label>
          <Select onValueChange={(value) => handleSelectChange('agreement_type', value)} value={formData.agreement_type} dir="rtl">
            <SelectTrigger className="text-right">
              <SelectValue placeholder="اختر نوع الاتفاقية" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="short_term">إيجار قصير المدى</SelectItem>
              <SelectItem value="lease_to_own">إيجار منتهي بالتمليك</SelectItem>
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
              value={formData.start_date} 
              onChange={handleInputChange}
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
              value={formData.end_date} 
              onChange={handleInputChange}
              className="text-right"
              dir="rtl"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderSelection = () => {
    const selectedCustomer = customers.find(c => c.id === formData.customer_id);
    
    return (
      <div className="space-y-4" dir="rtl">
        {preSelectedCustomerId && selectedCustomer && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <p className="text-sm text-green-800 text-right">
              ✓ تم تحديد العميل مسبقاً: <strong>{selectedCustomer.full_name}</strong>
            </p>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="customer_id" className="text-right">العميل *</Label>
          <Select 
            onValueChange={(value) => handleSelectChange('customer_id', value)} 
            value={formData.customer_id} 
            dir="rtl"
            disabled={!!preSelectedCustomerId}
          >
            <SelectTrigger className="text-right">
              <SelectValue placeholder="اختر العميل" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer: any) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="vehicle_id" className="text-right">المركبة *</Label>
          <Select onValueChange={(value) => handleSelectChange('vehicle_id', value)} value={formData.vehicle_id} dir="rtl">
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
      </div>
    );
  };

  const renderPayment = () => (
    <div className="space-y-4" dir="rtl">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="rent_amount" className="text-right">مبلغ الإيجار *</Label>
          <Input 
            id="rent_amount" 
            name="rent_amount" 
            type="number"
            value={formData.rent_amount} 
            onChange={handleInputChange}
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
            value={formData.deposit_amount} 
            onChange={handleInputChange}
            placeholder="0"
            className="text-right"
            dir="ltr"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="payment_frequency" className="text-right">تكرار الدفع *</Label>
          <Select onValueChange={(value) => handleSelectChange('payment_frequency', value)} value={formData.payment_frequency} dir="rtl">
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
            value={formData.payment_day} 
            onChange={handleInputChange}
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
          value={formData.daily_late_fee} 
          onChange={handleInputChange}
          placeholder="120"
          className="text-right"
          dir="ltr"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes" className="text-right">ملاحظات</Label>
        <Textarea 
          id="notes" 
          name="notes" 
          value={formData.notes} 
          onChange={handleInputChange}
          placeholder="ملاحظات إضافية عن الاتفاقية"
          className="text-right"
          dir="rtl"
        />
      </div>
    </div>
  );

  const renderReview = () => {
    const selectedCustomer = customers.find((c: any) => c.id === formData.customer_id);
    const selectedVehicle = vehicles.find((v: any) => v.id === formData.vehicle_id);
    
    return (
      <div className="space-y-4" dir="rtl">
        <div className="bg-slate-50 p-4 rounded-md">
          <h3 className="text-sm font-medium mb-3 text-right">ملخص الاتفاقية</h3>
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-slate-500 text-right">نوع الاتفاقية:</span>
              <span className="text-right">{formData.agreement_type === 'short_term' ? 'إيجار قصير المدى' : 'إيجار منتهي بالتمليك'}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <span className="text-slate-500 text-right">العميل:</span>
              <span className="text-right">{selectedCustomer?.full_name || 'غير محدد'}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <span className="text-slate-500 text-right">المركبة:</span>
              <span className="text-right">{selectedVehicle ? `${selectedVehicle.make} ${selectedVehicle.model}` : 'غير محدد'}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <span className="text-slate-500 text-right">تاريخ البداية:</span>
              <span className="text-right">{formData.start_date}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <span className="text-slate-500 text-right">تاريخ النهاية:</span>
              <span className="text-right">{formData.end_date}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <span className="text-slate-500 text-right">مبلغ الإيجار:</span>
              <span className="text-right">{formData.rent_amount} ريال</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <span className="text-slate-500 text-right">تكرار الدفع:</span>
              <span className="text-right">
                {formData.payment_frequency === 'weekly' ? 'أسبوعي' : 
                 formData.payment_frequency === 'monthly' ? 'شهري' : 'ربع سنوي'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="border rounded-md p-4">
          <div className="flex items-top space-x-2 flex-row-reverse">
            <Checkbox 
              id="terms_accepted" 
              checked={formData.terms_accepted}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, terms_accepted: checked as boolean }))}
            />
            <Label htmlFor="terms_accepted" className="text-sm font-medium text-right">
              أوافق على الشروط والأحكام الخاصة بالاتفاقية
            </Label>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl md:max-w-4xl lg:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right" dir="rtl">إنشاء اتفاقية جديدة</DialogTitle>
          <DialogDescription className="text-right" dir="rtl">
            إنشاء اتفاقية إيجار جديدة خطوة بخطوة
          </DialogDescription>
        </DialogHeader>
        
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">
              الخطوة {currentStepIndex + 1} من {steps.length}
            </span>
            <span className="text-sm font-medium">
              {steps[currentStepIndex].label}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>
        
        <Tabs value={currentStep} className="w-full">
          <TabsList className="flex w-full flex-row-reverse" dir="rtl" style={{ direction: 'rtl' }}>
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              return (
                <TabsTrigger 
                  key={step.id} 
                  value={step.id} 
                  disabled
                  className={`flex-1 flex items-center gap-2 flex-row-reverse ${index <= currentStepIndex ? 'opacity-100' : 'opacity-50'}`}
                  dir="rtl"
                  style={{ direction: 'rtl' }}
                >
                  <span className="hidden sm:inline">{step.label}</span>
                  <StepIcon className="h-4 w-4" />
                </TabsTrigger>
              );
            })}
          </TabsList>
          
          <TabsContent value="basic" className="pt-4">
            {renderBasicInfo()}
          </TabsContent>
          
          <TabsContent value="selection" className="pt-4">
            {renderSelection()}
          </TabsContent>
          
          <TabsContent value="payment" className="pt-4">
            {renderPayment()}
          </TabsContent>
          
          <TabsContent value="review" className="pt-4">
            {renderReview()}
          </TabsContent>
        </Tabs>
        
        <Separator />
        
        <DialogFooter className="gap-2 sm:gap-0" dir="rtl">
          {currentStep !== 'basic' && (
            <Button variant="outline" onClick={handleBack} disabled={isProcessing}>
              السابق
            </Button>
          )}
          
          {currentStep !== 'review' ? (
            <Button onClick={handleContinue}>
              التالي
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={!formData.terms_accepted || isProcessing}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isProcessing ? 'جاري المعالجة...' : 'إنشاء الاتفاقية'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
} 