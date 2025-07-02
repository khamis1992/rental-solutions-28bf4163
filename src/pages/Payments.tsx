import React, { useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/ui/PageHeader';
import { Receipt, CreditCard, DollarSign, Calendar, Filter, Plus, Download, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAllPayments } from '@/hooks/use-all-payments';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const Payments = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Use real data from database - use activeTab as the status filter
  const { 
    payments, 
    isLoading, 
    error, 
    stats, 
    refetch 
  } = useAllPayments({
    status: activeTab,
    searchQuery: searchQuery.trim() || undefined
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { label: 'مدفوع', color: 'bg-green-100 text-green-800' },
      pending: { label: 'معلق', color: 'bg-yellow-100 text-yellow-800' },
      overdue: { label: 'متأخر', color: 'bg-red-100 text-red-800' },
      cancelled: { label: 'ملغي', color: 'bg-gray-100 text-gray-800' },
      refunded: { label: 'مسترد', color: 'bg-blue-100 text-blue-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getPaymentMethodLabel = (method: string | null) => {
    if (!method) return 'غير محدد';
    
    const methods = {
      cash: 'نقدي',
      bank_transfer: 'حوالة بنكية',
      credit_card: 'بطاقة ائتمان',
      check: 'شيك',
      online: 'دفع إلكتروني'
    };
    return methods[method as keyof typeof methods] || method;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'غير محدد';
    try {
      return format(new Date(dateString), 'yyyy/MM/dd', { locale: ar });
    } catch {
      return 'تاريخ غير صالح';
    }
  };

  // No additional filtering needed here since hook handles all filtering
  const filteredPayments = payments;

  if (error) {
    return (
      <PageContainer className="max-w-full" dir="rtl">
        <div className="text-center py-8">
          <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">خطأ في تحميل البيانات</h3>
          <p className="text-gray-600 mb-4">حدث خطأ أثناء تحميل المدفوعات: {error.message}</p>
          <Button onClick={() => refetch()}>
            إعادة المحاولة
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer 
      className="max-w-full"
      dir="rtl"
    >
      <PageHeader
        title="المدفوعات"
        subtitle="إدارة ومتابعة جميع المدفوعات والدفعات المالية"
        icon={<Receipt className="w-6 h-6 text-blue-500" />}
        align="right"
        dir="rtl"
      />
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6" dir="rtl">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المدفوعات</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Receipt className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">مدفوعة</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CreditCard className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">معلقة</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">متأخرة</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              </div>
              <DollarSign className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex flex-col gap-6" dir="rtl">
        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row-reverse justify-between items-start md:items-center gap-4">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                إدارة المدفوعات
              </CardTitle>
              
              <div className="flex items-center gap-2">
                <Button size="sm" className="flex-row-reverse">
                  <Plus className="h-4 w-4 mr-2" />
                  تسجيل دفعة جديدة
                </Button>
                <Button variant="outline" size="sm" className="flex-row-reverse">
                  <Download className="h-4 w-4 mr-2" />
                  تصدير
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Filters and Search */}
            <div className="flex flex-col md:flex-row-reverse gap-4 mb-6">
              <div className="flex items-center gap-2 flex-1">
                <Input
                  placeholder="البحث في المدفوعات (اسم العميل، رقم العقد، رقم اللوحة)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-right"
                  dir="rtl"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Filter className="h-4 w-4" />}
                  تحديث
                </Button>
              </div>
            </div>

            {/* Payment Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">جميع المدفوعات</TabsTrigger>
                <TabsTrigger value="paid">مدفوعة</TabsTrigger>
                <TabsTrigger value="pending">معلقة</TabsTrigger>
                <TabsTrigger value="overdue">متأخرة</TabsTrigger>
                <TabsTrigger value="cancelled">ملغية</TabsTrigger>
              </TabsList>
              
              <TabsContent value={activeTab} className="mt-6">
                {isLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">جاري تحميل المدفوعات...</h3>
                    <p className="text-gray-600">يرجى الانتظار</p>
                  </div>
                ) : filteredPayments.length === 0 ? (
                  <div className="text-center py-8">
                    <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد مدفوعات</h3>
                    <p className="text-gray-600">
                      {activeTab === 'all' 
                        ? 'لم يتم العثور على مدفوعات مطابقة لمعايير البحث'
                        : `لا توجد مدفوعات بحالة "${activeTab === 'paid' ? 'مدفوع' : activeTab === 'pending' ? 'معلق' : activeTab === 'overdue' ? 'متأخر' : 'ملغي'}"`
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredPayments.map((payment: any) => (
                      <Card key={payment.id} className="border-r-4 border-r-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-row-reverse">
                              <div className="bg-blue-100 p-3 rounded-full">
                                <CreditCard className="h-5 w-5 text-blue-600" />
                              </div>
                              
                              <div className="text-right">
                                <h3 className="font-semibold text-lg">{payment.customer_name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  عقد رقم: {payment.agreement_number || 'غير محدد'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {payment.vehicle_info}
                                </p>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  تاريخ الاستحقاق: {formatDate(payment.original_due_date)}
                                </p>
                                {payment.payment_date && (
                                  <p className="text-sm text-green-600 flex items-center gap-1">
                                    تاريخ الدفع: {formatDate(payment.payment_date)}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div className="text-left">
                              <div className="text-2xl font-bold text-blue-600">
                                {formatCurrency(payment.amount)} ر.ق
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                {getStatusBadge(payment.status)}
                                <Badge variant="outline">
                                  {getPaymentMethodLabel(payment.payment_method)}
                                </Badge>
                              </div>
                              {payment.description && (
                                <p className="text-xs text-muted-foreground mt-1 max-w-xs truncate">
                                  {payment.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default Payments; 