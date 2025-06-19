import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { MaintenanceType, MaintenanceStatus } from '@/lib/validation-schemas/maintenance';
import { useMaintenance } from '@/hooks/use-maintenance';
import { toast } from "sonner";
import { useLanguage } from '@/contexts/LanguageContext';

interface MaintenanceSchedulingWizardProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
  vehicleId?: string;
}

export function MaintenanceSchedulingWizard({
  open,
  onClose,
  onComplete,
  vehicleId
}: MaintenanceSchedulingWizardProps) {
  const [currentStep, setCurrentStep] = useState<'type' | 'details' | 'confirm'>('type');
  const [isProcessing, setIsProcessing] = useState(false);
  const { language } = useLanguage();

  const [formData, setFormData] = useState({
    vehicle_id: vehicleId || '',
    maintenance_type: MaintenanceType.REGULAR_INSPECTION,
    description: '',
    scheduled_date: new Date().toISOString().slice(0, 16),
    estimated_cost: '',
    assigned_to: '',
    notes: ''
  });

  const { createMaintenanceRecord } = useMaintenance();

  const firstInputRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (open && firstInputRef.current) {
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleContinue = () => {
    if (currentStep === 'type') {
      setCurrentStep('details');
    } else if (currentStep === 'details') {
      setCurrentStep('confirm');
    }
  };

  const handleBack = () => {
    if (currentStep === 'details') {
      setCurrentStep('type');
    } else if (currentStep === 'confirm') {
      setCurrentStep('details');
    }
  };

  const handleSubmit = async () => {
    setIsProcessing(true);
    try {
      await createMaintenanceRecord({
        ...formData,
        status: MaintenanceStatus.SCHEDULED,
        cost: parseFloat(formData.estimated_cost) || 0
      });
      toast.success(language === 'ar'
        ? 'تم إنشاء سجل الصيانة بنجاح'
        : 'Maintenance record created successfully');
      onComplete();
      onClose();
    } catch (error) {
      console.error('Failed to schedule maintenance:', error);
      toast.error(language === 'ar'
        ? 'فشل في إنشاء سجل الصيانة. يرجى المحاولة مرة أخرى'
        : 'Failed to create maintenance record. Please try again');
    } finally {
      setIsProcessing(false);
    }
  };

  const maintenanceTypeOptions = [
    { id: 'regular', value: MaintenanceType.REGULAR_INSPECTION, label: language === 'ar' ? 'فحص دوري' : 'Regular Inspection' },
    { id: 'oil', value: MaintenanceType.OIL_CHANGE, label: language === 'ar' ? 'تغيير الزيت' : 'Oil Change' },
    { id: 'tire', value: MaintenanceType.TIRE_REPLACEMENT, label: language === 'ar' ? 'استبدال الإطارات' : 'Tire Replacement' },
    { id: 'brake', value: MaintenanceType.BRAKE_SERVICE, label: language === 'ar' ? 'خدمة الفرامل' : 'Brake Service' },
    { id: 'engine', value: MaintenanceType.ENGINE_REPAIR, label: language === 'ar' ? 'إصلاح المحرك' : 'Engine Repair' },
    { id: 'transmission', value: MaintenanceType.TRANSMISSION_SERVICE, label: language === 'ar' ? 'خدمة ناقل الحركة' : 'Transmission Service' },
    { id: 'battery', value: MaintenanceType.BATTERY_REPLACEMENT, label: language === 'ar' ? 'استبدال البطارية' : 'Battery Replacement' },
    { id: 'ac', value: MaintenanceType.AIR_CONDITIONING, label: language === 'ar' ? 'تكييف الهواء' : 'Air Conditioning' },
    { id: 'electrical', value: MaintenanceType.ELECTRICAL_REPAIR, label: language === 'ar' ? 'إصلاح كهربائي' : 'Electrical Repair' }
  ];

  const renderTypeSelection = () => (
    <div className="space-y-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="space-y-2">
        <Label className={language === 'ar' ? 'text-right' : ''}>
          {language === 'ar' ? 'نوع الصيانة' : 'Maintenance Type'}
        </Label>
        <Select
          value={formData.maintenance_type}
          onValueChange={(value) => handleSelectChange('maintenance_type', value)}
        >
          <SelectTrigger
            ref={firstInputRef}
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          >
            <SelectValue placeholder={language === 'ar' ? 'اختيار نوع الصيانة' : 'Select maintenance type'} />
          </SelectTrigger>
          <SelectContent>
            {maintenanceTypeOptions.map((type) => (
              <SelectItem key={type.id} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description" className={language === 'ar' ? 'text-right' : ''}>
          {language === 'ar' ? 'الوصف' : 'Description'}
        </Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder={language === 'ar' ? 'وصف أعمال الصيانة المطلوبة' : 'Describe the maintenance work needed'}
          className={language === 'ar' ? 'text-right' : ''}
        />
      </div>
    </div>
  );

  const renderDetails = () => (
    <div className="space-y-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="space-y-2">
        <Label htmlFor="scheduled_date" className={language === 'ar' ? 'text-right' : ''}>
          {language === 'ar' ? 'التاريخ المجدول' : 'Scheduled Date'}
        </Label>
        <Input
          type="datetime-local"
          id="scheduled_date"
          name="scheduled_date"
          value={formData.scheduled_date}
          onChange={handleInputChange}
          className={language === 'ar' ? 'text-right' : ''}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="estimated_cost" className={language === 'ar' ? 'text-right' : ''}>
          {language === 'ar' ? 'التكلفة المقدرة' : 'Estimated Cost'}
        </Label>
        <Input
          type="number"
          id="estimated_cost"
          name="estimated_cost"
          value={formData.estimated_cost}
          onChange={handleInputChange}
          placeholder="0.00"
          className={language === 'ar' ? 'text-right' : ''}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="assigned_to" className={language === 'ar' ? 'text-right' : ''}>
          {language === 'ar' ? 'مسند إلى' : 'Assigned To'}
        </Label>
        <Input
          id="assigned_to"
          name="assigned_to"
          value={formData.assigned_to}
          onChange={handleInputChange}
          placeholder={language === 'ar' ? 'اسم أو معرف الفني' : 'Technician name or ID'}
          className={language === 'ar' ? 'text-right' : ''}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="notes" className={language === 'ar' ? 'text-right' : ''}>
          {language === 'ar' ? 'ملاحظات إضافية' : 'Additional Notes'}
        </Label>
        <Textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleInputChange}
          placeholder={language === 'ar' ? 'أي ملاحظات أو تعليمات إضافية' : 'Any additional notes or instructions'}
          className={language === 'ar' ? 'text-right' : ''}
        />
      </div>
    </div>
  );

  const renderConfirmation = () => (
    <div className="space-y-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="bg-slate-50 p-4 rounded-md">
        <h3 className={`text-sm font-medium mb-3 ${language === 'ar' ? 'text-right' : ''}`}>
          {language === 'ar' ? 'ملخص الصيانة' : 'Maintenance Summary'}
        </h3>
        <div className="space-y-2 text-sm">
          <div className={`grid grid-cols-2 gap-2 ${language === 'ar' ? 'text-right' : ''}`}>
            <span className="text-slate-500">{language === 'ar' ? 'النوع:' : 'Type:'}</span>
            <span>{maintenanceTypeOptions.find(t => t.value === formData.maintenance_type)?.label}</span>
          </div>
          <div className={`grid grid-cols-2 gap-2 ${language === 'ar' ? 'text-right' : ''}`}>
            <span className="text-slate-500">{language === 'ar' ? 'التاريخ المجدول:' : 'Scheduled Date:'}</span>
            <span>{new Date(formData.scheduled_date).toLocaleString()}</span>
          </div>
          <div className={`grid grid-cols-2 gap-2 ${language === 'ar' ? 'text-right' : ''}`}>
            <span className="text-slate-500">{language === 'ar' ? 'التكلفة المقدرة:' : 'Estimated Cost:'}</span>
            <span>{language === 'ar' ? 'ر.س' : '$'}{parseFloat(formData.estimated_cost || '0').toFixed(2)}</span>
          </div>
          <div className={`grid grid-cols-2 gap-2 ${language === 'ar' ? 'text-right' : ''}`}>
            <span className="text-slate-500">{language === 'ar' ? 'مسند إلى:' : 'Assigned To:'}</span>
            <span>{formData.assigned_to || (language === 'ar' ? 'غير مسند' : 'Not assigned')}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md md:max-w-lg" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className={language === 'ar' ? 'text-right' : ''}>
            {language === 'ar' ? 'جدولة الصيانة' : 'Schedule Maintenance'}
          </DialogTitle>
          <DialogDescription className={language === 'ar' ? 'text-right' : ''}>
            {language === 'ar' ? 'جدولة وتخطيط أعمال الصيانة خطوة بخطوة' : 'Schedule and plan maintenance work step by step'}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={currentStep} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="type" disabled>
              {language === 'ar' ? 'النوع' : 'Type'}
            </TabsTrigger>
            <TabsTrigger value="details" disabled>
              {language === 'ar' ? 'التفاصيل' : 'Details'}
            </TabsTrigger>
            <TabsTrigger value="confirm" disabled>
              {language === 'ar' ? 'تأكيد' : 'Confirm'}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="type" className="pt-4">
            {renderTypeSelection()}
          </TabsContent>
          
          <TabsContent value="details" className="pt-4">
            {renderDetails()}
          </TabsContent>
          
          <TabsContent value="confirm" className="pt-4">
            {renderConfirmation()}
          </TabsContent>
        </Tabs>
        
        <Separator />
        
        <DialogFooter className={`gap-2 sm:gap-0 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          {currentStep !== 'type' && (
            <Button variant="outline" onClick={handleBack} disabled={isProcessing}>
              {language === 'ar' ? 'السابق' : 'Back'}
            </Button>
          )}
          
          {currentStep !== 'confirm' ? (
            <Button onClick={handleContinue}>
              {language === 'ar' ? 'متابعة' : 'Continue'}
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700 text-white w-full"
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white border-t-2"></span>
                  {language === 'ar' ? 'جاري الحفظ...' : 'Saving...'}
                </span>
              ) : (
                language === 'ar' ? 'حفظ' : 'Save'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
