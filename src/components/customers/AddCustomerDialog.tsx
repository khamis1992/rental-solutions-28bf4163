import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useCustomers } from '@/hooks/use-customers';
import { Customer } from '@/lib/validation-schemas/customer';
import { useLanguage } from '@/contexts/LanguageContext';
import { User, Plus } from "lucide-react";

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
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    nationality: '',
    driver_license: '',
    address: '',
    notes: '',
    status: 'active' as const,
    documents_verified: false,
    terms_accepted: false
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
    if (!formData.email.trim()) {
      toast.error(language === 'ar' ? 'البريد الإلكتروني مطلوب' : 'Email is required');
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
    if (!formData.email.includes('@')) {
      toast.error(language === 'ar' ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email');
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

  const handleSubmit = async () => {
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
        address: '',
        notes: '',
        status: 'active',
        documents_verified: false,
        terms_accepted: false
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
      address: '',
      notes: '',
      status: 'active',
      documents_verified: false,
      terms_accepted: false
    });
    onClose();
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
            {language === 'ar' ? 'أدخل معلومات العميل الجديد' : 'Enter new customer information'}
          </DialogDescription>
        </DialogHeader>
        
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
                  {language === 'ar' ? 'البريد الإلكتروني *' : 'Email *'}
                </Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email"
                  value={formData.email} 
                  onChange={handleInputChange}
                  placeholder="example@email.com"
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