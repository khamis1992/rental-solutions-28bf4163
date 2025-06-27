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
import { Edit, Trash2, Mail, Phone, MapPin, FileText, Clock, Save, X } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';
import CustomerTrafficFines from '../traffic-fines/CustomerTrafficFines';
import CustomerLegalObligationsPage from '../legal/CustomerLegalObligationsPage';
import { CustomerFinancialTab } from './CustomerFinancialTab';
import { Customer } from '@/types/customer.types';
import { useTranslation } from '@/utils/translation-helper';
import { useLanguage } from '@/contexts/LanguageContext';
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
      {/* Customer Header Card */}
      <Card className="w-full border rounded-lg overflow-hidden">
        <CardContent className="p-6">
          <div className={`flex flex-col md:flex-row justify-between items-start md:items-center mb-6 ${language === 'ar' ? 'md:flex-row-reverse' : ''}`}>
            {/* Buttons */}
            <div className={`flex gap-2 mb-4 md:mb-0 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <Button asChild variant="outline">
                <Link to={`/customers/edit/${customerId}`}>
                  <Edit className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                  {language === 'ar' ? 'تعديل' : 'Edit'}
                </Link>
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                {language === 'ar' ? 'حذف' : 'Delete'}
              </Button>
            </div>
            
            {/* Customer Info */}
            <div className={`flex items-center gap-4 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center text-lg font-bold">
                {customer.full_name?.charAt(0) || "ع"}
              </div>
              <div className={language === 'ar' ? 'text-right' : 'text-left'}>
                <div className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}> 
                  <h2 className="text-2xl font-bold">{customer.full_name}</h2>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    {language === 'ar' ? 'نشط' : 'Active'}
                  </Badge>
                </div>
                <p className="text-gray-500">
                  {language === 'ar' ? `عميل منذ ${formatDate(customer.created_at)}` : `Customer since ${formatDate(customer.created_at)}`}
                </p>
                <div className={`mt-2 flex gap-6 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex items-center gap-1 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <Mail className={`h-4 w-4 text-gray-500 ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
                    <span className="text-sm">{customer.email || (language === 'ar' ? 'غير متوفر' : 'Not available')}</span>
                  </div>
                  <div className={`flex items-center gap-1 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <Phone className={`h-4 w-4 text-gray-500 ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
                    <span className="text-sm" dir="ltr">{formatQatarPhone(customer.phone_number)}</span>
                  </div>
                  <div className={`flex items-center gap-1 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <FileText className={`h-4 w-4 text-gray-500 ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
                    <span className="text-sm">{customer.nationality || (language === 'ar' ? 'غير متوفر' : 'Not available')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className={`bg-gray-50 p-4 rounded-lg ${language === 'ar' ? 'text-right' : 'text-left'}`}>
              <p className="text-gray-500 mb-1">
                {language === 'ar' ? 'إجمالي العقود' : 'Total Agreements'}
              </p>
              <p className="text-3xl font-bold">{totalAgreements}</p>
            </div>
            <div className={`bg-gray-50 p-4 rounded-lg ${language === 'ar' ? 'text-right' : 'text-left'}`}>
              <p className="text-gray-500 mb-1">
                {language === 'ar' ? 'العقود النشطة' : 'Active Agreements'}
              </p>
              <p className="text-3xl font-bold">{activeAgreements}</p>
            </div>
            <div className={`bg-gray-50 p-4 rounded-lg ${language === 'ar' ? 'text-right' : 'text-left'}`}>
              <p className="text-gray-500 mb-1">
                {language === 'ar' ? 'آخر تحديث' : 'Last Updated'}
              </p>
              <p className="text-sm font-medium">{formatDate(customer.updated_at || customer.created_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Tabs for different sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <TabsList 
          className={`w-full mb-4 ${
            visibleTabs.length === 5 ? 'grid-cols-5' : 
            visibleTabs.length === 4 ? 'grid-cols-4' : 
            visibleTabs.length === 3 ? 'grid-cols-3' : 
            visibleTabs.length === 2 ? 'grid-cols-2' : 'grid-cols-1'
          } grid`}
          style={{ 
            direction: language === 'ar' ? 'rtl' : 'ltr',
            textAlign: language === 'ar' ? 'right' : 'left'
          }}
        >
          {visibleTabs.map((tab) => (
            <TabsTrigger 
              key={tab.value} 
              value={tab.value}
              className={`
                relative transition-all duration-200 ease-in-out
                data-[state=active]:bg-white 
                data-[state=active]:text-blue-600 
                data-[state=active]:shadow-sm
                data-[state=active]:border-b-2 
                data-[state=active]:border-blue-600
                hover:bg-gray-50 
                hover:text-gray-900
                ${language === 'ar' ? 'text-right' : 'text-left'}
              `}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value="profile" className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${language === 'ar' ? 'text-right' : ''}`}>
          {/* Contact Information Card */}
          <Card className="w-full" dir="rtl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <CardTitle className="text-lg font-semibold text-left flex items-center gap-2 flex-row-reverse">
                    <Phone className="w-5 h-5" />
                    {language === 'ar' ? 'معلومات التواصل' : 'Contact Information'}
                  </CardTitle>
                  <CardDescription className="text-left mt-1">
                    {language === 'ar' ? 'تفاصيل الاتصال والتواصل مع العميل' : 'Customer contact and communication details'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="text-sm text-muted-foreground text-left">
                    {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                  </p>
                  <p className="font-medium text-left">{customer.email || (language === 'ar' ? 'غير متوفر' : 'Not available')}</p>
                </div>
                <Mail className="h-5 w-5 text-primary/60 flex-shrink-0" />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="text-sm text-muted-foreground text-left">
                    {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                  </p>
                  <p className="font-medium text-left text-sm" dir="ltr">{formatQatarPhone(customer.phone_number)}</p>
                </div>
                <Phone className="h-5 w-5 text-primary/60 flex-shrink-0" />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="text-sm text-muted-foreground text-left">
                    {language === 'ar' ? 'العنوان' : 'Address'}
                  </p>
                  <p className="font-medium text-left">{customer.address || (language === 'ar' ? 'غير متوفر' : 'Not available')}</p>
                </div>
                <MapPin className="h-5 w-5 text-primary/60 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
          
          {/* Customer Details Card */}
          <Card className="w-full">
            <CardContent className="p-6">
              <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <FileText className="w-5 h-5" />
                {language === 'ar' ? 'تفاصيل العميل' : 'Customer Details'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-gray-500 mb-1">
                    {language === 'ar' ? 'الحالة' : 'Status'}
                  </p>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    {language === 'ar' ? 'نشط' : 'Active'}
                  </Badge>
                </div>
                
                <div>
                  <p className="text-gray-500 mb-1">
                    {language === 'ar' ? 'رخصة القيادة' : 'Driver License'}
                  </p>
                  <p className="font-medium">{(customer as any).driver_license || (language === 'ar' ? 'غير متوفر' : 'Not available')}</p>
                </div>
                
                <div>
                  <p className="text-gray-500 mb-1">
                    {language === 'ar' ? 'آخر تحديث' : 'Last Updated'}
                  </p>
                  <p className={`font-medium flex items-center gap-1 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <Clock className="h-4 w-4" />
                    {formatDate(customer.updated_at || customer.created_at)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Additional Notes with Edit Functionality */}
          <Card className="w-full col-span-2" dir="rtl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <CardTitle className="text-lg font-semibold text-left">
                    {language === 'ar' ? 'ملاحظات إضافية' : 'Additional Notes'}
                  </CardTitle>
                  <CardDescription className="text-left mt-1">
                    {language === 'ar' ? 'إدارة الملاحظات والتعليقات الخاصة بالعميل' : 'Manage customer notes and comments'}
                  </CardDescription>
                </div>
                {!editingNotes ? (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setEditingNotes(true)}
                    className="flex items-center gap-2 flex-row-reverse"
                  >
                    <Edit className="h-4 w-4" />
                    {language === 'ar' ? 'تعديل الملاحظات' : 'Edit Notes'}
                  </Button>
                ) : (
                  <div className="flex gap-2 flex-row-reverse">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleCancelEditNotes}
                      className="flex items-center gap-2 flex-row-reverse"
                    >
                      <X className="h-4 w-4" />
                      {language === 'ar' ? 'إلغاء' : 'Cancel'}
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={handleSaveNotes}
                      disabled={updateMutation.isPending}
                      className="flex items-center gap-2 flex-row-reverse"
                    >
                      <Save className="h-4 w-4" />
                      {language === 'ar' ? 'حفظ' : 'Save'}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!editingNotes ? (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="text-right">
                    {(customer as any).notes ? (
                      <>
                        <h4 className="font-medium text-gray-900 text-sm mb-2">الملاحظات المحفوظة</h4>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {(customer as any).notes}
                        </p>
                      </>
                    ) : (
                      <>
                        <h4 className="font-medium text-gray-500 text-sm mb-1">لا توجد ملاحظات إضافية</h4>
                        <p className="text-xs text-muted-foreground">
                          لم يتم إضافة أي ملاحظات لهذا العميل بعد
                        </p>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <FormField
                  label={language === 'ar' ? 'ملاحظات العميل' : 'Customer Notes'}
                  htmlFor="notes"
                >
                  <Textarea 
                    id="notes"
                    placeholder={language === 'ar' ? 'أدخل ملاحظات حول العميل...' : 'Enter notes about the customer...'}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[100px] text-right"
                    dir="rtl"
                  />
                </FormField>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financials">
          {customerId && <CustomerFinancialTab customerId={customerId} />}
        </TabsContent>
        
        <TabsContent value="agreements">
          {(customer as any).agreements && (customer as any).agreements.length > 0 ? (
            <div className="bg-white rounded-md shadow overflow-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
              <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                      <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                        {language === 'ar' ? 'رقم العقد' : 'Agreement Number'}
                    </th>
                      <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                        {language === 'ar' ? 'تاريخ البدء' : 'Start Date'}
                    </th>
                      <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                        {language === 'ar' ? 'تاريخ الانتهاء' : 'End Date'}
                    </th>
                      <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                        {language === 'ar' ? 'الحالة' : 'Status'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {(customer as any).agreements.map((agreement: any) => (
                    <tr key={agreement.id} 
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => window.open(`/agreements/${agreement.id}`, '_blank')}>
                        <td className={`px-6 py-4 whitespace-nowrap ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                        <div className="text-sm font-medium text-blue-600 hover:text-blue-800">{agreement.agreement_number}</div>
                      </td>
                        <td className={`px-6 py-4 whitespace-nowrap ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                        <div className="text-sm text-gray-500">{formatDate(agreement.start_date)}</div>
                      </td>
                        <td className={`px-6 py-4 whitespace-nowrap ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                        <div className="text-sm text-gray-500">{formatDate(agreement.end_date)}</div>
                      </td>
                        <td className={`px-6 py-4 whitespace-nowrap ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                        <Badge className={
                            agreement.status === 'active' ? 'bg-green-100 text-green-800 border-green-200' : 
                            agreement.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 
                            'bg-gray-100 text-gray-800 border-gray-200'
                        }>
                            {language === 'ar' ? (
                              agreement.status === 'active' ? 'نشط' : 
                              agreement.status === 'pending' ? 'قيد الانتظار' : 
                              agreement.status === 'completed' ? 'مكتمل' :
                              agreement.status === 'cancelled' ? 'ملغي' : 'غير معروف'
                            ) : (
                              agreement.status === 'active' ? 'Active' : 
                              agreement.status === 'pending' ? 'Pending' : 
                              agreement.status === 'completed' ? 'Completed' :
                              agreement.status === 'cancelled' ? 'Cancelled' : 'Unknown'
                            )}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          ) : (
            <Card className="w-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>
              <CardContent className="p-6 text-center">
                <p className={`text-gray-500 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {language === 'ar' ? 'لا توجد عقود لهذا العميل.' : 'No agreements found for this customer.'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="legal">
          {customerId && <CustomerLegalObligationsPage customerId={customerId} />}
        </TabsContent>
        
        <TabsContent value="fines">
          {customerId && <CustomerTrafficFines customerId={customerId} />}
        </TabsContent>
      </Tabs>
    </div>
  );
};
