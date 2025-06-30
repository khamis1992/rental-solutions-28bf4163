import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
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
import { useCustomers } from '@/hooks/use-customers';
import { Customer } from '@/lib/validation-schemas/customer';
import { useLanguage } from '@/contexts/LanguageContext';
import { User, Plus, Scan, Wand2, CheckCircle2 } from "lucide-react";
import { IdCardScanner } from './IdCardScanner';
import { QatariIdCardData } from '@/services/google-vision-ocr';

interface AddCustomerDialogProps {
  open: boolean;
  onClose: () => void;
  onCustomerCreated: (customer: Customer) => void;
}

export function AddCustomerDialog({
  open,
  onClose,
  onCustomerCreated
}: AddCustomerDialogProps) {
  const { language } = useLanguage();
  const { createCustomer } = useCustomers();
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    status: 'active' as const,
    documents_verified: false,
    terms_accepted: false,
    id_card_image: '' // ✅ إضافة حقل البطاقة الشخصية
  });

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

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData({
      ...formData,
      [name]: checked
    });
  };

  const validateForm = () => {
    if (!formData.full_name.trim()) {
      toast.error(language === 'ar' ? 'الاسم الكامل مطلوب' : 'Full name is required');
      return false;
    }
    if (!formData.phone.trim()) {
      toast.error(language === 'ar' ? 'رقم الجوال مطلوب' : 'Phone number is required');
      return false;
    }
    if (!/^[3-9]\d{7}$/.test(formData.phone)) {
      toast.error(language === 'ar' ? 'يرجى إدخال رقم جوال صحيح (8 أرقام)' : 'Please enter a valid phone number (8 digits)');
      return false;
    }
    // البريد الإلكتروني اختياري - فقط تحقق من الصيغة إذا تم إدخاله
    if (formData.email.trim() && !formData.email.includes('@')) {
      toast.error(language === 'ar' ? 'يرجى إدخال بريد إلكتروني صحيح أو اتركه فارغاً' : 'Please enter a valid email or leave it empty');
      return false;
    }
    if (!formData.driver_license.trim()) {
      toast.error(language === 'ar' ? 'رقم رخصة القيادة مطلوب' : 'Driver license number is required');
      return false;
    }
    if (!formData.nationality.trim()) {
      toast.error(language === 'ar' ? 'الجنسية مطلوبة' : 'Nationality is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    // منع السلوك الافتراضي للمتصفح
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Format phone number for Qatar
      const submissionData = {
        ...formData,
        phone: formData.phone.replace(/^\+974/, '').trim()
      };
      
      const newCustomer = await createCustomer.mutateAsync(submissionData as Customer);
      toast.success(language === 'ar' ? 'تم إضافة العميل بنجاح' : 'Customer added successfully');
      
      // Reset form
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
        id_card_image: '' // ✅ إضافة حقل البطاقة الشخصية
      });
      
      // Call the callback with the new customer
      onCustomerCreated(newCustomer);
      onClose();
    } catch (error) {
      console.error('Error creating customer:', error);
      toast.error(language === 'ar' ? 'فشل في إضافة العميل' : 'Failed to add customer');
    } finally {
      setIsSubmitting(false);
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
      id_card_image: '' // ✅ إضافة حقل البطاقة الشخصية
    });
    
    // Reset scanning state
    setShowScanner(false);
    setScanCompleted(false);
    
    onClose();
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
      // ✅ IMPORTANT: Save the ID card image!
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md md:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 ${language === 'ar' ? 'text-right flex-row-reverse' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {language === 'ar' && <Plus className="h-5 w-5 text-blue-500" />}
            {language === 'ar' ? 'إضافة عميل جديد' : 'Add New Customer'}
            {language !== 'ar' && <Plus className="h-5 w-5 text-blue-500" />}
          </DialogTitle>
          <DialogDescription className={language === 'ar' ? 'text-right' : 'text-left'} dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {language === 'ar' ? 'أدخل معلومات العميل الجديد أو امسح البطاقة الشخصية لملء البيانات تلقائياً' : 'Enter new customer information or scan ID card to auto-fill data'}
          </DialogDescription>
        </DialogHeader>
        
        {/* ID Card Scanner Section */}
        <div className="space-y-4 py-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <Card className={`border-2 ${scanCompleted ? 'border-green-300 bg-green-50' : 'border-blue-300 bg-gradient-to-br from-blue-50 to-green-50'} transition-all duration-300`}>
            <CardHeader className="pb-3">
              <CardTitle className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  {scanCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <Scan className="h-5 w-5 text-blue-600" />
                  )}
                  <span className="text-lg">
                    {scanCompleted ? 
                      (language === 'ar' ? 'تم مسح البطاقة بنجاح' : 'ID Card Scanned Successfully') :
                      (language === 'ar' ? 'مسح البطاقة الشخصية' : 'Scan ID Card')
                    }
                  </span>
                </div>
                
                {scanCompleted && (
                  <Badge variant="outline" className="border-green-500 text-green-700 bg-green-100">
                    <Wand2 className="h-3 w-3 mr-1" />
                    {language === 'ar' ? 'تم التعبئة التلقائية' : 'Auto-filled'}
                  </Badge>
                )}
              </CardTitle>
              
              <CardDescription className={language === 'ar' ? 'text-right' : 'text-left'}>
                {scanCompleted ? (
                  language === 'ar' ? 
                    'تم استخراج البيانات من البطاقة الشخصية وتعبئة النموذج تلقائياً. يرجى مراجعة البيانات قبل الحفظ.' :
                    'Data extracted from ID card and form auto-filled. Please review the information before saving.'
                ) : (
                  language === 'ar' ? 
                    'امسح البطاقة الشخصية القطرية لملء البيانات تلقائياً وتوفير 90% من الوقت' :
                    'Scan your Qatar ID card to auto-fill data and save 90% of your time'
                )}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {!scanCompleted && !showScanner && (
                <div className="text-center space-y-4">
                  <div className={`flex items-center justify-center gap-4 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <Button
                      onClick={() => setShowScanner(true)}
                      className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-6 py-3 text-lg"
                    >
                      <Scan className="h-5 w-5 mr-2" />
                      {language === 'ar' ? 'ابدأ المسح الآن' : 'Start Scanning Now'}
                    </Button>
                  </div>
                  
                  <div className={`flex items-center justify-center gap-6 text-sm text-muted-foreground ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      {language === 'ar' ? 'توفير 90% من الوقت' : 'Save 90% Time'}
                    </div>
                    <div className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      {language === 'ar' ? 'دقة 95%' : '95% Accuracy'}
                    </div>
                    <div className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      {language === 'ar' ? 'تعبئة تلقائية' : 'Auto-fill'}
                    </div>
                  </div>
                </div>
              )}
              
              {scanCompleted && (
                <div className="text-center space-y-3">
                  <div className="text-green-700 font-medium">
                    {language === 'ar' ? '✅ تم استخراج البيانات بنجاح وتعبئة النموذج تلقائياً' : '✅ Data extracted successfully and form auto-filled'}
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
                    {language === 'ar' ? 'مسح بطاقة أخرى' : 'Scan Another Card'}
                  </Button>
                </div>
              )}
              
              {showScanner && !scanCompleted && (
                <div className="space-y-4">
                  <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <h4 className="font-medium">
                      {language === 'ar' ? 'مسح البطاقة الشخصية القطرية' : 'Scan Qatar ID Card'}
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowScanner(false)}
                    >
                      {language === 'ar' ? 'إلغاء' : 'Cancel'}
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
        </div>
        
        <div className="space-y-6 py-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className={`text-lg font-semibold flex items-center gap-2 ${language === 'ar' ? 'text-right flex-row-reverse' : 'text-left'}`}>
              {language === 'ar' && <User className="h-5 w-5 text-blue-500" />}
              {language === 'ar' ? 'المعلومات الأساسية' : 'Basic Information'}
              {language !== 'ar' && <User className="h-5 w-5 text-blue-500" />}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name" className={language === 'ar' ? 'text-right' : 'text-left'}>
                  {language === 'ar' ? 'الاسم الكامل *' : 'Full Name *'}
                </Label>
                <Input 
                  id="full_name" 
                  name="full_name" 
                  value={formData.full_name} 
                  onChange={handleInputChange}
                  placeholder={language === 'ar' ? 'أدخل الاسم الكامل' : 'Enter full name'}
                  className={language === 'ar' ? 'text-right' : 'text-left'}
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className={language === 'ar' ? 'text-right' : 'text-left'}>
                  {language === 'ar' ? 'البريد الإلكتروني (اختياري)' : 'Email (Optional)'}
                </Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email"
                  value={formData.email} 
                  onChange={handleInputChange}
                  placeholder={language === 'ar' ? 'example@email.com (اختياري)' : 'example@email.com (optional)'}
                  className={language === 'ar' ? 'text-right' : 'text-left'}
                  dir="ltr"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone" className={language === 'ar' ? 'text-right' : 'text-left'}>
                  {language === 'ar' ? 'رقم الجوال *' : 'Phone Number *'}
                </Label>
                <Input 
                  id="phone" 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleInputChange}
                  placeholder="33123456"
                  className={language === 'ar' ? 'text-right' : 'text-left'}
                  dir="ltr"
                />
                <p className={`text-xs text-muted-foreground ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {language === 'ar' ? 'أدخل 8 أرقام فقط. سيتم إضافة رمز الدولة +974 تلقائياً.' : 'Enter 8 digits only. Country code +974 will be added automatically.'}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nationality" className={language === 'ar' ? 'text-right' : 'text-left'}>
                  {language === 'ar' ? 'الجنسية *' : 'Nationality *'}
                </Label>
                <Input 
                  id="nationality" 
                  name="nationality" 
                  value={formData.nationality} 
                  onChange={handleInputChange}
                  placeholder={language === 'ar' ? 'أدخل الجنسية' : 'Enter nationality'}
                  className={language === 'ar' ? 'text-right' : 'text-left'}
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="driver_license" className={language === 'ar' ? 'text-right' : 'text-left'}>
                  {language === 'ar' ? 'رقم رخصة القيادة *' : 'Driver License Number *'}
                </Label>
                <Input 
                  id="driver_license" 
                  name="driver_license" 
                  value={formData.driver_license} 
                  onChange={handleInputChange}
                  placeholder={language === 'ar' ? 'أدخل رقم رخصة القيادة' : 'Enter driver license number'}
                  className={language === 'ar' ? 'text-right' : 'text-left'}
                  dir="ltr"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status" className={language === 'ar' ? 'text-right' : 'text-left'}>
                  {language === 'ar' ? 'الحالة' : 'Status'}
                </Label>
                <Select value={formData.status} onValueChange={(value) => handleSelectChange('status', value)}>
                  <SelectTrigger className={language === 'ar' ? 'text-right' : 'text-left'} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    <SelectValue placeholder={language === 'ar' ? 'اختر الحالة' : 'Select status'} />
                  </SelectTrigger>
                  <SelectContent align={language === 'ar' ? 'start' : 'end'}>
                    <SelectItem value="active">{language === 'ar' ? 'نشط' : 'Active'}</SelectItem>
                    <SelectItem value="inactive">{language === 'ar' ? 'غير نشط' : 'Inactive'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address" className={language === 'ar' ? 'text-right' : 'text-left'}>
                {language === 'ar' ? 'العنوان' : 'Address'}
              </Label>
              <Textarea 
                id="address" 
                name="address" 
                value={formData.address} 
                onChange={handleInputChange}
                placeholder={language === 'ar' ? 'أدخل العنوان' : 'Enter address'}
                className={language === 'ar' ? 'text-right' : 'text-left'}
                dir={language === 'ar' ? 'rtl' : 'ltr'}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes" className={language === 'ar' ? 'text-right' : 'text-left'}>
                {language === 'ar' ? 'ملاحظات' : 'Notes'}
              </Label>
              <Textarea 
                id="notes" 
                name="notes" 
                value={formData.notes} 
                onChange={handleInputChange}
                placeholder={language === 'ar' ? 'أدخل أي ملاحظات إضافية' : 'Enter any additional notes'}
                className={language === 'ar' ? 'text-right' : 'text-left'}
                dir={language === 'ar' ? 'rtl' : 'ltr'}
                rows={2}
              />
            </div>
          </div>
          
          {/* Verification Checkboxes */}
          <div className="space-y-3">
            <div className={`flex items-center space-x-2 ${language === 'ar' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <Checkbox 
                id="documents_verified" 
                checked={formData.documents_verified}
                onCheckedChange={(checked) => handleCheckboxChange('documents_verified', checked as boolean)}
              />
              <Label htmlFor="documents_verified" className={language === 'ar' ? 'text-right' : 'text-left'}>
                {language === 'ar' ? 'تم التحقق من الوثائق' : 'Documents verified'}
              </Label>
            </div>
            
            <div className={`flex items-center space-x-2 ${language === 'ar' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <Checkbox 
                id="terms_accepted" 
                checked={formData.terms_accepted}
                onCheckedChange={(checked) => handleCheckboxChange('terms_accepted', checked as boolean)}
              />
              <Label htmlFor="terms_accepted" className={language === 'ar' ? 'text-right' : 'text-left'}>
                {language === 'ar' ? 'موافقة على الشروط والأحكام' : 'Terms and conditions accepted'}
              </Label>
            </div>
          </div>
        </div>
        
        <DialogFooter className={`gap-2 sm:gap-0 ${language === 'ar' ? 'flex-row-reverse' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button 
            type="button"
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isSubmitting 
              ? (language === 'ar' ? 'جاري الإضافة...' : 'Adding...') 
              : (language === 'ar' ? 'إضافة العميل' : 'Add Customer')
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 