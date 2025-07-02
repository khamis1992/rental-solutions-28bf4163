import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useAgreementService } from '@/hooks/services/useAgreementService';
import { LeaseStatus } from '@/types/lease-types';
import { Loader2, Save, AlertTriangle, CheckCircle, RefreshCw, Eye, Undo } from 'lucide-react';
import VehicleSelector from '@/components/vehicles/VehicleSelector';
import CustomerSelector from '@/components/customers/CustomerSelector';
import PaymentScheduleEditor from '../payments/PaymentScheduleEditor';
import { PaymentScheduleSection } from '../form/PaymentScheduleSection';
import { CustomerInfo } from '@/types/customer';
import { usePaymentScheduleManagement } from '@/hooks/payment/use-payment-schedule-management';
import { paymentService } from '@/services/PaymentService';
import { paymentScheduleService } from '@/services/PaymentScheduleService';
import { generatePaymentSchedule } from '@/utils/payment-schedule-generator';
import { generateAndStoreContract } from '@/utils/contract-generator';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Edit3, X } from 'lucide-react';
import { ChangeSummaryDialog } from './ChangeSummaryDialog';

// إصلاح schema مع القيم الصحيحة للحالة وجعل جميع الحقول اختيارية للتعديل
const agreementUpdateSchema = z.object({
  agreement_number: z.string().optional(),
  agreement_type: z.enum(['short_term', 'lease_to_own']).optional(),
  status: z.enum(['active', 'closed', 'cancelled']).optional(), // القيم الصحيحة المدعومة في قاعدة البيانات
  customer_id: z.string().optional(),
  vehicle_id: z.string().optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  total_amount: z.number().min(0).optional(),
  rent_amount: z.number().min(0).optional(),
  deposit_amount: z.number().min(0).optional(),
  daily_late_fee: z.number().min(0).optional(),
  payment_frequency: z.enum(['weekly', 'monthly', 'quarterly']).optional(),
  payment_day: z.number().min(1).max(31).optional(),
  notes: z.string().optional(),
  additional_drivers: z.array(z.string()).optional(),
}).refine((data) => {
  // التحقق من صحة التواريخ فقط إذا تم توفير كلا التاريخين
  if (data.start_date && data.end_date) {
    return data.end_date > data.start_date;
  }
  return true;
}, {
  message: "تاريخ النهاية يجب أن يكون بعد تاريخ البداية",
  path: ["end_date"],
});

// نوع البيانات لمقارنة التغييرات
interface ChangeComparison {
  field: string;
  fieldLabel: string;
  oldValue: any;
  newValue: any;
  changed: boolean;
}

const AgreementEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast: useToastHook } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("details");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerInfo | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [originalData, setOriginalData] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // حالات ملخص التعديلات
  const [showChangeSummary, setShowChangeSummary] = useState(false);
  const [changesList, setChangesList] = useState<ChangeComparison[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const agreementService = useAgreementService();
  const isEditMode = Boolean(id && id !== 'undefined' && id !== 'null');
  
  // إعداد النموذج مع قيم اختيارية
  const form = useForm<z.infer<typeof agreementUpdateSchema>>({
    resolver: zodResolver(agreementUpdateSchema),
    mode: 'onChange',
    defaultValues: {},
  });

  // مراقبة قيم النموذج للتحقق من التغييرات
  const watchedValues = form.watch();

  // دالة لمقارنة القيم وإنشاء قائمة التغييرات
  const generateChangesList = useCallback(() => {
    if (!originalData) return [];

    const fieldLabels: Record<string, string> = {
      agreement_number: 'رقم العقد',
      agreement_type: 'نوع العقد',
      status: 'حالة العقد',
      customer_id: 'العميل',
      vehicle_id: 'المركبة',
      start_date: 'تاريخ البداية',
      end_date: 'تاريخ النهاية',
      total_amount: 'المبلغ الإجمالي',
      rent_amount: 'مبلغ الإيجار',
      deposit_amount: 'مبلغ الضمان',
      daily_late_fee: 'رسوم التأخير اليومية',
      payment_frequency: 'تكرار الدفع',
      payment_day: 'يوم الدفع',
      notes: 'ملاحظات'
    };

    const changes: ChangeComparison[] = [];
    const currentValues = form.getValues();

    Object.keys(fieldLabels).forEach(field => {
      const oldValue = originalData[field];
      const newValue = currentValues[field as keyof typeof currentValues];
      
      // تحويل التواريخ للمقارنة
      let processedOldValue = oldValue;
      let processedNewValue = newValue;
      
      if (field === 'start_date' || field === 'end_date') {
        processedOldValue = oldValue instanceof Date ? oldValue.toDateString() : oldValue;
        processedNewValue = newValue instanceof Date ? newValue.toDateString() : newValue;
      }
      
      const isChanged = JSON.stringify(processedOldValue) !== JSON.stringify(processedNewValue);
      
      if (isChanged && newValue !== undefined) {
        changes.push({
          field,
          fieldLabel: fieldLabels[field],
          oldValue: processedOldValue,
          newValue: processedNewValue,
          changed: true
        });
      }
    });

    return changes;
  }, [originalData, form]);

  // التحقق من التغييرات
  useEffect(() => {
    if (originalData) {
      const changes = generateChangesList();
      setChangesList(changes);
      setHasUnsavedChanges(changes.length > 0);
    }
  }, [watchedValues, originalData, generateChangesList]);

  // تحميل بيانات العقد
  const loadAgreement = async (): Promise<void> => {
    if (!id || id === 'undefined' || id === 'null') return;
    
    setIsLoading(true);
    try {
      const agreement = await agreementService.getAgreementDetails(id);
      
      if (agreement) {
        const formData = {
          agreement_number: agreement.agreement_number || '',
          agreement_type: (agreement.agreement_type || 'short_term') as 'short_term' | 'lease_to_own',
          status: (['active', 'closed', 'cancelled'].includes(agreement.status as string) 
            ? agreement.status 
            : 'active') as 'active' | 'closed' | 'cancelled',
          customer_id: agreement.customer_id || '',
          vehicle_id: agreement.vehicle_id || '',
          start_date: agreement.start_date ? new Date(agreement.start_date) : undefined,
          end_date: agreement.end_date ? new Date(agreement.end_date) : undefined,
          total_amount: agreement.total_amount || 0,
          rent_amount: agreement.rent_amount || 0,
          deposit_amount: agreement.deposit_amount || 0,
          daily_late_fee: agreement.daily_late_fee || 120,
          payment_frequency: (agreement.payment_frequency || 'monthly') as 'weekly' | 'monthly' | 'quarterly',
          payment_day: agreement.payment_day || 1,
          notes: agreement.notes || '',
          additional_drivers: agreement.additional_drivers || [],
        };

        // تعيين قيم النموذج
        form.reset(formData);
        setOriginalData(formData);
        
        // تعيين العميل والمركبة المختارين
        if (agreement.customers) {
          setSelectedCustomer(agreement.customers);
        }
        if (agreement.vehicles) {
          setSelectedVehicle(agreement.vehicles);
        }

        toast.success('تم تحميل بيانات العقد بنجاح');
      }
    } catch (error) {
      console.error('خطأ في تحميل العقد:', error);
      toast.error('فشل في تحميل بيانات العقد');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isEditMode) {
      loadAgreement();
    }
  }, [id, isEditMode]);

  // إعادة تعيين النموذج للبيانات الأصلية
  const resetForm = useCallback(() => {
    if (originalData) {
      form.reset(originalData);
      setHasUnsavedChanges(false);
      setChangesList([]);
      toast.info('تم إعادة تعيين النموذج للبيانات الأصلية');
    }
  }, [originalData, form]);

  // دالة عرض ملخص التغييرات
  const showChangesSummary = () => {
    const changes = generateChangesList();
    if (changes.length === 0) {
      toast.info('لا توجد تغييرات للحفظ');
      return;
    }
    setChangesList(changes);
    setShowChangeSummary(true);
  };

  // دالة تأكيد الحفظ
  const confirmSaveChanges = async () => {
    setIsSubmitting(true);
    try {
      const formData = form.getValues();
      
      // إنشاء البيانات للإرسال - فقط الحقول المتغيرة أو المحددة
      const updateData: any = {};
      
      changesList.forEach(change => {
        updateData[change.field] = formData[change.field as keyof typeof formData];
      });

      // تحويل التواريخ إذا لزم الأمر
      if (updateData.start_date && updateData.start_date instanceof Date) {
        updateData.start_date = updateData.start_date.toISOString();
      }
      if (updateData.end_date && updateData.end_date instanceof Date) {
        updateData.end_date = updateData.end_date.toISOString();
      }

      await agreementService.updateAgreement({ id: id!, data: updateData });
      
      // تحديث البيانات الأصلية
      setOriginalData({ ...originalData, ...updateData });
      setHasUnsavedChanges(false);
      setChangesList([]);
      setShowChangeSummary(false);
      
      toast.success('تم حفظ التغييرات بنجاح');
    } catch (error) {
      console.error('خطأ في حفظ التغييرات:', error);
      toast.error('فشل في حفظ التغييرات');
    } finally {
      setIsSubmitting(false);
    }
  };

  // دالة إلغاء التغييرات
  const cancelChanges = () => {
    setShowChangeSummary(false);
    setChangesList([]);
  };

  // دوال التسميات العربية
  const getAgreementTypeLabel = (type: string) => {
    const translations: { [key: string]: string } = {
      'short_term': 'قصير المدى',
      'lease_to_own': 'إيجار منتهي بالتملك'
    };
    return translations[type] || type;
  };

  const getStatusLabel = (status: string) => {
    const translations: { [key: string]: string } = {
      'active': 'نشط',
      'closed': 'مكتمل',
      'cancelled': 'ملغي'
    };
    return translations[status] || status;
  };

  const getPaymentFrequencyLabel = (frequency: string) => {
    const translations: { [key: string]: string } = {
      'weekly': 'أسبوعي',
      'monthly': 'شهري',
      'quarterly': 'ربع سنوي'
    };
    return translations[frequency] || frequency;
  };

  // دالة تنسيق القيم للعرض
  const formatValueForDisplay = (field: string, value: any) => {
    if (value === null || value === undefined) return 'غير محدد';
    
    switch (field) {
      case 'agreement_type':
        return getAgreementTypeLabel(value);
      case 'status':
        return getStatusLabel(value);
      case 'payment_frequency':
        return getPaymentFrequencyLabel(value);
      case 'start_date':
      case 'end_date':
        if (value instanceof Date) {
          return format(value, 'dd MMMM yyyy', { locale: ar });
        }
        return value;
      case 'total_amount':
      case 'rent_amount':
      case 'deposit_amount':
      case 'daily_late_fee':
        return `${value} ر.ق`;
      default:
        return value;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96" dir="rtl">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-lg">جاري تحميل بيانات العقد...</p>
        </div>
      </div>
    );
  }

  if (!isEditMode) {
    return (
      <div className="text-center p-8" dir="rtl">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">خطأ في معرف العقد</h3>
        <p className="text-muted-foreground mb-4">لم يتم العثور على العقد المطلوب تعديله</p>
        <Button onClick={() => navigate('/agreements')}>العودة إلى العقود</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between flex-row-reverse">
        <div>
          <h1 className="text-3xl font-bold text-right">تعديل العقد</h1>
          <p className="text-muted-foreground text-right mt-1">
            تعديل بيانات العقد رقم: {originalData?.agreement_number || id}
          </p>
          {hasUnsavedChanges && (
            <div className="flex items-center gap-2 mt-2 flex-row-reverse">
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {changesList.length} تغيير غير محفوظ
              </Badge>
            </div>
          )}
        </div>
        
        <div className="flex gap-2 flex-row-reverse">
          <Button variant="outline" onClick={() => navigate(`/agreements/${id}`)}>
            <Eye className="w-4 h-4 ml-2" />
            عرض التفاصيل
          </Button>
          {hasUnsavedChanges && (
            <>
              <Button variant="outline" onClick={resetForm}>
                <Undo className="w-4 w-4 ml-2" />
                إلغاء التغييرات
              </Button>
              <Button onClick={showChangesSummary} className="bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4 ml-2" />
                حفظ التغييرات ({changesList.length})
              </Button>
            </>
          )}
        </div>
      </div>

      {/* نموذج التعديل */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 flex-row-reverse">
            <Edit3 className="h-5 w-5" />
            تعديل بيانات العقد
          </CardTitle>
          <CardDescription className="text-right">
            يمكنك تعديل أي من البيانات التالية. ستظل البيانات غير المعدلة كما هي.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" dir="rtl">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">التفاصيل الأساسية</TabsTrigger>
                <TabsTrigger value="financial">البيانات المالية</TabsTrigger>
                <TabsTrigger value="schedule">جدولة الدفع</TabsTrigger>
              </TabsList>

              {/* تبويب التفاصيل الأساسية */}
              <TabsContent value="details" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* رقم العقد */}
                  <FormField
                    control={form.control}
                    name="agreement_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-right">رقم العقد</FormLabel>
                        <FormControl>
                          <Input {...field} className="text-right" placeholder="رقم العقد" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* نوع العقد */}
                  <FormField
                    control={form.control}
                    name="agreement_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-right">نوع العقد</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                          <FormControl>
                            <SelectTrigger className="text-right">
                              <SelectValue placeholder="اختر نوع العقد" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="short_term">قصير المدى</SelectItem>
                            <SelectItem value="lease_to_own">إيجار منتهي بالتملك</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* حالة العقد */}
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-right">حالة العقد</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                          <FormControl>
                            <SelectTrigger className="text-right">
                              <SelectValue placeholder="اختر حالة العقد" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">نشط</SelectItem>
                            <SelectItem value="closed">مكتمل</SelectItem>
                            <SelectItem value="cancelled">ملغي</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* تواريخ العقد */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* تاريخ البداية */}
                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-right">تاريخ بداية العقد</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-between text-right font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP", { locale: ar })
                                ) : (
                                  <span>اختر تاريخ البداية</span>
                                )}
                                <Calendar className="mr-2 h-4 w-4" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date("1900-01-01")}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* تاريخ النهاية */}
                  <FormField
                    control={form.control}
                    name="end_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-right">تاريخ نهاية العقد</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-between text-right font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP", { locale: ar })
                                ) : (
                                  <span>اختر تاريخ النهاية</span>
                                )}
                                <Calendar className="mr-2 h-4 w-4" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date("1900-01-01")}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* ملاحظات */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-right">ملاحظات</FormLabel>
                      <FormControl>
                        <Textarea {...field} className="text-right" placeholder="أدخل أي ملاحظات إضافية" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* تبويب البيانات المالية */}
              <TabsContent value="financial" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* مبلغ الإيجار */}
                  <FormField
                    control={form.control}
                    name="rent_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-right">مبلغ الإيجار الشهري (ر.ق)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            className="text-right" 
                            placeholder="0" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* مبلغ الضمان */}
                  <FormField
                    control={form.control}
                    name="deposit_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-right">مبلغ الضمان (ر.ق)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            className="text-right" 
                            placeholder="0" 
                          />
                        </FormControl>
                        <FormDescription className="text-right">
                          اختياري - يمكن الاحتفاظ بالقيمة الحالية دون تغيير
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* المبلغ الإجمالي */}
                  <FormField
                    control={form.control}
                    name="total_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-right">المبلغ الإجمالي (ر.ق)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            className="text-right" 
                            placeholder="0" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* رسوم التأخير */}
                  <FormField
                    control={form.control}
                    name="daily_late_fee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-right">رسوم التأخير اليومية (ر.ق)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            className="text-right" 
                            placeholder="120" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* تبويب جدولة الدفع */}
              <TabsContent value="schedule" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* تكرار الدفع */}
                  <FormField
                    control={form.control}
                    name="payment_frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-right">تكرار الدفع</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                          <FormControl>
                            <SelectTrigger className="text-right">
                              <SelectValue placeholder="اختر تكرار الدفع" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="weekly">أسبوعي</SelectItem>
                            <SelectItem value="monthly">شهري</SelectItem>
                            <SelectItem value="quarterly">ربع سنوي</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* يوم الدفع */}
                  <FormField
                    control={form.control}
                    name="payment_day"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-right">يوم الدفع من الشهر</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            max="31"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            className="text-right" 
                            placeholder="1" 
                          />
                        </FormControl>
                        <FormDescription className="text-right">
                          اليوم من الشهر المحدد للدفع (1-31)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </Form>
        </CardContent>
      </Card>

      {/* حوار ملخص التغييرات المتطور */}
      <ChangeSummaryDialog
        open={showChangeSummary}
        onOpenChange={setShowChangeSummary}
        changesList={changesList}
        isSubmitting={isSubmitting}
        onConfirm={confirmSaveChanges}
        onCancel={cancelChanges}
      />
    </div>
  );
};

export default AgreementEditor;
