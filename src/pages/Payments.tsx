import React, { useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/ui/PageHeader';
import { Receipt, CreditCard, DollarSign, Calendar, Filter, Plus, Download, Loader2, Search } from 'lucide-react';
import '@/styles/payments-mobile.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
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
      <Badge className={`${config.color} text-xs`}>
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
      <PageContainer className="max-w-full px-2 sm:px-4" dir="rtl">
        <div className="text-center py-8">
          <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">خطأ في تحميل البيانات</h3>
          <p className="text-gray-600 mb-4 text-sm">حدث خطأ أثناء تحميل المدفوعات: {error.message}</p>
          <Button onClick={() => refetch()} size="sm">
            إعادة المحاولة
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer 
      className="max-w-full px-2 sm:px-4 md:px-6"
      dir="rtl"
    >
      <PageHeader
        title="المدفوعات"
        subtitle="إدارة ومتابعة جميع المدفوعات والدفعات المالية"
        icon={<Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />}
        align="right"
        dir="rtl"
        className="mb-4 sm:mb-6"
      />
      
      {/* Statistics Cards - محسنة للجوال */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6" dir="rtl">
        <Card className="border-r-4 border-r-blue-500">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">إجمالي</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.total}</p>
              </div>
              <Receipt className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-r-4 border-r-green-500">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">مدفوعة</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-r-4 border-r-yellow-500">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">معلقة</p>
                <p className="text-lg sm:text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-r-4 border-r-red-500">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">متأخرة</p>
                <p className="text-lg sm:text-2xl font-bold text-red-600">{stats.overdue}</p>
              </div>
              <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex flex-col gap-4 sm:gap-6" dir="rtl">
        {/* Main Content */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row-reverse justify-between items-start gap-3 sm:gap-4">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
                  إدارة المدفوعات
                </CardTitle>
                
                {/* أزرار الإجراءات - محسنة للجوال */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                  <Button size="sm" className="flex items-center justify-center gap-2 text-xs sm:text-sm">
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                    تسجيل دفعة جديدة
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center justify-center gap-2 text-xs sm:text-sm">
                    <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                    تصدير
                  </Button>
                </div>
              </div>
              
              {/* Filters and Search - محسن للجوال */}
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="البحث في المدفوعات..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="text-right pr-10 text-sm"
                    dir="rtl"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => refetch()}
                    className="flex items-center gap-2 text-xs"
                  >
                    {isLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Filter className="h-3 w-3" />
                    )}
                    تحديث
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            {/* Payment Tabs - محسنة للجوال */}
            <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
              <div className="overflow-x-auto mb-4">
                <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 min-w-max">
                  <TabsTrigger value="all" className="text-xs sm:text-sm px-2 sm:px-4">
                    الكل
                  </TabsTrigger>
                  <TabsTrigger value="paid" className="text-xs sm:text-sm px-2 sm:px-4">
                    مدفوعة
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="text-xs sm:text-sm px-2 sm:px-4">
                    معلقة
                  </TabsTrigger>
                  <TabsTrigger value="overdue" className="text-xs sm:text-sm px-2 sm:px-4 hidden sm:block">
                    متأخرة
                  </TabsTrigger>
                  <TabsTrigger value="cancelled" className="text-xs sm:text-sm px-2 sm:px-4 hidden sm:block">
                    ملغية
                  </TabsTrigger>
                </TabsList>
              </div>10
              
              <TabsContent value={activeTab} className="mt-4 sm:mt-6">
                {isLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 text-blue-500 mx-auto mb-4 animate-spin" />
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">جاري تحميل المدفوعات...</h3>
                    <p className="text-gray-600 text-sm">يرجى الانتظار</p>
                  </div>
                ) : filteredPayments.length === 0 ? (
                  <div className="text-center py-8">
                    <Receipt className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">لا توجد مدفوعات</h3>
                    <p className="text-gray-600 text-sm">
                      {activeTab === 'all' 
                        ? 'لم يتم العثور على مدفوعات مطابقة لمعايير البحث'
                        : `لا توجد مدفوعات بحالة "${activeTab === 'paid' ? 'مدفوع' : activeTab === 'pending' ? 'معلق' : activeTab === 'overdue' ? 'متأخر' : 'ملغي'}"`
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {filteredPayments.map((payment: any) => (
                      <Card key={payment.id} className="border-r-4 border-r-blue-500 hover:shadow-md transition-shadow">
                        <CardContent className="p-3 sm:p-4">
                          {/* تخطيط محسن للجوال */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                            {/* معلومات أساسية */}
                            <div className="flex items-start gap-3 flex-row-reverse">
                              <div className="bg-blue-100 p-2 sm:p-3 rounded-full flex-shrink-0">
                                <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                              </div>
                              
                              <div className="text-right flex-1 min-w-0">
                                <h3 className="font-semibold text-sm sm:text-lg truncate">{payment.customer_name}</h3>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                  عقد: {payment.agreement_number || 'غير محدد'}
                                </p>
                                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                  {payment.vehicle_info}
                                </p>
                                
                                {/* تفاصيل التواريخ في الجوال */}
                                <div className="mt-2 space-y-1">
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    استحقاق: {formatDate(payment.original_due_date)}
                                  </p>
                                  {payment.payment_date && (
                                    <p className="text-xs text-green-600 flex items-center gap-1">
                                      دفع: {formatDate(payment.payment_date)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* المبلغ والحالة */}
                            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:gap-3 sm:text-left">
                              <div className="text-xl sm:text-2xl font-bold text-blue-600">
                                {formatCurrency(payment.amount)} ر.ق
                              </div>
                              
                              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2">
                                {getStatusBadge(payment.status)}
                                <Badge variant="outline" className="text-xs">
                                  {getPaymentMethodLabel(payment.payment_method)}
                                </Badge>
                              </div>
                              
                              {payment.description && (
                                <p className="text-xs text-muted-foreground mt-1 max-w-xs truncate hidden sm:block">
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