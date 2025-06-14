import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Card, CardContent, 
  Badge, Button, 
  Tabs, TabsContent, TabsList, TabsTrigger,
  Textarea
} from "@/components/ui";
import { FormField } from "@/components/ui/form-components";
import { useToast } from "@/components/ui/use-toast";
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Edit, Trash2, Mail, Phone, MapPin, FileText, Clock, Save, X } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';
import CustomerTrafficFines from '../traffic-fines/CustomerTrafficFines';
import CustomerLegalObligationsPage from '../legal/CustomerLegalObligationsPage';
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
        title: "Customer updated",
        description: "Customer details have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

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

  // Show explicit loading indicator
  if (isLoading) {
    console.log("CustomerDetail: Rendering loading state");
    return (
      <div className="flex items-center justify-center p-6">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="mr-4 text-lg">جاري التحميل...</span>
      </div>
    );
  }

  // Show explicit error state
  if (error || !customer) {
    console.log("CustomerDetail: Rendering error state:", error);
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <p className="text-destructive">{error || "تعذر العثور على بيانات العميل"}</p>
        </CardContent>
      </Card>
    );
  }

  // Count active agreements
  const activeAgreements = customer.agreements?.filter(
    (agreement: any) => agreement.status === 'active'
  ).length || 0;

  // Get total agreements
  const totalAgreements = customer.agreements?.length || 0;

  console.log("CustomerDetail: Rendering customer detail view for:", customer.full_name);
  
  return (
    <div className="space-y-6">
      {/* Customer Header Card */}
      <Card className="w-full border rounded-lg overflow-hidden">
        <CardContent className="p-6">
          <div
            dir={language === 'ar' ? 'rtl' : 'ltr'}
            className="flex flex-col md:flex-row-reverse justify-between items-start md:items-center mb-6"
          >
            {/* Buttons: always first in DOM, so they appear left in RTL */}
            <div className="flex gap-2 mb-4 md:mb-0">
              <Button asChild variant="outline">
                <Link to={`/customers/edit/${customerId}`}>
                  <Edit className="ml-2 h-4 w-4" />
                  {language === 'ar' ? 'تعديل' : 'Edit'}
                </Link>
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="ml-2 h-4 w-4" />
                {language === 'ar' ? 'حذف' : 'Delete'}
              </Button>
            </div>
            {/* Info */}
            <div className={`flex items-center gap-4 ${language === 'ar' ? 'flex-row' : 'flex-row-reverse'}`}>
              {/* Avatar */}
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center text-lg font-bold">
                {customer.full_name?.charAt(0) || "ع"}
              </div>
              <div className="text-right">
                <div className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row' : 'flex-row-reverse'}`}> 
                  <h2 className="text-2xl font-bold">{customer.full_name}</h2>
                  <Badge className="bg-blue-500 hover:bg-blue-600">نشط</Badge>
                </div>
                <p className="text-gray-500">عميل منذ {formatDate(customer.created_at)}</p>
                <div className="mt-2 flex gap-6 flex-row-reverse">
                  <div className="flex items-center gap-1 flex-row-reverse">
                    <Mail className="h-4 w-4 text-gray-500 ml-1" />
                    <span className="text-sm">{customer.email || "غير متوفر"}</span>
                  </div>
                  <div className="flex items-center gap-1 flex-row-reverse">
                    <Phone className="h-4 w-4 text-gray-500 ml-1" />
                    <span className="text-sm ltr:text-left" dir="ltr">{formatQatarPhone(customer.phone_number)}</span>
                  </div>
                  <div className="flex items-center gap-1 flex-row-reverse">
                    <FileText className="h-4 w-4 text-gray-500 ml-1" />
                    <span className="text-sm">{customer.nationality || "غير متوفر"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="bg-gray-50 p-4 rounded-lg text-right">
              <p className="text-gray-500 mb-1">إجمالي العقود</p>
              <p className="text-3xl font-bold">{totalAgreements}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-right">
              <p className="text-gray-500 mb-1">العقود النشطة</p>
              <p className="text-3xl font-bold">{activeAgreements}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-right">
              <p className="text-gray-500 mb-1">آخر تحديث</p>
              <p className="text-3xl font-bold">{formatDate(customer.updated_at || customer.created_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Tabs for different sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <TabsList className="grid grid-cols-4 w-full mb-4">
          {language === 'ar' ? (
            <>
              <TabsTrigger value="profile">{t('customers.profileTab')}</TabsTrigger>
              <TabsTrigger value="agreements">{t('customers.agreementsTab')}</TabsTrigger>
              <TabsTrigger value="legal">{t('customers.legalObligationsTab')}</TabsTrigger>
              <TabsTrigger value="fines">{t('customers.trafficFinesTab')}</TabsTrigger>
            </>
          ) : (
            <>
              <TabsTrigger value="fines">{t('customers.trafficFinesTab')}</TabsTrigger>
              <TabsTrigger value="legal">{t('customers.legalObligationsTab')}</TabsTrigger>
              <TabsTrigger value="agreements">{t('customers.agreementsTab')}</TabsTrigger>
              <TabsTrigger value="profile">{t('customers.profileTab')}</TabsTrigger>
            </>
          )}
        </TabsList>
        
        <TabsContent value="profile" className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${language === 'ar' ? 'text-right' : ''}`}>
          {/* Contact Information Card */}
          <Card className="w-full">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5" />
                معلومات التواصل
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-500 mb-1">البريد الإلكتروني</p>
                  <p className="font-medium">{customer.email || 'غير متوفر'}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">رقم الهاتف</p>
                  <p className="font-medium text-sm ltr:text-left" dir="ltr">{formatQatarPhone(customer.phone_number)}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">العنوان</p>
                  <p className="font-medium">{customer.address || 'غير متوفر'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Customer Details Card */}
          <Card className="w-full">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                تفاصيل العميل
              </h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-gray-500 mb-1">الحالة</p>
                  <Badge className="bg-blue-500 hover:bg-blue-600">نشط</Badge>
                </div>
                
                <div>
                  <p className="text-gray-500 mb-1">رخصة القيادة</p>
                  <p className="font-medium">{customer.driver_license || 'غير متوفر'}</p>
                </div>
                
                <div>
                  <p className="text-gray-500 mb-1">آخر تحديث</p>
                  <p className="font-medium flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatDate(customer.updated_at || customer.created_at)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Additional Notes with Edit Functionality */}
          <Card className="w-full col-span-2">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">ملاحظات إضافية</h3>
                {!editingNotes ? (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setEditingNotes(true)}
                  >
                    <Edit className="h-4 w-4 mr-1" /> تعديل الملاحظات
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleCancelEditNotes}
                    >
                      <X className="h-4 w-4 mr-1" /> إلغاء
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={handleSaveNotes}
                      disabled={updateMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-1" /> حفظ
                    </Button>
                  </div>
                )}
              </div>
              
              {!editingNotes ? (
                <p className="text-gray-500 italic">
                  {customer.notes || 'لا توجد ملاحظات إضافية'}
                </p>
              ) : (
                <FormField
                  label="ملاحظات العميل"
                  htmlFor="notes"
                >
                  <Textarea 
                    id="notes"
                    placeholder="أدخل ملاحظات حول العميل..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[100px]"
                  />
                </FormField>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="agreements">
          {customer.agreements && customer.agreements.length > 0 ? (
            <div className="bg-white rounded-md shadow">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      رقم العقد
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      تاريخ البدء
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      تاريخ الانتهاء
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customer.agreements.map((agreement: any) => (
                    <tr key={agreement.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{agreement.agreement_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(agreement.start_date)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(agreement.end_date)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={
                          agreement.status === 'active' ? 'bg-green-100 text-green-800' : 
                          agreement.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-gray-100 text-gray-800'
                        }>
                          {agreement.status === 'active' ? 'نشط' : agreement.status === 'pending' ? 'قيد الانتظار' : 'غير معروف'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Card className="w-full">
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">لا توجد عقود لهذا العميل.</p>
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
