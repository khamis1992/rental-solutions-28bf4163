import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useLanguage } from '@/contexts/LanguageContext';
import { useCustomers } from '@/hooks/use-customers';
import { useVehicleService } from '@/hooks/services/useVehicleService';
import { AddCustomerDialog } from '@/components/customers/AddCustomerDialog';
import { Customer } from '@/lib/validation-schemas/customer';
import { User, Car, FileText, Plus } from "lucide-react";

interface AgreementOnboardingWizardProps {
  open: boolean;
  onClose: () => void;
  onComplete: (formData: any) => void;
}

export function AgreementOnboardingWizard({
  open,
  onClose,
  onComplete
}: AgreementOnboardingWizardProps) {
  const { language } = useLanguage();
  const { customers } = useCustomers();
  const { getAllVehicles } = useVehicleService();
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showAddCustomerDialog, setShowAddCustomerDialog] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);

  const [formData, setFormData] = useState({
        agreement_number: '',
        agreement_type: 'short_term',
        status: 'draft',
        customer_id: '',
        vehicle_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        total_amount: 0,
        deposit_amount: 0,
        rent_amount: 0,
        daily_late_fee: 120,
    payment_day: 1,
    notes: ''
  });

  // Load vehicles when component mounts
  useEffect(() => {
    const loadVehicles = async () => {
      try {
        const vehicleData = await getAllVehicles();
        setVehicles(vehicleData || []);
      } catch (error) {
        console.error('Error loading vehicles:', error);
      }
    };
    
    if (open) {
      loadVehicles();
    }
  }, [open, getAllVehicles]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCustomerCreated = (newCustomer: Customer) => {
    // Update the customer selection to the newly created customer
    setFormData(prev => ({
      ...prev,
      customer_id: newCustomer.id || ''
    }));
    toast.success(language === 'ar' ? 'تم إضافة العميل وتحديده تلقائياً' : 'Customer added and selected automatically');
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 1: // Customer Selection
        if (!formData.customer_id) {
          toast.error(language === 'ar' ? 'يرجى اختيار العميل' : 'Please select a customer');
          return false;
        }
        return true;
      case 2: // Vehicle Selection
        if (!formData.vehicle_id) {
          toast.error(language === 'ar' ? 'يرجى اختيار المركبة' : 'Please select a vehicle');
          return false;
        }
        return true;
      case 3: // Agreement Details
        if (!formData.start_date || !formData.end_date) {
          toast.error(language === 'ar' ? 'يرجى تحديد تواريخ الاتفاقية' : 'Please set agreement dates');
          return false;
        }
        if (formData.rent_amount <= 0) {
          toast.error(language === 'ar' ? 'يرجى إدخال مبلغ الإيجار' : 'Please enter rent amount');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsProcessing(true);
    try {
      const submissionData = {
        ...formData,
        total_amount: formData.rent_amount + formData.deposit_amount
      };
      
      onComplete(submissionData);
    } catch (error) {
      toast.error(language === 'ar' ? "فشل في معالجة بيانات الاتفاقية" : "Failed to process agreement data");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <h3 className={`text-lg font-semibold flex items-center gap-2 ${language === 'ar' ? 'text-right flex-row-reverse' : 'text-left'}`}>
              {language === 'ar' && <User className="h-5 w-5 text-blue-500" />}
              {language === 'ar' ? 'اختيار العميل' : 'Select Customer'}
              {language !== 'ar' && <User className="h-5 w-5 text-blue-500" />}
            </h3>
            
            <div className="space-y-2">
              <Label className={language === 'ar' ? 'text-right' : 'text-left'}>
                {language === 'ar' ? 'العميل *' : 'Customer *'}
              </Label>
              <div className="flex gap-2">
                <Select value={formData.customer_id} onValueChange={(value) => handleSelectChange('customer_id', value)}>
                  <SelectTrigger className="flex-1" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    <SelectValue placeholder={language === 'ar' ? 'اختر العميل' : 'Select Customer'} />
                  </SelectTrigger>
                  <SelectContent align={language === 'ar' ? 'start' : 'end'}>
                    {customers?.map((customer: any) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.full_name} - {customer.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddCustomerDialog(true)}
                  className={cn(
                    "flex items-center gap-1 px-3",
                    language === 'ar' ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  {language === 'ar' && <Plus className="h-4 w-4" />}
                  {language === 'ar' ? 'إضافة عميل' : 'Add Customer'}
                  {language !== 'ar' && <Plus className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <h3 className={`text-lg font-semibold flex items-center gap-2 ${language === 'ar' ? 'text-right flex-row-reverse' : 'text-left'}`}>
              {language === 'ar' && <Car className="h-5 w-5 text-blue-500" />}
              {language === 'ar' ? 'اختيار المركبة' : 'Select Vehicle'}
              {language !== 'ar' && <Car className="h-5 w-5 text-blue-500" />}
            </h3>
            
            <div className="space-y-2">
              <Label className={language === 'ar' ? 'text-right' : 'text-left'}>
                {language === 'ar' ? 'المركبة *' : 'Vehicle *'}
              </Label>
              <Select value={formData.vehicle_id} onValueChange={(value) => handleSelectChange('vehicle_id', value)}>
                <SelectTrigger dir={language === 'ar' ? 'rtl' : 'ltr'}>
                  <SelectValue placeholder={language === 'ar' ? 'اختر المركبة' : 'Select Vehicle'} />
                </SelectTrigger>
                <SelectContent align={language === 'ar' ? 'start' : 'end'}>
                  {vehicles?.filter((vehicle: any) => vehicle.status === 'available').map((vehicle: any) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.make} {vehicle.model} - {vehicle.license_plate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <h3 className={`text-lg font-semibold flex items-center gap-2 ${language === 'ar' ? 'text-right flex-row-reverse' : 'text-left'}`}>
              {language === 'ar' && <FileText className="h-5 w-5 text-blue-500" />}
              {language === 'ar' ? 'تفاصيل الاتفاقية' : 'Agreement Details'}
              {language !== 'ar' && <FileText className="h-5 w-5 text-blue-500" />}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={language === 'ar' ? 'text-right' : 'text-left'}>
                  {language === 'ar' ? 'نوع الاتفاقية' : 'Agreement Type'}
                </Label>
                <Select value={formData.agreement_type} onValueChange={(value) => handleSelectChange('agreement_type', value)}>
                  <SelectTrigger dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align={language === 'ar' ? 'start' : 'end'}>
                    <SelectItem value="short_term">{language === 'ar' ? 'قصير المدى' : 'Short Term'}</SelectItem>
                    <SelectItem value="long_term">{language === 'ar' ? 'طويل المدى' : 'Long Term'}</SelectItem>
                    <SelectItem value="lease_to_own">{language === 'ar' ? 'إيجار منتهي بالتمليك' : 'Lease to Own'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className={language === 'ar' ? 'text-right' : 'text-left'}>
                  {language === 'ar' ? 'مبلغ الإيجار (ريال) *' : 'Rent Amount (QAR) *'}
                </Label>
                <Input
                  name="rent_amount"
                  type="number"
                  value={formData.rent_amount}
                  onChange={handleInputChange}
                  placeholder="0"
                  className={language === 'ar' ? 'text-right' : 'text-left'}
                  dir="ltr"
                />
              </div>
              
              <div className="space-y-2">
                <Label className={language === 'ar' ? 'text-right' : 'text-left'}>
                  {language === 'ar' ? 'مبلغ التأمين (ريال)' : 'Deposit Amount (QAR)'}
                </Label>
                <Input
                  name="deposit_amount"
                  type="number"
                  value={formData.deposit_amount}
                  onChange={handleInputChange}
                  placeholder="0"
                  className={language === 'ar' ? 'text-right' : 'text-left'}
                  dir="ltr"
                />
              </div>
              
              <div className="space-y-2">
                <Label className={language === 'ar' ? 'text-right' : 'text-left'}>
                  {language === 'ar' ? 'غرامة التأخير اليومية (ريال)' : 'Daily Late Fee (QAR)'}
                </Label>
                <Input
                  name="daily_late_fee"
                  type="number"
                  value={formData.daily_late_fee}
                  onChange={handleInputChange}
                  placeholder="120"
                  className={language === 'ar' ? 'text-right' : 'text-left'}
                  dir="ltr"
                />
              </div>
              
              <div className="space-y-2">
                <Label className={language === 'ar' ? 'text-right' : 'text-left'}>
                  {language === 'ar' ? 'تاريخ البداية *' : 'Start Date *'}
                </Label>
                <Input
                  name="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  className={language === 'ar' ? 'text-right' : 'text-left'}
                  dir="ltr"
                />
              </div>
              
              <div className="space-y-2">
                <Label className={language === 'ar' ? 'text-right' : 'text-left'}>
                  {language === 'ar' ? 'تاريخ النهاية *' : 'End Date *'}
                </Label>
                <Input
                  name="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  className={language === 'ar' ? 'text-right' : 'text-left'}
                  dir="ltr"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className={language === 'ar' ? 'text-right' : 'text-left'}>
                {language === 'ar' ? 'ملاحظات' : 'Notes'}
              </Label>
              <Textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder={language === 'ar' ? 'أدخل أي ملاحظات إضافية' : 'Enter any additional notes'}
                className={language === 'ar' ? 'text-right' : 'text-left'}
                dir={language === 'ar' ? 'rtl' : 'ltr'}
                rows={3}
              />
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md md:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
            <DialogTitle className={language === 'ar' ? 'text-right' : 'text-left'} dir={language === 'ar' ? 'rtl' : 'ltr'}>
              {language === 'ar' ? 'إنشاء اتفاقية جديدة' : 'Create New Agreement'}
            </DialogTitle>
            <DialogDescription className={language === 'ar' ? 'text-right' : 'text-left'} dir={language === 'ar' ? 'rtl' : 'ltr'}>
              {language === 'ar' ? `الخطوة ${currentStep} من 3` : `Step ${currentStep} of 3`}
          </DialogDescription>
        </DialogHeader>
        
          {/* Step Indicator */}
          <div className={`flex items-center justify-center mb-6 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
            {[1, 2, 3].map((step) => (
              <React.Fragment key={step}>
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  step <= currentStep 
                    ? "bg-blue-500 text-white" 
                    : "bg-gray-200 text-gray-500"
                )}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={cn(
                    "h-1 w-12 mx-2",
                    step < currentStep ? "bg-blue-500" : "bg-gray-200"
                  )} />
                )}
              </React.Fragment>
            ))}
          </div>
          
          <div className="py-4">
            {renderStepContent()}
        </div>
        
          <DialogFooter className={`gap-2 sm:gap-0 ${language === 'ar' ? 'flex-row-reverse' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            
            {currentStep > 1 && (
              <Button variant="outline" onClick={handlePrevious} disabled={isProcessing}>
                {language === 'ar' ? 'السابق' : 'Previous'}
              </Button>
            )}
            
            {currentStep < 3 ? (
              <Button onClick={handleNext} disabled={isProcessing}>
                {language === 'ar' ? 'التالي' : 'Next'}
          </Button>
            ) : (
          <Button 
            onClick={handleSubmit} 
            disabled={isProcessing}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
                {isProcessing 
                  ? (language === 'ar' ? 'جاري المعالجة...' : 'Processing...') 
                  : (language === 'ar' ? 'إنشاء اتفاقية' : 'Create Agreement')
                }
          </Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>

      {/* Add Customer Dialog */}
      <AddCustomerDialog
        open={showAddCustomerDialog}
        onClose={() => setShowAddCustomerDialog(false)}
        onCustomerCreated={handleCustomerCreated}
      />
    </>
  );
}
