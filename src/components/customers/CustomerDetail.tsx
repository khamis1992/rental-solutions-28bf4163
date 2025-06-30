import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Card, CardContent, 
  Badge, Button, 
  Tabs, TabsContent, TabsList, TabsTrigger,
  Textarea,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui";
import { FormField } from "@/components/ui/form-components";
import { useToast } from "@/components/ui/use-toast";
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Edit, Trash2, Mail, Phone, MapPin, FileText, Clock, Save, X, User, Download } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';
import CustomerTrafficFines from '../traffic-fines/CustomerTrafficFines';
import CustomerLegalObligationsPage from '../legal/CustomerLegalObligationsPage';
import { CustomerFinancialTab } from './CustomerFinancialTab';
import { Customer } from '@/types/customer.types';
import { useTranslation } from '@/utils/translation-helper';
import { useLanguage } from '@/contexts/LanguageContext';
import { generateModernAgreementPDF } from '@/utils/modern-agreement-pdf';
import { useCustomerService } from '@/hooks/services/useCustomerService';

interface CustomerDetailProps {
  customerId: string;
}

// Function to handle customer data updates
const updateCustomer = (id: string, data: any) => {
  return supabase
    .from('profiles')
    .update(data)
    .eq('id', id)
    .then(({ data, error }) => {
      if (error) throw error;
      return data;
    });
};

// Helper to format phone number as +974 رقم الهاتف
function formatQatarPhone(phone?: string) {
  if (!phone) return 'غير متوفر';
  let num = phone.trim().replace(/\D/g, ''); // Remove non-digits
  if (num.startsWith('974')) num = num.slice(3);
  if (num.startsWith('0')) num = num.slice(1);
  return '+974' + num;
}

export const CustomerDetail: React.FC<CustomerDetailProps> = ({ customerId }) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { deleteCustomer } = useCustomerService();
  const navigate = useNavigate();

  // Add debugging console logs
  console.log("CustomerDetail: Rendered with customerId:", customerId);

  useEffect(() => {
    console.log("CustomerDetail: useEffect triggered with customerId:", customerId);
    
    const fetchCustomer = async () => {
      if (!customerId) {
        console.error("CustomerDetail: No customer ID provided");
        setError("No customer ID provided");
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        console.log("CustomerDetail: Fetching customer data for ID:", customerId);
        
        // Get customer and their agreements using maybeSingle instead of single to handle not found case
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            *,
            agreements:leases(
              id, 
              agreement_number, 
              start_date, 
              end_date, 
              status
            )
          `)
          .eq('id', customerId)
          .maybeSingle();

        if (error) {
          console.error("CustomerDetail: Error fetching customer:", error);
          setError(error.message);
          toast({
            title: "Error fetching customer",
            description: error.message,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        if (!data) {
          console.error("CustomerDetail: Customer not found for ID:", customerId);
          setError("Customer not found");
          toast({
            title: "Customer not found",
            description: "The requested customer could not be found",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        console.log("CustomerDetail: Customer data fetched successfully:", data);
        console.log("CustomerDetail: Checking id_card_image field:", data.id_card_image);
        console.log("CustomerDetail: All fields in data:", Object.keys(data));
        setCustomer(data);
        setNotes(data.notes || "");
        setIsLoading(false);
      } catch (error: any) {
        console.error("CustomerDetail: Unexpected error fetching customer:", error);
        setError(error.message);
        setIsLoading(false);
        toast({
          title: "Unexpected error",
          description: error.message,
          variant: "destructive",
        });
      }
    };

    if (customerId) {
      fetchCustomer();
    } else {
      setIsLoading(false);
      setError("No customer ID provided");
    }
  }, [customerId, toast]); // Proper dependency array

  // Handle customer updates
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await updateCustomer(id, data);
    },
    onSuccess: (_, variables) => {
      // Update local state after successful mutation
      if (customer) {
        setCustomer({
          ...customer,
          ...variables.data
        });
      }
      toast({
        title: language === 'ar' ? 'تم تحديث العميل' : 'Customer updated',
        description: language === 'ar' ? 'تم تحديث تفاصيل العميل بنجاح.' : 'Customer details have been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'فشل التحديث' : 'Update failed',
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Calculate derived values before early returns
  const activeAgreements = customer ? (customer as any).agreements?.filter(
    (agreement: any) => agreement.status === 'active'
  ).length || 0 : 0;

  const totalAgreements = customer ? (customer as any).agreements?.length || 0 : 0;

  // Mock user role check - you can replace this with actual role logic
  const getUserRole = () => {
    // This should come from your auth context or user profile
    // For now, returning 'admin' as default - replace with actual role logic
    return 'admin'; // possible values: 'admin', 'manager', 'staff', 'viewer'
  };

  const userRole = getUserRole();

  // Define tab visibility based on user roles
  const getVisibleTabs = () => {
    const allTabs = [
      {
        value: 'profile',
        label: language === 'ar' ? 'الملف الشخصي' : 'Profile',
        roles: ['admin', 'manager', 'staff', 'viewer'] // Everyone can see profile
      },
      {
        value: 'attachments',
        label: language === 'ar' ? 'المرفقات' : 'Attachments',
        roles: ['admin', 'manager', 'staff', 'viewer'] // Everyone can see attachments
      },
      {
        value: 'financials',
        label: language === 'ar' ? 'الماليات' : 'Financials',
        roles: ['admin', 'manager', 'staff'] // Financial access for relevant roles
      },
      {
        value: 'agreements',
        label: language === 'ar' ? 'العقود' : 'Agreements',
        roles: ['admin', 'manager', 'staff'] // Viewers cannot see agreements
      },
      {
        value: 'legal',
        label: language === 'ar' ? 'الالتزامات القانونية' : 'Legal Obligations',
        roles: ['admin', 'manager'] // Only admin and managers can see legal
      },
      {
        value: 'fines',
        label: language === 'ar' ? 'المخالفات المرورية' : 'Traffic Fines',
        roles: ['admin', 'manager', 'staff'] // Viewers cannot see fines
      }
    ];

    return allTabs.filter(tab => tab.roles.includes(userRole));
  };

  const visibleTabs = getVisibleTabs();

  // Ensure the default active tab is available to the user
  const defaultTab = visibleTabs.length > 0 ? visibleTabs[0].value : 'profile';
  
  // Update activeTab if current tab is not visible to user - MOVED BEFORE EARLY RETURNS
  useEffect(() => {
    const isActiveTabVisible = visibleTabs.some(tab => tab.value === activeTab);
    if (!isActiveTabVisible) {
      setActiveTab(defaultTab);
    }
  }, [activeTab, visibleTabs, defaultTab]);

  const handleUpdateCustomer = async (data: any) => {
    if (!customerId) return;
    updateMutation.mutate({ id: customerId, data });
  };

  const handleSaveNotes = () => {
    if (!customerId) return;
    updateMutation.mutate({ 
      id: customerId, 
      data: { notes } 
    });
    setEditingNotes(false);
  };

  const handleCancelEditNotes = () => {
    setNotes(customer?.notes || "");
    setEditingNotes(false);
  };

  const handleDelete = async () => {
    if (!customerId) return;
    if (!window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا العميل؟' : 'Are you sure you want to delete this customer?')) return;
    try {
      await deleteCustomer(customerId);
      toast({
        title: language === 'ar' ? 'تم حذف العميل بنجاح' : 'Customer deleted successfully',
        variant: 'default',
      });
      navigate('/customers');
    } catch (error: any) {
      toast({
        title: language === 'ar' ? 'فشل في حذف العميل' : 'Failed to delete customer',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Handle financial actions
  const handleFinancialAction = (action: 'add' | 'reminder' | 'history' | 'report') => {
    switch (action) {
      case 'add':
        toast({
          title: language === 'ar' ? 'تسجيل دفعة جديدة' : 'Record New Payment',
          description: language === 'ar' ? 'سيتم فتح نافذة تسجيل الدفعة قريباً' : 'Payment recording will open soon'
        });
        break;
      case 'reminder':
        toast({
          title: language === 'ar' ? 'إرسال تذكير' : 'Send Reminder',
          description: language === 'ar' ? 'تم إرسال تذكير للعميل' : 'Reminder sent to customer'
        });
        break;
      case 'history':
        navigate(`/customers/${customerId}/payments`);
        break;
      case 'report':
        toast({
          title: language === 'ar' ? 'تقرير مالي' : 'Financial Report',
          description: language === 'ar' ? 'سيتم إنشاء التقرير المالي قريباً' : 'Financial report generation coming soon'
        });
        break;
    }
  };

  // Handle contract PDF download with ID card
  const handleDownloadContractPDF = async () => {
    if (!customer || !customerId) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'لا توجد بيانات كافية' : 'Insufficient data',
        variant: 'destructive'
      });
      return;
    }

    try {
      toast({
        title: language === 'ar' ? 'جاري تحضير العقد...' : 'Preparing contract...',
        description: language === 'ar' ? 'يتم جلب بيانات العقد وإنشاء ملف PDF' : 'Fetching contract data and creating PDF file'
      });

      // أولاً: البحث عن العقود النشطة
      let { data: agreements, error: agreementsError } = await supabase
        .from('leases')
        .select(`
          *,
          customers:profiles(*),
          vehicles(*)
        `)
        .eq('customer_id', customerId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      // إذا لم توجد عقود نشطة، ابحث عن جميع العقود
      if (!agreements || agreements.length === 0) {
        const { data: allAgreements, error: allAgreementsError } = await supabase
          .from('leases')
          .select(`
            *,
            customers:profiles(*),
            vehicles(*)
          `)
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (allAgreementsError) {
          console.error('Error fetching all agreements:', allAgreementsError);
          toast({
            title: language === 'ar' ? 'خطأ في جلب العقود' : 'Error fetching agreements',
            description: allAgreementsError.message,
            variant: 'destructive'
          });
          return;
        }

        agreements = allAgreements;
        agreementsError = allAgreementsError;
      }

      if (agreementsError) {
        console.error('Error fetching agreements:', agreementsError);
        toast({
          title: language === 'ar' ? 'خطأ في جلب العقود' : 'Error fetching agreements',
          description: agreementsError.message,
          variant: 'destructive'
        });
        return;
      }

      if (!agreements || agreements.length === 0) {
        toast({
          title: language === 'ar' ? 'لا توجد عقود' : 'No agreements found',
          description: language === 'ar' ? 'لا يوجد أي عقد لهذا العميل. يرجى إنشاء عقد أولاً.' : 'No agreements found for this customer. Please create an agreement first.',
          variant: 'destructive'
        });
        return;
      }

      const agreement = agreements[0];
      const isActiveAgreement = agreement.status === 'active';

      // جلب الدفعات
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('agreement_id', agreement.id)
        .order('due_date', { ascending: true });

      // تحضير بيانات العقد
      const agreementData = {
        ...agreement,
        start_date: agreement.start_date,
        end_date: agreement.end_date,
        created_at: agreement.created_at,
        updated_at: agreement.updated_at,
      };

      // استخدام صورة البطاقة الشخصية مع تحقق آمن
      const customerIdCardImage = (customer && 'id_card_image' in customer) ? (customer as any).id_card_image : undefined;

      // إنشاء PDF مع أو بدون صورة البطاقة الشخصية
      await generateModernAgreementPDF(
        agreementData,
        payments || [],
        [], // المخالفات المرورية
        customerIdCardImage // صورة البطاقة الشخصية
      );

      const statusMessage = isActiveAgreement 
        ? (language === 'ar' ? 'العقد النشط' : 'Active contract')
        : (language === 'ar' ? `أحدث عقد (${agreement.status})` : `Latest contract (${agreement.status})`);

      if (customerIdCardImage) {
        toast({
          title: language === 'ar' ? 'تم إنشاء العقد بنجاح ✓' : 'Contract generated successfully ✓',
          description: language === 'ar' ? 
            `تم تحميل ${statusMessage} PDF مع إرفاق صورة البطاقة الشخصية في صفحة منفصلة قبل التوقيع` : 
            `${statusMessage} PDF downloaded with ID card image attached on separate page before signature`
        });
      } else {
        toast({
          title: language === 'ar' ? 'تم إنشاء العقد بنجاح' : 'Contract generated successfully',
          description: language === 'ar' ? 
            `تم تحميل ${statusMessage} PDF. لم يتم إرفاق البطاقة الشخصية (غير متوفرة). يمكنك إضافة البطاقة الشخصية عبر تحديث ملف العميل.` : 
            `${statusMessage} PDF downloaded. ID card not attached (not available). You can add ID card by updating customer profile.`
        });
      }

    } catch (error: any) {
      console.error('Error generating contract PDF:', error);
      toast({
        title: language === 'ar' ? 'خطأ في إنشاء العقد' : 'Error generating contract',
        description: error.message || (language === 'ar' ? 'فشل في إنشاء ملف PDF' : 'Failed to create PDF file'),
        variant: 'destructive'
      });
    }
  };

  // Show explicit loading indicator
  if (isLoading) {
    console.log("CustomerDetail: Rendering loading state");
    return (
      <div className={`flex items-center justify-center p-6 ${language === 'ar' ? 'flex-row-reverse' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span className={`text-lg ${language === 'ar' ? 'ml-4' : 'mr-4'}`}>
          {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
        </span>
      </div>
    );
  }

  // Show explicit error state
  if (error || !customer) {
    console.log("CustomerDetail: Rendering error state:", error);
    return (
      <Card className="w-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <CardContent className="p-6">
          <p className={`text-destructive ${language === 'ar' ? 'text-right' : ''}`}>
            {error || (language === 'ar' ? 'تعذر العثور على بيانات العميل' : 'Customer data not found')}
          </p>
        </CardContent>
      </Card>
    );
  }

  console.log("CustomerDetail: Rendering customer detail view for:", customer?.full_name || 'unknown customer');
  
      return (
      <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {/* Main Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4" dir="rtl">
          <TabsTrigger value="profile" className="flex items-center gap-2 flex-row-reverse">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">نظرة عامة</span>
          </TabsTrigger>
          <TabsTrigger value="attachments" className="flex items-center gap-2 flex-row-reverse">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">المرفقات</span>
          </TabsTrigger>
          <TabsTrigger value="financials" className="flex items-center gap-2 flex-row-reverse">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">الماليات</span>
          </TabsTrigger>
          <TabsTrigger value="agreements" className="flex items-center gap-2 flex-row-reverse">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">العقود</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="profile" className="space-y-6 mt-6">
          {/* Header Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div className="flex gap-2">
                  <Badge 
                    variant="default"
                    className="px-3 py-1 bg-green-100 text-green-800 border-green-200"
                  >
                    نشط
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1">
                    {customer.full_name || 'بدون اسم'}
                  </Badge>
                </div>
                <div className="text-right">
                  <CardTitle className="text-xl font-bold text-right">نظرة عامة على العميل</CardTitle>
                  <CardDescription className="text-right mt-1">
                    معلومات العميل الأساسية والتفاصيل الشخصية
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Main Information Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Contact Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-end gap-3">
                  <span className="text-left">معلومات التواصل</span>
                  <Phone className="h-5 w-5" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-right space-y-0">
                  <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                  <p className="font-medium">{customer.email || 'غير متوفر'}</p>
                </div>
                <div className="text-right space-y-0">
                  <p className="text-sm text-muted-foreground">رقم الهاتف</p>
                  <p className="font-medium phone-number-ltr text-right" dir="ltr">{formatQatarPhone(customer.phone_number)}</p>
                </div>
                <div className="text-right space-y-0">
                  <p className="text-sm text-muted-foreground">العنوان</p>
                  <p className="font-medium">{customer.address || 'غير متوفر'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Personal Details Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-end gap-3">
                  <span className="text-left">التفاصيل الشخصية</span>
                  <User className="h-5 w-5" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-right space-y-0">
                  <p className="text-sm text-muted-foreground">الجنسية</p>
                  <p className="font-medium">{customer.nationality || 'غير محدد'}</p>
                </div>
                <div className="text-right space-y-0">
                  <p className="text-sm text-muted-foreground">رخصة القيادة</p>
                  <p className="font-medium phone-number-ltr text-right" dir="ltr">{(customer as any).driver_license || 'غير متوفر'}</p>
                </div>
                <div className="text-right space-y-0">
                  <p className="text-sm text-muted-foreground">رقم الهوية</p>
                  <p className="font-medium phone-number-ltr text-right" dir="ltr">{(customer as any).id_number || 'غير متوفر'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Account Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-end gap-3">
                  <span className="text-left">معلومات الحساب</span>
                  <Clock className="h-5 w-5" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">تاريخ الإنشاء</p>
                  <p className="font-medium">{formatDate(customer.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">آخر تحديث</p>
                  <p className="font-medium">{formatDate(customer.updated_at || customer.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">الحالة</p>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    نشط
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Agreements Statistics Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-end gap-3">
                  <span className="text-left">إحصائيات العقود</span>
                  <FileText className="h-5 w-5" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">إجمالي العقود</p>
                  <p className="font-medium text-lg">{totalAgreements}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">العقود النشطة</p>
                  <p className="font-medium text-lg text-green-600">{activeAgreements}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">معدل النشاط</p>
                  <p className="font-medium">
                    {totalAgreements > 0 ? `${Math.round((activeAgreements / totalAgreements) * 100)}%` : '0%'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Details Card - ID Card Image */}
          {customer && 'id_card_image' in customer && (customer as any).id_card_image && (
            <Card>
              <CardHeader>
                <CardTitle className="text-right flex items-center gap-2 flex-row-reverse">
                  <FileText className="h-5 w-5" />
                  البطاقة الشخصية المرفقة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-200">
                  <div className="text-center space-y-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm inline-block">
                      <img 
                        src={(customer as any).id_card_image} 
                        alt="البطاقة الشخصية"
                        className="max-w-full max-h-64 object-contain rounded border"
                        style={{ maxWidth: '400px' }}
                      />
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <p className="font-medium text-right">
                        📷 صورة البطاقة الشخصية المحفوظة
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 text-right">
                        تم حفظ هذه الصورة عند مسح البطاقة الشخصية أثناء إضافة العميل
                      </p>
                    </div>
                    
                    <div className="flex gap-2 justify-center flex-row-reverse">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = (customer as any).id_card_image;
                          link.download = `id-card-${customer.full_name}-${new Date().toISOString().split('T')[0]}.jpg`;
                          link.click();
                        }}
                        className="flex items-center gap-1 flex-row-reverse"
                      >
                        <FileText className="h-4 w-4" />
                        تحميل الصورة
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const newWindow = window.open();
                          if (newWindow) {
                            newWindow.document.write(`
                              <html>
                                <head><title>البطاقة الشخصية - ${customer.full_name}</title></head>
                                <body style="margin:0;padding:20px;background:#f5f5f5;display:flex;justify-content:center;align-items:center;min-height:100vh;">
                                  <img src="${(customer as any).id_card_image}" style="max-width:100%;max-height:100%;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);" />
                                </body>
                              </html>
                            `);
                          }
                        }}
                        className="flex items-center gap-1 flex-row-reverse"
                      >
                        <FileText className="h-4 w-4" />
                        عرض كامل
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Notes Card */}
          {(customer as any).notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-right flex items-center gap-2 flex-row-reverse">
                  <Edit className="h-5 w-5" />
                  ملاحظات إضافية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg">
                  <div className="text-right">
                    <h4 className="font-medium text-gray-900 text-sm mb-3 flex items-center gap-2 flex-row-reverse">
                      <FileText className="h-4 w-4 text-gray-600" />
                      الملاحظات المحفوظة
                    </h4>
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed text-right">
                        {(customer as any).notes}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Attachments Tab */}
        <TabsContent value="attachments" className="space-y-6 mt-6">
          {/* Contract PDF Generation Section */}
          <Card className="w-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <CardTitle className="text-lg font-semibold flex items-center justify-end gap-3">
                    <span className="text-left">تحميل عقد PDF</span>
                    <Download className="w-5 h-5" />
                  </CardTitle>
                  <CardDescription className="mt-1 text-left">
                    تحميل العقد بصيغة PDF (العقد النشط أو أحدث عقد متوفر) مع إرفاق صورة البطاقة الشخصية إذا كانت متوفرة
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customer && 'id_card_image' in customer && (customer as any).id_card_image ? (
                  /* ID Card available - show enhanced PDF option */
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3 flex-row-reverse">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-green-700 font-medium text-right">
                        عقد PDF محسن متوفر ✓
                      </span>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border-2 border-dashed border-green-200">
                      <div className="text-center space-y-4">
                        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <Download className="w-6 h-6 text-green-600" />
                        </div>
                        
                        <div>
                          <h3 className="font-medium text-gray-900 mb-2 text-right">
                            عقد PDF مع البطاقة الشخصية
                          </h3>
                          <p className="text-sm text-gray-600 mb-4 text-right">
                            سيتم تحميل العقد النشط أو أحدث عقد متوفر. سيتم إرفاق صورة البطاقة الشخصية في صفحة منفصلة قبل التوقيع، مناسب للاستخدامات الرسمية والقانونية.
                          </p>
                        </div>
                        
                        <Button 
                          onClick={handleDownloadContractPDF}
                          className="w-full flex-row-reverse"
                          size="lg"
                        >
                          <Download className="h-5 w-5" />
                          تحميل العقد
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-4 text-xs text-green-700 space-y-1">
                      <p className="flex items-center gap-2 flex-row-reverse">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                        يتضمن صورة البطاقة الشخصية في صفحة منفصلة
                      </p>
                      <p className="flex items-center gap-2 flex-row-reverse">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                        جاهز للطباعة بحجم A4
                      </p>
                      <p className="flex items-center gap-2 flex-row-reverse">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                        مناسب للاستخدامات الرسمية والقانونية
                      </p>
                    </div>
                  </div>
                ) : (
                  /* No ID Card - show improvement option */
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3 flex-row-reverse">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-blue-700 font-medium text-right">
                        عقد PDF أساسي متوفر
                      </span>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border-2 border-dashed border-blue-200">
                      <div className="text-center space-y-4">
                        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Download className="w-6 h-6 text-blue-600" />
                        </div>
                        
                        <div>
                          <h3 className="font-medium text-gray-900 mb-2 text-right">
                            عقد PDF (بدون البطاقة الشخصية)
                          </h3>
                          <p className="text-sm text-gray-600 mb-4 text-right">
                            سيتم تحميل العقد النشط أو أحدث عقد متوفر. لن يتم إرفاق البطاقة الشخصية لأنها غير متوفرة في ملف العميل. يمكنك إضافة البطاقة لاحقاً لتحسين العقد.
                          </p>
                        </div>
                        
                        <Button 
                          onClick={handleDownloadContractPDF}
                          className="w-full flex-row-reverse"
                          size="lg"
                          variant="outline"
                        >
                          <Download className="h-5 w-5" />
                          تحميل العقد الأساسي
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-4 text-xs text-blue-700 space-y-1">
                      <p className="flex items-center gap-2 flex-row-reverse">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                        يمكن تحسين العقد بإضافة البطاقة الشخصية لاحقاً
                      </p>
                      <p className="flex items-center gap-2 flex-row-reverse">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                        سيتم إضافة صفحة لطلب المستندات المطلوبة
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Other Attachments Section */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2 text-right flex items-center gap-2 flex-row-reverse">
                    <FileText className="h-4 w-4 text-gray-600" />
                    المرفقات الأخرى
                  </h3>
                  <p className="text-sm text-gray-600 text-right">
                    قريباً - إمكانية إرفاق ملفات إضافية للعميل
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financials Tab */}
        <TabsContent value="financials" className="space-y-6 mt-6">
          <CustomerFinancialTab 
            customerId={customerId}
          />
        </TabsContent>

        {/* Agreements Tab */}
        <TabsContent value="agreements" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-right">العقود المرتبطة</CardTitle>
              <CardDescription className="text-right">
                جميع العقود المرتبطة بهذا العميل
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(customer as any).agreements && (customer as any).agreements.length > 0 ? (
                <div className="space-y-3">
                  {(customer as any).agreements.map((agreement: any) => (
                    <div key={agreement.id} className="border rounded-lg p-4 flex justify-between items-center">
                      <Badge variant={agreement.status === 'active' ? 'default' : 'secondary'}>
                        {agreement.status === 'active' ? 'نشط' : agreement.status}
                      </Badge>
                      <div className="text-right">
                        <p className="font-medium">
                          العقد رقم: {agreement.agreement_number}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          من {formatDate(agreement.start_date)} إلى {formatDate(agreement.end_date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد عقود</h3>
                  <p className="text-gray-600">لم يتم إنشاء أي عقد لهذا العميل بعد</p>
                  <Button asChild className="mt-4">
                    <Link to="/agreements/add">إضافة عقد جديد</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Legal Tab */}
        {visibleTabs.some(tab => tab.value === 'legal') && (
          <TabsContent value="legal">
            <CustomerLegalObligationsPage customerId={customerId} />
          </TabsContent>
        )}

        {/* Traffic Fines Tab */}
        {visibleTabs.some(tab => tab.value === 'fines') && (
          <TabsContent value="fines">
            <CustomerTrafficFines customerId={customerId} />
          </TabsContent>
        )}
      </Tabs>

      {/* Edit Notes Dialog/Section */}
      {editingNotes && (
        <Card className="fixed inset-4 z-50 bg-white shadow-xl rounded-lg" dir="rtl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-right">تعديل ملاحظات العميل</CardTitle>
              <div className="flex gap-2 flex-row-reverse">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCancelEditNotes}
                  className="flex items-center gap-2 flex-row-reverse"
                >
                  <X className="h-4 w-4" />
                  إلغاء
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={handleSaveNotes}
                  disabled={updateMutation.isPending}
                  className="flex items-center gap-2 flex-row-reverse"
                >
                  <Save className="h-4 w-4" />
                  حفظ
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea 
              placeholder="أدخل ملاحظات حول العميل..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[120px] text-right resize-none"
              dir="rtl"
            />
            <p className="text-xs text-muted-foreground text-right mt-2">
              اكتب أي ملاحظات مهمة حول العميل، مثل تفضيلاته أو تاريخ التعامل معه
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
