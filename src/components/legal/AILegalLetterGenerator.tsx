import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Brain, 
  FileText, 
  Send, 
  Download, 
  Eye, 
  CheckCircle, 
  AlertTriangle,
  Car,
  Calendar,
  DollarSign,
  User,
  Phone,
  MapPin,
  Clock,
  Shield,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { LegalAIService, LegalLetterRequest } from '@/services/LegalAIService';
import { useCustomers } from '@/hooks/use-customers';
import { errorLogger } from '@/lib/errors/error-logger';

interface CustomerData {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  nationality?: string;
}

interface FormData {
  customer_id: string;
  vehicle_license_plate: string;
  amount_due: string;
  incident_date: string;
  additional_notes: string;
  overdue_days: string;
  damage_cost: string;
  policy_reference: string;
  contract_clause_reference: string;
}

const AILegalLetterGenerator = () => {
  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
  const [generatedLetter, setGeneratedLetter] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState<FormData>({
    customer_id: '',
    vehicle_license_plate: '',
    amount_due: '',
    incident_date: '',
    additional_notes: '',
    overdue_days: '',
    damage_cost: '',
    policy_reference: '',
    contract_clause_reference: ''
  });

  // Hooks for data fetching
  const { customers, isLoading: loadingCustomers, error, refreshCustomers } = useCustomers();

  // Legal AI Service
  const legalAIService = new LegalAIService();

  // Template definitions - جميع السيناريوهات المطلوبة
  const LETTER_TEMPLATES = {
    // 🟦 أولاً: خطابات موجهة إلى المستأجرين
    'contract_violation_notice': {
      name: 'إخطار بانتهاك شروط الاتفاقية',
      description: 'إخطار رسمي بانتهاك شروط وأحكام عقد الإيجار',
      category: 'tenant_notices'
    },
    'rent_payment_demand': {
      name: 'مطالبة بسداد قيمة الإيجار المتأخرة',
      description: 'مطالبة رسمية بسداد الإيجار المتأخر مع احتساب الغرامات',
      category: 'tenant_notices'
    },
    'contract_termination_notice': {
      name: 'إشعار بفسخ العقد بسبب الإخلال',
      description: 'إشعار رسمي بفسخ العقد لعدم الالتزام بالشروط',
      category: 'tenant_notices'
    },
    'final_legal_warning': {
      name: 'إنذار نهائي قبل اتخاذ إجراء قانوني',
      description: 'إنذار أخير قبل رفع الدعوى القضائية أو الإجراءات القانونية',
      category: 'tenant_notices'
    },
    'vehicle_policy_violation': {
      name: 'إشعار بمخالفة سياسة استخدام المركبة',
      description: 'إشعار بمخالفة شروط الاستخدام الآمن للمركبة',
      category: 'tenant_notices'
    },
    'rental_extension_rejection': {
      name: 'خطاب رفض طلب تمديد فترة الإيجار',
      description: 'رفض طلب التمديد مع توضيح الأسباب',
      category: 'tenant_notices'
    },
    'late_fees_demand': {
      name: 'مطالبة بسداد غرامات التأخير',
      description: 'مطالبة بسداد غرامات التأخير المتراكمة',
      category: 'tenant_notices'
    },
    'special_cleaning_charge': {
      name: 'إشعار بتحميل تكاليف تنظيف خاص',
      description: 'إشعار بتحميل تكاليف التنظيف الإضافية',
      category: 'tenant_notices'
    },
    'traffic_fines_demand': {
      name: 'مطالبة بسداد غرامات مرورية',
      description: 'مطالبة بسداد المخالفات المرورية المسجلة على المركبة',
      category: 'tenant_notices'
    },
    'damage_repair_demand': {
      name: 'مطالبة بسداد تكاليف إصلاح الأضرار',
      description: 'مطالبة بتكاليف إصلاح الأضرار التي لحقت بالمركبة',
      category: 'tenant_notices'
    },
    'parts_replacement_demand': {
      name: 'مطالبة بقيمة القطع المستبدلة',
      description: 'مطالبة بتكلفة قطع الغيار المستبدلة',
      category: 'tenant_notices'
    },
    'deposit_refund_rejection': {
      name: 'خطاب رفض استرداد مبلغ الضمان',
      description: 'رفض استرداد الضمان مع توضيح المخصومات',
      category: 'tenant_notices'
    },
    'insurance_clarification': {
      name: 'خطاب توضيح حول شروط التأمين',
      description: 'توضيح شروط وأحكام التأمين وحدود التغطية',
      category: 'tenant_notices'
    },
    'technical_inspection_failure': {
      name: 'إشعار بفشل المركبة في الفحص الفني',
      description: 'إشعار بعدم اجتياز الفحص الفني والإجراءات المطلوبة',
      category: 'tenant_notices'
    },
    'missing_items_demand': {
      name: 'مطالبة بإرجاع المفتاح الإضافي أو الوثائق',
      description: 'مطالبة بإرجاع العناصر المفقودة مع المركبة',
      category: 'tenant_notices'
    },
    'blacklist_notification': {
      name: 'إشعار بالتوقف عن التعامل وإدراج في القائمة السوداء',
      description: 'إشعار بإدراج العميل في القائمة السوداء',
      category: 'tenant_notices'
    },
    'vehicle_return_deadline': {
      name: 'إنذار بوجوب تسليم المركبة خلال مهلة محددة',
      description: 'إنذار بضرورة إرجاع المركبة خلال مهلة زمنية محددة',
      category: 'tenant_notices'
    },
    'compensation_claim_rejection': {
      name: 'خطاب رفض طلب التعويض',
      description: 'رفض طلب التعويض المقدم من العميل',
      category: 'tenant_notices'
    },
    'legal_department_transfer': {
      name: 'إشعار بتحويل الملف للقسم القانوني',
      description: 'إشعار بتحويل الملف للإدارة القانونية لاتخاذ الإجراءات',
      category: 'tenant_notices'
    },
    'driver_addition_rejection': {
      name: 'إشعار برفض إضافة سائق جديد',
      description: 'رفض طلب إضافة سائق إضافي للعقد',
      category: 'tenant_notices'
    },
    'contract_fees_clarification': {
      name: 'توضيح حول الرسوم المفروضة على العقد',
      description: 'توضيح تفصيلي للرسوم والمصاريف المطبقة',
      category: 'tenant_notices'
    },
    'contract_cancellation_rejection': {
      name: 'إشعار بعدم الموافقة على إلغاء العقد',
      description: 'رفض طلب إلغاء العقد مع توضيح الأسباب',
      category: 'tenant_notices'
    },
    'uninsured_damage_liability': {
      name: 'خطاب تحميل مسؤولية الأضرار غير المؤمنة',
      description: 'تحميل المستأجر مسؤولية الأضرار غير المشمولة بالتأمين',
      category: 'tenant_notices'
    },
    'facilities_cancellation': {
      name: 'إخطار بإلغاء التسهيلات بسبب سوء الالتزام',
      description: 'إلغاء التسهيلات الممنوحة بسبب عدم الالتزام',
      category: 'tenant_notices'
    },
    'policy_update_notification': {
      name: 'إشعار بتحديث سياسة الشركة',
      description: 'إشعار بالتحديثات على سياسات وإجراءات الشركة',
      category: 'tenant_notices'
    },
    'mandatory_maintenance_notice': {
      name: 'خطاب إلزامي بإجراء الصيانة الدورية',
      description: 'إلزام المستأجر بإجراء الصيانة الدورية المطلوبة',
      category: 'tenant_notices'
    },
    'legal_vehicle_recovery': {
      name: 'إخطار بالمطالبة القانونية لاسترداد المركبة',
      description: 'إخطار بالإجراءات القانونية لاسترداد المركبة',
      category: 'tenant_notices'
    },
    'vehicle_freeze_notice': {
      name: 'إشعار بتحويل المركبة إلى "ممنوع التصرف بها"',
      description: 'إشعار بتجميد المركبة ومنع التصرف بها',
      category: 'tenant_notices'
    },
    'contract_obligations_demand': {
      name: 'مطالبة بتنفيذ الالتزامات المتعاقد عليها',
      description: 'مطالبة بتنفيذ جميع الالتزامات المنصوص عليها في العقد',
      category: 'tenant_notices'
    },

    // 🟨 ثانياً: خطابات موجهة إلى مركز الشرطة
    'police_theft_report': {
      name: 'بلاغ رسمي بسرقة أو اختفاء مركبة',
      description: 'بلاغ للشرطة عن سرقة أو اختفاء مركبة مؤجرة',
      category: 'police_reports'
    },
    'police_vehicle_alert': {
      name: 'طلب تعميم على مركبة غير مستردة',
      description: 'طلب تعميم أمني على مركبة لم يتم إرجاعها',
      category: 'police_reports'
    },
    'travel_ban_request': {
      name: 'طلب منع سفر لمستأجر متهرب',
      description: 'طلب منع سفر للمستأجر المتهرب من السداد',
      category: 'police_reports'
    },
    'incident_documentation': {
      name: 'طلب إثبات حادث أو ضرر',
      description: 'طلب توثيق حادث أو ضرر لحق بالمركبة',
      category: 'police_reports'
    },
    'late_delivery_documentation': {
      name: 'خطاب توثيق واقعة تسليم متأخر',
      description: 'توثيق واقعة التسليم المتأخر للمركبة',
      category: 'police_reports'
    },
    'legal_support_request': {
      name: 'خطاب دعم مطالبة قانونية ضد مستأجر',
      description: 'طلب دعم الشرطة في الدعوى القانونية',
      category: 'police_reports'
    },
    'vehicle_recovery_request': {
      name: 'طلب استرداد مركبة بموجب العقد',
      description: 'طلب مساعدة الشرطة في استرداد مركبة مؤجرة',
      category: 'police_reports'
    },
    'criminal_background_inquiry': {
      name: 'خطاب استفسار عن موقف جنائي للمستأجر',
      description: 'استفسار عن السجل الجنائي للمستأجر',
      category: 'police_reports'
    },
    'repeated_violation_report': {
      name: 'خطاب إثبات مخالفة مرور متكررة',
      description: 'إثبات حالات المخالفات المرورية المتكررة',
      category: 'police_reports'
    },
    'court_transfer_request': {
      name: 'طلب تحويل ملف للقضاء المختص',
      description: 'طلب تحويل القضية للمحكمة المختصة',
      category: 'police_reports'
    },

    // 🟥 ثالثاً: خطابات موجهة إلى وكالات السيارات / الورش / التأمين
    'warranty_repair_request': {
      name: 'طلب إصلاح مركبة ضمن الضمان',
      description: 'طلب إصلاح عيوب مشمولة بالضمان',
      category: 'service_providers'
    },
    'insurance_repair_claim': {
      name: 'مطالبة بتحمل تكلفة إصلاح ضمن التأمين',
      description: 'مطالبة شركة التأمين بتغطية تكاليف الإصلاح',
      category: 'service_providers'
    },
    'insurance_cancellation': {
      name: 'إشعار بإلغاء بوليصة تأمين',
      description: 'إشعار بإلغاء أو تعديل بوليصة التأمين',
      category: 'service_providers'
    },
    'parts_quotation_request': {
      name: 'طلب عرض أسعار لقطع غيار',
      description: 'طلب عرض أسعار لقطع الغيار المطلوبة',
      category: 'service_providers'
    },
    'workshop_approval': {
      name: 'خطاب اعتماد ورشة للإصلاح',
      description: 'اعتماد ورشة إصلاح للتعامل معها',
      category: 'service_providers'
    },
    'technical_report_request': {
      name: 'طلب تقرير فني مفصل عن حالة المركبة',
      description: 'طلب تقرير فني شامل عن حالة المركبة',
      category: 'service_providers'
    },
    'repair_invoice_objection': {
      name: 'خطاب اعتراض على فاتورة إصلاح',
      description: 'اعتراض على فاتورة إصلاح مع طلب إعادة النظر',
      category: 'service_providers'
    },
    'maintenance_file_request': {
      name: 'طلب ملف صيانة للمركبة',
      description: 'طلب سجل الصيانة الكامل للمركبة',
      category: 'service_providers'
    },
    'warranty_extension_request': {
      name: 'طلب تمديد ضمان المركبة',
      description: 'طلب تمديد فترة الضمان للمركبة',
      category: 'service_providers'
    },
    'fleet_insurance_quotation': {
      name: 'طلب تقديم عرض تأمين سنوي لمركبات الأسطول',
      description: 'طلب عرض تأمين شامل لجميع مركبات الأسطول',
      category: 'service_providers'
    },

    // 🟩 رابعاً: خطابات داخلية / إدارية
    'employee_vehicle_assignment': {
      name: 'خطاب تكليف موظف باستلام مركبة',
      description: 'تكليف موظف بمهمة استلام مركبة من عميل',
      category: 'internal_admin'
    },
    'interdepartmental_handover': {
      name: 'محضر تسليم مركبة بين الإدارات',
      description: 'محضر رسمي لتسليم مركبة بين الأقسام',
      category: 'internal_admin'
    },
    'legal_transfer_notice': {
      name: 'إشعار تحويل عميل إلى الإدارة القانونية',
      description: 'إشعار داخلي بتحويل ملف العميل للقسم القانوني',
      category: 'internal_admin'
    },
    'discount_approval': {
      name: 'خطاب موافقة داخلية على خصم مالي',
      description: 'موافقة إدارية على منح خصم أو تسهيل مالي',
      category: 'internal_admin'
    },
    'contract_policy_update': {
      name: 'إشعار بتعديل بنود عقد حسب سياسة جديدة',
      description: 'إشعار بتحديث شروط العقود حسب السياسات الجديدة',
      category: 'internal_admin'
    },
    'collection_memo': {
      name: 'مذكرة لإدارة التحصيل بشأن متأخرات',
      description: 'مذكرة داخلية بخصوص المتأخرات وإجراءات التحصيل',
      category: 'internal_admin'
    },
    'employee_authorization': {
      name: 'خطاب تفويض موظف لاستلام مستحقات',
      description: 'تفويض موظف لاستلام مبالغ مالية أو وثائق',
      category: 'internal_admin'
    },
    'delivery_scheduling': {
      name: 'إشعار إلى قسم العمليات بجدولة تسليم',
      description: 'إشعار بجدولة تسليم أو استلام مركبات',
      category: 'internal_admin'
    },
    'account_freeze_notice': {
      name: 'إشعار بتجميد حساب عميل بسبب الإخلال',
      description: 'إشعار داخلي بتجميد حساب عميل متعثر',
      category: 'internal_admin'
    },
    'file_closure_request': {
      name: 'طلب إغلاق ملف إيجار بعد التحصيل الكامل',
      description: 'طلب إغلاق ملف العميل بعد تحصيل جميع المستحقات',
      category: 'internal_admin'
    }
  };

  // Handle customer selection
  const handleCustomerChange = (customerId: string) => {
    const customer = customers?.find(c => c.id === customerId);
    if (customer) {
      setSelectedCustomer({
        id: customer.id || '',
        name: customer.full_name || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        nationality: customer.nationality || ''
      });
      setFormData(prev => ({
        ...prev,
        customer_id: customer.id || ''
      }));
    }
  };

  // Handle template selection
  const handleTemplateChange = (templateKey: string) => {
    setSelectedTemplate(templateKey);
    const template = LETTER_TEMPLATES[templateKey as keyof typeof LETTER_TEMPLATES];
    
    if (template) {
      let defaultAmount = '';
      let defaultClause = '';
      
      switch (template.category) {
        case 'tenant_notices':
          // قيم افتراضية للخطابات الموجهة للمستأجرين
          if (templateKey.includes('rent_payment') || templateKey.includes('late_fees')) {
            defaultAmount = '1250'; // مبلغ إيجار شهري
            defaultClause = 'المادة 8: يلتزم المستأجر بدفع الإيجار الشهري في المواعيد المحددة، وفي حالة التأخير يتم تطبيق غرامة قدرها 100 ريال قطري عن كل يوم تأخير.';
          } else if (templateKey.includes('damage') || templateKey.includes('repair')) {
            defaultAmount = '800'; 
            defaultClause = 'المادة 12: يتحمل المستأجر كامل تكاليف إصلاح أي أضرار تلحق بالمركبة أثناء فترة الإيجار.';
          } else if (templateKey.includes('traffic_fines')) {
            defaultAmount = '500';
            defaultClause = 'المادة 9: يتحمل المستأجر جميع المخالفات المرورية والغرامات المترتبة عليها خلال فترة الإيجار.';
          } else if (templateKey.includes('contract_termination') || templateKey.includes('cancellation')) {
            defaultAmount = '5000';
            defaultClause = 'المادة 15: في حالة فسخ العقد من قبل المستأجر قبل انتهاء المدة، يتوجب عليه دفع غرامة الفسخ المحددة في العقد.';
          } else {
            defaultClause = 'يرجى الرجوع إلى شروط وأحكام العقد المُوقع بين الطرفين.';
          }
          break;
          
        case 'police_reports':
          // قيم افتراضية للخطابات الموجهة للشرطة
          defaultAmount = '0'; // عادة لا توجد مبالغ مالية في البلاغات
          defaultClause = 'المادة (349) من القانون رقم 11 لسنة 2004 - قانون العقوبات القطري: يُعاقب كل من امتنع بغير مبرر عن دفع ما استحق عليه من أجرة وسيلة نقل معدة للإيجار.';
          break;
          
        case 'service_providers':
          // قيم افتراضية للخطابات الموجهة لمقدمي الخدمات
          if (templateKey.includes('warranty') || templateKey.includes('insurance')) {
            defaultAmount = '0';
            defaultClause = 'حسب شروط وأحكام الضمان/التأمين المعمول بها.';
          } else if (templateKey.includes('repair') || templateKey.includes('parts')) {
            defaultAmount = '1500';
            defaultClause = 'حسب عرض الأسعار المقدم من الورشة المعتمدة.';
          }
          break;
          
        case 'internal_admin':
          // قيم افتراضية للخطابات الداخلية
          defaultAmount = '0';
          defaultClause = 'حسب السياسات والإجراءات الداخلية للشركة.';
          break;

        default:
          defaultClause = 'يرجى الرجوع إلى شروط وأحكام العقد المُوقع.';
      }
      
      setFormData(prev => ({
        ...prev,
        amount_due: defaultAmount,
        contract_clause_reference: defaultClause,
        policy_reference: `شروط وأحكام شركة الأعراف لتأجير السيارات - ${template.name}`
      }));
    }
  };

  // Generate letter
  const handleGenerateLetter = async () => {
    if (!selectedTemplate || !selectedCustomer) {
      toast.error('يرجى اختيار القالب والعميل');
      return;
    }

    setIsGenerating(true);
    try {
      const template = LETTER_TEMPLATES[selectedTemplate as keyof typeof LETTER_TEMPLATES];
      
      const enhancedContext = {
        customer: {
          id: selectedCustomer.id,
          name: selectedCustomer.name,
          phone: selectedCustomer.phone,
          email: selectedCustomer.email || '',
          address: selectedCustomer.address || '',
          nationality: selectedCustomer.nationality || ''
        },
        financial: {
          amount_due: parseFloat(formData.amount_due) || 0,
          overdue_days: parseInt(formData.overdue_days) || 0,
          damage_cost: parseFloat(formData.damage_cost) || 0
        },
        contract_reference: {
          policy_reference: formData.policy_reference,
          contract_clause: formData.contract_clause_reference
        },
        company_info: {
          name: 'شركة الأعراف لتأجير السيارات',
          commercial_registration: 'سجل تجاري رقم 123456',
          contact: 'هاتف: +974 1234 5678 | البريد الإلكتروني: info@alaraf-rental.com'
        }
      };

      const request: LegalLetterRequest = {
        type: template.name,
        reason: template.description,
        customPrompt: formData.additional_notes,
        language: 'ar'
      };

      const result = await legalAIService.generateLetter(request, enhancedContext as any);
      
      if (result.success && result.data) {
        setGeneratedLetter(result.data.content);
        setShowPreview(true);
        toast.success('تم إنشاء الخطاب بنجاح');
      } else {
        throw new Error(result.error || 'فشل في إنشاء الخطاب');
      }
    } catch (error) {
      errorLogger.logError(error as Error, {
        context: 'AILegalLetterGenerator.handleGenerateLetter',
        templateType: selectedTemplate,
        customerId: selectedCustomer?.id,
        timestamp: new Date().toISOString()
      });
      toast.error('حدث خطأ في إنشاء الخطاب');
    } finally {
      setIsGenerating(false);
    }
  };

  // Group templates by category
  const groupedTemplates = Object.entries(LETTER_TEMPLATES).reduce((acc, [key, template]) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push({ key, ...template });
    return acc;
  }, {} as Record<string, any[]>);

  const categoryNames = {
    tenant_notices: '🟦 خطابات موجهة إلى المستأجرين',
    police_reports: '🟨 خطابات موجهة إلى مركز الشرطة', 
    service_providers: '🟥 خطابات موجهة إلى وكالات السيارات / الورش / التأمين',
    internal_admin: '🟩 خطابات داخلية / إدارية'
  };

  return (
    <div className="space-y-6 p-6" dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="h-8 w-8 text-blue-600" />
            <div>
          <h1 className="text-2xl font-bold text-gray-900">مولد الخطابات القانونية</h1>
          <p className="text-gray-600">نظام متكامل لإنشاء الخطابات القانونية للعملاء</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-reverse space-x-8 mb-8" dir="rtl">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step <= currentStep
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step}
            </div>
            {step < 4 && (
              <div
                className={`w-16 h-1 mr-4 ${
                  step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <Tabs value={currentStep.toString()} className="w-full">
        {/* Step 1: Customer Selection */}
        <TabsContent value="1" className="space-y-6">
        <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                اختيار العميل
            </CardTitle>
              <CardDescription>
                اختر العميل لإنشاء الخطاب القانوني
              </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                <Label htmlFor="customer">العميل</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        await refreshCustomers();
                        toast.success('تم تحديث قائمة العملاء');
                      } catch (error) {
                        toast.error('فشل في تحديث قائمة العملاء');
                      }
                    }}
                    disabled={loadingCustomers}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${loadingCustomers ? 'animate-spin' : ''}`} />
                    تحديث
                  </Button>
                </div>
                
                {/* Error State */}
                {error && !loadingCustomers && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-medium">خطأ في تحميل العملاء</span>
                    </div>
                    <p className="text-sm text-red-600 mt-1">
                      {error?.message || 'حدث خطأ غير معروف'}
                    </p>
                  </div>
                )}

                <Select 
                  onValueChange={handleCustomerChange} 
                  disabled={loadingCustomers}
                  value={selectedCustomer?.id || ''}
                >
                  <SelectTrigger className="text-right h-12" dir="rtl">
                    <SelectValue 
                      placeholder={
                        loadingCustomers 
                          ? "جاري تحميل العملاء..." 
                          : (!customers || customers.length === 0)
                            ? "لا توجد عملاء متاحين - اضغط تحديث"
                            : "اختر العميل من القائمة"
                      } 
                    />
                  </SelectTrigger>
                  <SelectContent className="text-right max-h-60" dir="rtl">
                    {customers && customers.length > 0 ? (
                      customers.map((customer) => (
                        <SelectItem 
                          key={customer.id || Math.random()} 
                          value={customer.id || ''} 
                          className="text-right cursor-pointer hover:bg-gray-100"
                        >
                          <div className="flex flex-col text-right w-full py-1">
                            <span className="font-medium text-gray-900">
                              {customer.full_name || 'اسم غير محدد'}
                            </span>
                            <span className="text-sm text-gray-500 ltr-text" dir="ltr">
                            {customer.phone || 'رقم غير محدد'}
                          </span>
                            {customer.email && (
                              <span className="text-xs text-gray-400 ltr-text" dir="ltr">
                                {customer.email}
                              </span>
                            )}
                        </div>
                      </SelectItem>
                      ))
                    ) : !loadingCustomers ? (
                      <SelectItem value="no-customers" disabled>
                        لا توجد عملاء متاحين
                      </SelectItem>
                    ) : null}
                  </SelectContent>
                </Select>

                {/* Loading State */}
                {loadingCustomers && (
                  <div className="flex items-center gap-2 text-blue-600 text-sm">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    جاري تحميل العملاء...
                  </div>
                )}

                {/* Success State */}
                {customers && customers.length > 0 && !loadingCustomers && !error && (
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <CheckCircle className="h-4 w-4" />
                    تم العثور على {customers.length} عميل
                  </div>
                )}
              </div>

              {selectedCustomer && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">بيانات العميل المحددة:</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="font-medium">الاسم:</span> {selectedCustomer.name}</div>
                        <div>
                      <span className="font-medium">الهاتف:</span> 
                      <span className="phone-number phone-number-ltr" dir="ltr"> {selectedCustomer.phone}</span>
                    </div>
                    <div><span className="font-medium">البريد:</span> {selectedCustomer.email || 'غير محدد'}</div>
                    <div><span className="font-medium">العنوان:</span> {selectedCustomer.address || 'غير محدد'}</div>
                  </div>
                </div>
              )}
                
                  <Button 
                onClick={() => setCurrentStep(2)} 
                disabled={!selectedCustomer}
                className="w-full"
                  >
                التالي: اختيار نوع الخطاب
                  </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 2: Template Selection */}
        <TabsContent value="2" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                اختيار نوع الخطاب القانوني
              </CardTitle>
              <CardDescription>
                اختر نوع الخطاب المناسب لحالتك
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(groupedTemplates).map(([category, templates]) => (
                <div key={category} className="space-y-2">
                  <h3 className="font-semibold text-gray-900">
                    {categoryNames[category as keyof typeof categoryNames]}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2" dir="rtl">
                    {templates.map((template) => (
                      <div
                        key={template.key}
                        className={`p-3 border rounded-lg cursor-pointer transition-all text-right ${
                          selectedTemplate === template.key
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleTemplateChange(template.key)}
                      >
                        <div className="font-medium text-sm text-right">{template.name}</div>
                        <div className="text-xs text-gray-500 mt-1 text-right">{template.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex gap-2 mt-6" dir="rtl">
                  <Button 
                  onClick={() => setCurrentStep(3)} 
                  disabled={!selectedTemplate}
                  className="flex-1"
                >
                  التالي: تفاصيل الخطاب
                </Button>
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  السابق
                  </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 3: Details */}
        <TabsContent value="3" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                تفاصيل الخطاب
              </CardTitle>
              <CardDescription>
                أدخل التفاصيل المطلوبة للخطاب
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicle_license_plate">رقم لوحة المركبة</Label>
                  <Input
                    id="vehicle_license_plate"
                    value={formData.vehicle_license_plate}
                    onChange={(e) => setFormData(prev => ({ ...prev, vehicle_license_plate: e.target.value }))}
                    placeholder="رقم اللوحة"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount_due">المبلغ المستحق (ريال)</Label>
                  <Input
                    id="amount_due"
                    type="number"
                    value={formData.amount_due}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount_due: e.target.value }))}
                    placeholder="المبلغ بالريال القطري"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="incident_date">تاريخ الحادثة</Label>
                  <Input
                    id="incident_date"
                    type="date"
                    value={formData.incident_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, incident_date: e.target.value }))}
                  />
                          </div>

                <div className="space-y-2">
                  <Label htmlFor="overdue_days">عدد أيام التأخير</Label>
                  <Input
                    id="overdue_days"
                    type="number"
                    value={formData.overdue_days}
                    onChange={(e) => setFormData(prev => ({ ...prev, overdue_days: e.target.value }))}
                    placeholder="عدد الأيام"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="additional_notes">ملاحظات إضافية</Label>
                <Textarea
                  id="additional_notes"
                  value={formData.additional_notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, additional_notes: e.target.value }))}
                  rows={3}
                  placeholder="أي تفاصيل إضافية..."
                />
              </div>

              <div className="flex gap-2 mt-6" dir="rtl">
                <Button 
                  onClick={() => setCurrentStep(4)} 
                  className="flex-1"
                >
                  التالي: إنشاء الخطاب
                </Button>
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  السابق
                </Button>
              </div>
          </CardContent>
        </Card>
        </TabsContent>

        {/* Step 4: Generate Letter */}
        <TabsContent value="4" className="space-y-6">
        <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                إنشاء الخطاب النهائي
            </CardTitle>
              <CardDescription>
                مراجعة البيانات وإنشاء الخطاب القانوني
              </CardDescription>
          </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <h3 className="font-semibold text-gray-900">ملخص الخطاب:</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="font-medium">العميل:</span> {selectedCustomer?.name}</div>
                  <div><span className="font-medium">نوع الخطاب:</span> {selectedTemplate ? LETTER_TEMPLATES[selectedTemplate as keyof typeof LETTER_TEMPLATES]?.name : ''}</div>
                  <div><span className="font-medium">المركبة:</span> {formData.vehicle_license_plate}</div>
                  <div><span className="font-medium">المبلغ:</span> {formData.amount_due} ريال</div>
                </div>
                </div>

              <div className="flex gap-2" dir="rtl">
                  <Button
                  onClick={handleGenerateLetter}
                  disabled={isGenerating}
                  className="flex-1"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                      جاري إنشاء الخطاب...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 ml-2" />
                      إنشاء الخطاب القانوني
                    </>
                  )}
                  </Button>
                <Button variant="outline" onClick={() => setCurrentStep(3)}>
                  السابق
                  </Button>
              </div>
          </CardContent>
        </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              معاينة الخطاب القانوني
            </DialogTitle>
            <DialogDescription>
              راجع الخطاب قبل الحفظ أو الطباعة
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-6 bg-white border rounded-lg min-h-[400px] whitespace-pre-wrap font-mono text-sm">
              {generatedLetter || 'لم يتم إنشاء الخطاب بعد'}
      </div>

            <div className="flex gap-2 justify-start" dir="rtl">
              <Button onClick={() => window.print()}>
                <Download className="h-4 w-4 ml-2" />
                طباعة/حفظ
              </Button>
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                إغلاق
                  </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AILegalLetterGenerator;  

