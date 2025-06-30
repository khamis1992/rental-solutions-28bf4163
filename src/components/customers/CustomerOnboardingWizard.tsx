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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { User, FileText, CheckCircle, Scan, Wand2, CheckCircle2 } from "lucide-react";
import { IdCardScanner } from './IdCardScanner';
import { QatariIdCardData } from '@/services/google-vision-ocr';

interface CustomerOnboardingWizardProps {
  open: boolean;
  onClose: () => void;
  onComplete: (formData: any) => void;
}

export function CustomerOnboardingWizard({
  open,
  onClose,
  onComplete
}: CustomerOnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState('basic');
  const [showScanner, setShowScanner] = useState(false);
  const [scanCompleted, setScanCompleted] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    nationality: '',
    driver_license: '',
    address: 'الدوحة - قطر', // العنوان الافتراضي
    notes: '',
    status: 'active',
    documents_verified: false,
    terms_accepted: false,
    id_card_image: '' // حفظ صورة البطاقة الشخصية
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const steps = [
    { id: 'basic', label: 'المعلومات الأساسية', icon: User },
    { id: 'documents', label: 'الوثائق والتحقق', icon: FileText },
    { id: 'review', label: 'المراجعة والتأكيد', icon: CheckCircle }
  ];

  // Visual display order for tabs (left to right in RTL: basic, documents, review)
  const displayOrder = ['basic', 'documents', 'review'];

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

  // Handle ID card scan completion
  const handleScanComplete = (data: QatariIdCardData) => {
    console.log('🎯 ID Card scan completed:', data);
    
    // Auto-populate form fields from scanned data (prefer Arabic names)
    setFormData(prev => ({
      ...prev,
      full_name: data.arabicName || data.fullName || prev.full_name,
      nationality: data.nationality || prev.nationality,
              driver_license: data.idNumber || prev.driver_license, // In Qatar, ID number is the same as driver license
      // Add a note about the scan with Arabic data priority
      notes: prev.notes + (prev.notes ? '\n' : '') + 
        `تم استخراج البيانات من البطاقة الشخصية - رقم الهوية: ${data.idNumber || 'غير محدد'}` +
        (data.arabicName ? `\nالاسم العربي: ${data.arabicName}` : '') +
        (data.englishName ? `\nالاسم الإنجليزي: ${data.englishName}` : ''),
      // Save the ID card image
      id_card_image: data.cardImageBase64 || ''
    }));
    
    setScanCompleted(true);
    setShowScanner(false);
    
    toast.success('تم استخراج البيانات من البطاقة بنجاح! تم حفظ صورة البطاقة أيضاً', {
      description: 'يرجى مراجعة المعلومات المدخلة قبل الحفظ'
    });
  };

  // Handle scan error
  const handleScanError = (error: string) => {
    console.error('❌ ID Card scan error:', error);
    toast.error(`فشل في مسح البطاقة: ${error}`);
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 'basic':
        if (!formData.full_name.trim()) {
          toast.error('الاسم الكامل مطلوب');
          return false;
        }
        if (!formData.phone.trim()) {
          toast.error('رقم الجوال مطلوب');
          return false;
        }
        if (!/^[3-9]\d{7}$/.test(formData.phone)) {
          toast.error('يرجى إدخال رقم جوال صحيح (8 أرقام)');
          return false;
        }
        // البريد الإلكتروني اختياري - فقط تحقق من الصيغة إذا تم إدخاله
        if (formData.email.trim() && !formData.email.includes('@')) {
          toast.error('يرجى إدخال بريد إلكتروني صحيح أو اتركه فارغاً');
          return false;
        }
        return true;
      case 'documents':
        if (!formData.driver_license.trim()) {
          toast.error('رقم رخصة القيادة مطلوب');
          return false;
        }
        if (!formData.nationality.trim()) {
          toast.error('الجنسية مطلوبة');
          return false;
        }
        return true;
      case 'review':
        if (!formData.documents_verified) {
          toast.error('يجب التحقق من الوثائق قبل المتابعة');
          return false;
        }
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
      setCurrentStep('documents');
    } else if (currentStep === 'documents') {
      setCurrentStep('review');
    }
  };

  const handleBack = () => {
    if (currentStep === 'review') {
      setCurrentStep('documents');
    } else if (currentStep === 'documents') {
      setCurrentStep('basic');
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    // منع السلوك الافتراضي للمتصفح
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!validateCurrentStep()) return;

    setIsProcessing(true);
    try {
      // Format phone number for Qatar
      const submissionData = {
        ...formData,
        phone: formData.phone.replace(/^\+974/, '').trim()
      };
      
      // عدم إعادة تعيين النموذج هنا لتجنب فقدان البيانات
      const result = await onComplete(submissionData);
      
      // عرض رسالة النجاح
      toast.success("تم إضافة العميل بنجاح", {
        description: "العميل الجديد جاهز لإنشاء العقد",
        duration: 3000
      });
      
    } catch (error) {
      toast.error("فشل في معالجة بيانات العميل");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      nationality: '',
      driver_license: '',
      address: 'الدوحة - قطر', // العنوان الافتراضي
      notes: '',
      status: 'active',
      documents_verified: false,
      terms_accepted: false,
      id_card_image: ''
    });
    
    // Reset scanning state
    setShowScanner(false);
    setScanCompleted(false);
    
    onClose();
  };

  const renderBasicInfo = () => (
    <div className="space-y-4" dir="rtl">
      {/* ID Card Scanner Section */}
      <Card className={`border-2 ${scanCompleted ? 'border-green-300 bg-green-50' : 'border-blue-300 bg-gradient-to-br from-blue-50 to-green-50'} transition-all duration-300`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between flex-row-reverse">
            <div className="flex items-center gap-2 flex-row-reverse">
              {scanCompleted ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <Scan className="h-5 w-5 text-blue-600" />
              )}
              <span className="text-lg">
                {scanCompleted ? 
                  'تم مسح البطاقة بنجاح' :
                  'مسح البطاقة الشخصية'
                }
              </span>
            </div>
            
            {scanCompleted && (
              <Badge variant="outline" className="border-green-500 text-green-700 bg-green-100">
                <Wand2 className="h-3 w-3 mr-1" />
                تم التعبئة التلقائية
              </Badge>
            )}
          </CardTitle>
          
          <CardDescription className="text-right">
            {scanCompleted ? (
              'تم استخراج البيانات من البطاقة الشخصية وتعبئة النموذج تلقائياً. يرجى مراجعة البيانات قبل الحفظ.'
            ) : (
              'امسح البطاقة الشخصية القطرية لملء البيانات تلقائياً وتوفير 90% من الوقت'
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {!scanCompleted && !showScanner && (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-4 flex-row-reverse">
                <Button
                  onClick={() => setShowScanner(true)}
                  className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-6 py-3 text-lg"
                >
                  <Scan className="h-5 w-5 mr-2" />
                  ابدأ المسح الآن
                </Button>
              </div>
              
              <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground flex-row-reverse">
                <div className="flex items-center gap-2 flex-row-reverse">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  توفير 90% من الوقت
                </div>
                <div className="flex items-center gap-2 flex-row-reverse">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  دقة 95%
                </div>
                <div className="flex items-center gap-2 flex-row-reverse">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  تعبئة تلقائية
                </div>
              </div>
            </div>
          )}
          
          {scanCompleted && (
            <div className="text-center space-y-3">
              <div className="text-green-700 font-medium">
                ✅ تم استخراج البيانات بنجاح وتعبئة النموذج تلقائياً
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setScanCompleted(false);
                  setShowScanner(true);
                }}
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <Scan className="h-4 w-4 mr-2" />
                مسح بطاقة أخرى
              </Button>
            </div>
          )}
          
          {showScanner && !scanCompleted && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-row-reverse">
                <h4 className="font-medium">
                  مسح البطاقة الشخصية القطرية
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowScanner(false)}
                >
                  إلغاء
                </Button>
              </div>
              
              <IdCardScanner
                onScanComplete={handleScanComplete}
                onScanError={handleScanError}
                mockMode={false}
                className="border-0 p-0"
              />
            </div>
          )}
        </CardContent>
      </Card>
      
      {!showScanner && (
        <Separator className="my-6" />
      )}

      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="full_name" className="text-right">الاسم الكامل *</Label>
          <Input 
            id="full_name" 
            name="full_name" 
            value={formData.full_name} 
            onChange={handleInputChange}
            placeholder="أدخل الاسم الكامل"
            className="text-right"
            dir="rtl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-right">البريد الإلكتروني (اختياري)</Label>
          <Input 
            id="email" 
            name="email" 
            type="email"
            value={formData.email} 
            onChange={handleInputChange}
            placeholder="example@email.com (اختياري)"
            className="text-right"
            dir="ltr"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-right">رقم الجوال *</Label>
          <Input 
            id="phone" 
            name="phone" 
            value={formData.phone} 
            onChange={handleInputChange}
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
            value={formData.nationality} 
            onChange={handleInputChange}
            placeholder="أدخل الجنسية"
            className="text-right"
            dir="rtl"
          />
        </div>
      </div>
    </div>
  );

  const renderDocuments = () => (
    <div className="space-y-4" dir="rtl">
      <div className="space-y-2">
        <Label htmlFor="driver_license" className="text-right">رقم رخصة القيادة *</Label>
        <Input 
          id="driver_license" 
          name="driver_license" 
          value={formData.driver_license} 
          onChange={handleInputChange}
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
          value={formData.address} 
          onChange={handleInputChange}
          placeholder="أدخل عنوان العميل"
          className="text-right"
          dir="rtl"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="status" className="text-right">حالة العميل</Label>
        <Select onValueChange={(value) => handleSelectChange('status', value)} value={formData.status} dir="rtl">
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
          value={formData.notes} 
          onChange={handleInputChange}
          placeholder="ملاحظات إضافية عن العميل"
          className="text-right"
          dir="rtl"
        />
      </div>
    </div>
  );

  const renderReview = () => (
    <div className="space-y-4" dir="rtl">
      <div className="bg-slate-50 p-4 rounded-md">
        <h3 className="text-sm font-medium mb-3 text-right">ملخص بيانات العميل</h3>
        <div className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <span className="text-slate-500 text-right">الاسم الكامل:</span>
            <span className="text-right">{formData.full_name}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-slate-500 text-right">البريد الإلكتروني:</span>
            <span className="text-right">{formData.email}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-slate-500 text-right">رقم الجوال:</span>
            <span className="text-left" dir="ltr">+974{formData.phone}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-slate-500 text-right">الجنسية:</span>
            <span className="text-right">{formData.nationality}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-slate-500 text-right">رخصة القيادة:</span>
            <span className="text-right">{formData.driver_license}</span>
          </div>
          {formData.address && (
            <div className="grid grid-cols-2 gap-2">
              <span className="text-slate-500 text-right">العنوان:</span>
              <span className="text-right">{formData.address}</span>
            </div>
          )}
                      <div className="grid grid-cols-2 gap-2">
              <span className="text-slate-500 text-right">الحالة:</span>
              <span className="text-right">
                {formData.status === 'active' ? 'نشط' : 
                 formData.status === 'inactive' ? 'غير نشط' : 'قيد المراجعة'}
              </span>
            </div>
            {formData.id_card_image && (
              <div className="grid grid-cols-2 gap-2">
                <span className="text-slate-500 text-right">البطاقة الشخصية:</span>
                <span className="text-right text-green-600 font-medium">تم حفظ الصورة ✓</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Display saved ID card image if available */}
        {formData.id_card_image && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2 text-right">صورة البطاقة الشخصية المحفوظة:</h4>
            <div className="border rounded-lg p-2 bg-gray-50">
              <img 
                src={formData.id_card_image} 
                alt="البطاقة الشخصية"
                className="max-w-full h-32 object-contain mx-auto rounded"
              />
              <p className="text-xs text-muted-foreground text-center mt-1">
                تم حفظ صورة البطاقة الشخصية بنجاح وستكون مرتبطة بملف العميل
              </p>
            </div>
          </div>
        )}
      
      <div className="space-y-3">
        <div className="border rounded-md p-4">
          <div className="flex items-top space-x-2 flex-row-reverse">
            <Checkbox 
              id="documents_verified" 
              checked={formData.documents_verified}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, documents_verified: checked as boolean }))}
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
              checked={formData.terms_accepted}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, terms_accepted: checked as boolean }))}
            />
            <Label htmlFor="terms_accepted" className="text-sm font-medium text-right">
              أوافق على الشروط والأحكام الخاصة بإضافة العميل
            </Label>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md md:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right" dir="rtl">إضافة عميل جديد</DialogTitle>
          <DialogDescription className="text-right" dir="rtl">
            إضافة عميل جديد إلى النظام خطوة بخطوة مع إمكانية مسح البطاقة الشخصية
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
            {[...displayOrder].reverse().map((stepId) => {
              const step = steps.find(s => s.id === stepId)!;
              const index = steps.findIndex(s => s.id === stepId);
              const StepIcon = step.icon;
              return (
                <TabsTrigger 
                  key={step.id} 
                  value={step.id} 
                  disabled
                  className={`flex-1 flex items-center gap-2 justify-center ${index <= currentStepIndex ? 'opacity-100' : 'opacity-50'}`}
                  dir="rtl"
                  style={{ direction: 'rtl' }}
                >
                  <StepIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">{step.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
          
          <TabsContent value="basic" className="pt-4">
            {renderBasicInfo()}
          </TabsContent>
          
          <TabsContent value="documents" className="pt-4">
            {renderDocuments()}
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
              type="button"
              onClick={handleSubmit} 
              disabled={!formData.documents_verified || !formData.terms_accepted || isProcessing}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isProcessing ? 'جاري المعالجة...' : 'إكمال إضافة العميل'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 