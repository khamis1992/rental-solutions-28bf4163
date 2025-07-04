import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Plus,
  Clock,
  AlertTriangle,
  Settings,
  CheckCircle,
  Car,
  Calendar as CalendarIcon,
  DollarSign,
  User,
  FileText,
  Zap
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';

interface QuickMaintenanceAction {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  estimatedTime: string;
  estimatedTimeEn: string;
  category: 'routine' | 'urgent' | 'preventive' | 'repair';
}

interface MaintenanceFormData {
  vehicleId: string;
  maintenanceType: string;
  priority: 'low' | 'medium' | 'high';
  scheduledDate: Date;
  description: string;
  estimatedCost: number;
  assignedTo: string;
}

export const AdvancedMaintenanceActions = () => {
  const { language } = useLanguage();
  const [selectedAction, setSelectedAction] = useState<QuickMaintenanceAction | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<MaintenanceFormData>({
    vehicleId: '',
    maintenanceType: '',
    priority: 'medium',
    scheduledDate: new Date(),
    description: '',
    estimatedCost: 0,
    assignedTo: ''
  });

  const quickActions: QuickMaintenanceAction[] = [
    {
      id: 'oil-change',
      title: 'تغيير الزيت',
      titleEn: 'Oil Change',
      description: 'تغيير زيت المحرك والفلتر',
      descriptionEn: 'Engine oil and filter replacement',
      icon: Settings,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      estimatedTime: '30 دقيقة',
      estimatedTimeEn: '30 minutes',
      category: 'routine'
    },
    {
      id: 'tire-check',
      title: 'فحص الإطارات',
      titleEn: 'Tire Inspection',
      description: 'فحص حالة الإطارات والضغط',
      descriptionEn: 'Tire condition and pressure check',
      icon: Car,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      estimatedTime: '15 دقيقة',
      estimatedTimeEn: '15 minutes',
      category: 'preventive'
    },
    {
      id: 'brake-service',
      title: 'صيانة الفرامل',
      titleEn: 'Brake Service',
      description: 'فحص وصيانة نظام الفرامل',
      descriptionEn: 'Brake system inspection and service',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      estimatedTime: '45 دقيقة',
      estimatedTimeEn: '45 minutes',
      category: 'urgent'
    },
    {
      id: 'battery-check',
      title: 'فحص البطارية',
      titleEn: 'Battery Check',
      description: 'فحص البطارية ونظام الشحن',
      descriptionEn: 'Battery and charging system check',
      icon: Zap,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      estimatedTime: '20 دقيقة',
      estimatedTimeEn: '20 minutes',
      category: 'preventive'
    },
    {
      id: 'ac-service',
      title: 'صيانة التكييف',
      titleEn: 'AC Service',
      description: 'تنظيف وصيانة نظام التكييف',
      descriptionEn: 'Air conditioning system cleaning and service',
      icon: Settings,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
      estimatedTime: '40 دقيقة',
      estimatedTimeEn: '40 minutes',
      category: 'routine'
    },
    {
      id: 'full-inspection',
      title: 'فحص شامل',
      titleEn: 'Full Inspection',
      description: 'فحص شامل لجميع أنظمة المركبة',
      descriptionEn: 'Comprehensive vehicle systems inspection',
      icon: CheckCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      estimatedTime: '90 دقيقة',
      estimatedTimeEn: '90 minutes',
      category: 'preventive'
    }
  ];

  const maintenanceTypes = [
    { value: 'oil_change', label: language === 'ar' ? 'تغيير الزيت' : 'Oil Change' },
    { value: 'tire_replacement', label: language === 'ar' ? 'استبدال الإطارات' : 'Tire Replacement' },
    { value: 'brake_service', label: language === 'ar' ? 'خدمة الفرامل' : 'Brake Service' },
    { value: 'routine_inspection', label: language === 'ar' ? 'فحص دوري' : 'Routine Inspection' },
    { value: 'engine_repair', label: language === 'ar' ? 'إصلاح المحرك' : 'Engine Repair' },
    { value: 'air_conditioning', label: language === 'ar' ? 'تكييف الهواء' : 'Air Conditioning' },
    { value: 'transmission', label: language === 'ar' ? 'ناقل الحركة' : 'Transmission' },
    { value: 'battery_replacement', label: language === 'ar' ? 'استبدال البطارية' : 'Battery Replacement' },
    { value: 'electrical_repair', label: language === 'ar' ? 'إصلاح كهربائي' : 'Electrical Repair' }
  ];

  const priorityOptions = [
    { value: 'low', label: language === 'ar' ? 'منخفض' : 'Low', color: 'text-green-600' },
    { value: 'medium', label: language === 'ar' ? 'متوسط' : 'Medium', color: 'text-yellow-600' },
    { value: 'high', label: language === 'ar' ? 'عالي' : 'High', color: 'text-red-600' }
  ];

  const handleActionSelect = (action: QuickMaintenanceAction) => {
    setSelectedAction(action);
    setFormData(prev => ({
      ...prev,
      maintenanceType: action.id
    }));
    setIsDialogOpen(true);
  };

  const handleFormSubmit = () => {
    // Validation
    if (!formData.vehicleId || !formData.maintenanceType) {
      toast.error(language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    
    toast.success(
      language === 'ar' 
        ? 'تم جدولة الصيانة بنجاح'
        : 'Maintenance scheduled successfully'
    );
    
    setIsDialogOpen(false);
    setSelectedAction(null);
    
    // Reset form
    setFormData({
      vehicleId: '',
      maintenanceType: '',
      priority: 'medium',
      scheduledDate: new Date(),
      description: '',
      estimatedCost: 0,
      assignedTo: ''
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'routine': return 'bg-blue-100 text-blue-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'preventive': return 'bg-green-100 text-green-800';
      case 'repair': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      routine: language === 'ar' ? 'روتينية' : 'Routine',
      urgent: language === 'ar' ? 'عاجلة' : 'Urgent',
      preventive: language === 'ar' ? 'وقائية' : 'Preventive',
      repair: language === 'ar' ? 'إصلاح' : 'Repair'
    };
    return labels[category] || category;
  };

  return (
    <Card className="w-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <CardHeader>
        <CardTitle className={cn(
          "flex items-center gap-2",
          language === 'ar' ? 'flex-row-reverse text-right' : ''
        )}>
          <Plus className="h-5 w-5 text-blue-500" />
          <span>{language === 'ar' ? 'الإجراءات السريعة للصيانة' : 'Quick Maintenance Actions'}</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const ActionIcon = action.icon;
            
            return (
              <Card 
                key={action.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-300"
                onClick={() => handleActionSelect(action)}
              >
                <CardContent className="p-4">
                  <div className={cn(
                    "flex items-center gap-3 mb-3",
                    language === 'ar' ? 'flex-row-reverse' : ''
                  )}>
                    <div className={cn("p-2 rounded-lg", action.bgColor)}>
                      <ActionIcon className={cn("h-5 w-5", action.color)} />
                    </div>
                    
                    <div className={cn("flex-1", language === 'ar' ? 'text-right' : '')}>
                      <h4 className="font-semibold text-gray-900">
                        {language === 'ar' ? action.title : action.titleEn}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {language === 'ar' ? action.estimatedTime : action.estimatedTimeEn}
                      </p>
                    </div>
                  </div>
                  
                  <p className={cn(
                    "text-sm text-gray-700 mb-3",
                    language === 'ar' ? 'text-right' : ''
                  )}>
                    {language === 'ar' ? action.description : action.descriptionEn}
                  </p>
                  
                  <div className={cn(
                    "flex items-center justify-between",
                    language === 'ar' ? 'flex-row-reverse' : ''
                  )}>
                    <Badge variant="outline" className={getCategoryColor(action.category)}>
                      {getCategoryLabel(action.category)}
                    </Badge>
                    
                    <Button size="sm" variant="outline">
                      <Plus className="h-3 w-3 mr-1" />
                      {language === 'ar' ? 'جدولة' : 'Schedule'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Maintenance Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <DialogHeader>
              <DialogTitle className={cn(
                "flex items-center gap-3",
                language === 'ar' ? 'flex-row-reverse text-right' : ''
              )}>
                {selectedAction && (
                  <>
                    <div className={cn("p-2 rounded-lg", selectedAction.bgColor)}>
                      <selectedAction.icon className={cn("h-5 w-5", selectedAction.color)} />
                    </div>
                    <span>
                      {language === 'ar' 
                        ? `جدولة ${selectedAction.title}` 
                        : `Schedule ${selectedAction.titleEn}`
                      }
                    </span>
                  </>
                )}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Vehicle Selection */}
              <div>
                <label className={cn(
                  "block text-sm font-medium text-gray-700 mb-2",
                  language === 'ar' ? 'text-right' : ''
                )}>
                  {language === 'ar' ? 'المركبة:' : 'Vehicle:'}
                </label>
                <Select value={formData.vehicleId} onValueChange={(value) => setFormData(prev => ({ ...prev, vehicleId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'ar' ? 'اختر المركبة' : 'Select Vehicle'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vehicle-1">Toyota Camry - أ ب ج 123</SelectItem>
                    <SelectItem value="vehicle-2">Honda Civic - د هـ و 456</SelectItem>
                    <SelectItem value="vehicle-3">Nissan Altima - ز ح ط 789</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Maintenance Type */}
              <div>
                <label className={cn(
                  "block text-sm font-medium text-gray-700 mb-2",
                  language === 'ar' ? 'text-right' : ''
                )}>
                  {language === 'ar' ? 'نوع الصيانة:' : 'Maintenance Type:'}
                </label>
                <Select value={formData.maintenanceType} onValueChange={(value) => setFormData(prev => ({ ...prev, maintenanceType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {maintenanceTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div>
                <label className={cn(
                  "block text-sm font-medium text-gray-700 mb-2",
                  language === 'ar' ? 'text-right' : ''
                )}>
                  {language === 'ar' ? 'الأولوية:' : 'Priority:'}
                </label>
                <Select value={formData.priority} onValueChange={(value: 'low' | 'medium' | 'high') => setFormData(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <span className={option.color}>{option.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Scheduled Date */}
              <div>
                <label className={cn(
                  "block text-sm font-medium text-gray-700 mb-2",
                  language === 'ar' ? 'text-right' : ''
                )}>
                  {language === 'ar' ? 'تاريخ الجدولة:' : 'Scheduled Date:'}
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {format(formData.scheduledDate, "PPP", { locale: language === 'ar' ? ar : undefined })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.scheduledDate}
                      onSelect={(date) => date && setFormData(prev => ({ ...prev, scheduledDate: date }))}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Description */}
              <div>
                <label className={cn(
                  "block text-sm font-medium text-gray-700 mb-2",
                  language === 'ar' ? 'text-right' : ''
                )}>
                  {language === 'ar' ? 'الوصف:' : 'Description:'}
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={language === 'ar' ? 'تفاصيل إضافية...' : 'Additional details...'}
                  className={language === 'ar' ? 'text-right' : ''}
                />
              </div>

              {/* Estimated Cost */}
              <div>
                <label className={cn(
                  "block text-sm font-medium text-gray-700 mb-2",
                  language === 'ar' ? 'text-right' : ''
                )}>
                  {language === 'ar' ? 'التكلفة المقدرة (ر.ق):' : 'Estimated Cost (QAR):'}
                </label>
                <Input
                  type="number"
                  value={formData.estimatedCost}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimatedCost: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>

              {/* Assigned To */}
              <div>
                <label className={cn(
                  "block text-sm font-medium text-gray-700 mb-2",
                  language === 'ar' ? 'text-right' : ''
                )}>
                  {language === 'ar' ? 'مُكلف إلى:' : 'Assigned To:'}
                </label>
                <Select value={formData.assignedTo} onValueChange={(value) => setFormData(prev => ({ ...prev, assignedTo: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'ar' ? 'اختر الفني' : 'Select Technician'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tech-1">أحمد محمد - فني رئيسي</SelectItem>
                    <SelectItem value="tech-2">سارة علي - فني متخصص</SelectItem>
                    <SelectItem value="tech-3">محمد خالد - فني عام</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className={cn(
                "flex gap-3 pt-4",
                language === 'ar' ? 'flex-row-reverse' : ''
              )}>
                <Button onClick={handleFormSubmit} className="flex-1">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'جدولة الصيانة' : 'Schedule Maintenance'}
                </Button>
                
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
