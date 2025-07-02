import React, { useState } from "react";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from '@/components/ui/PageHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart, FileText, BarChartBig, FileSpreadsheet, Printer, Receipt } from "lucide-react";
import FinancialDashboard from "@/components/financials/FinancialDashboard";
import InvoiceTemplateEditor from "@/components/invoices/InvoiceTemplateEditor";
import CarInstallmentContracts from "@/components/financials/car-installments/CarInstallmentContracts";
import InvoiceGenerator from "@/components/invoices/InvoiceGenerator";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";

// Import Payments components locally
import { Receipt as ReceiptIcon, CreditCard, DollarSign, Calendar, Filter, Plus, Download, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAllPayments } from '@/hooks/use-all-payments';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

// Payments Tab Component
const PaymentsTab = () => {
  const [activePaymentTab, setActivePaymentTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { language } = useLanguage();

  const { 
    payments, 
    isLoading, 
    error, 
    stats, 
    refetch 
  } = useAllPayments({
    status: activePaymentTab,
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

  const filteredPayments = payments;

  if (error) {
    return (
      <div className="text-center py-8">
        <ReceiptIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">خطأ في تحميل البيانات</h3>
        <p className="text-gray-600 mb-4">حدث خطأ أثناء تحميل المدفوعات: {error.message}</p>
        <Button onClick={() => refetch()}>
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المدفوعات</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <ReceiptIcon className="h-8 w-8 text-blue-500" />
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
          <Tabs value={activePaymentTab} onValueChange={setActivePaymentTab} dir="rtl">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">جميع المدفوعات</TabsTrigger>
              <TabsTrigger value="paid">مدفوعة</TabsTrigger>
              <TabsTrigger value="pending">معلقة</TabsTrigger>
              <TabsTrigger value="overdue">متأخرة</TabsTrigger>
              <TabsTrigger value="cancelled">ملغية</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activePaymentTab} className="mt-6">
              {isLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">جاري تحميل المدفوعات...</h3>
                  <p className="text-gray-600">يرجى الانتظار</p>
                </div>
              ) : filteredPayments.length === 0 ? (
                <div className="text-center py-8">
                  <ReceiptIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد مدفوعات</h3>
                  <p className="text-gray-600">
                    {activePaymentTab === 'all' 
                      ? 'لم يتم العثور على مدفوعات مطابقة لمعايير البحث'
                      : `لا توجد مدفوعات بحالة "${activePaymentTab === 'paid' ? 'مدفوع' : activePaymentTab === 'pending' ? 'معلق' : activePaymentTab === 'overdue' ? 'متأخر' : 'ملغي'}"`
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
  );
};

const Financials = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [invoiceDialog, setInvoiceDialog] = useState(false);
  const [invoiceType, setInvoiceType] = useState<'agreement' | 'payment' | 'customer'>('agreement');
  const { language } = useLanguage();
  
  const handleOpenInvoiceGenerator = (type: 'agreement' | 'payment' | 'customer') => {
    setInvoiceType(type);
    setInvoiceDialog(true);
  };
  
  return (
    <PageContainer>
      <PageHeader
        title={language === 'ar' ? "الإدارة المالية" : "Financial Management"}
        subtitle={language === 'ar' ? "إدارة المدفوعات والفواتير والتقارير المالية وعقود التقسيط" : "Manage payments, invoices, financial reporting and installment contracts"}
        icon={<PieChart className="w-6 h-6 text-blue-500" />}
        align={language === 'ar' ? 'right' : 'left'}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        {activeTab === "invoices" && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleOpenInvoiceGenerator('agreement')}
            className={`h-9 ${language === 'ar' ? 'flex-row-reverse' : ''}`}
          >
            <Printer className={language === 'ar' ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
            {language === 'ar' ? "إنشاء فاتورة" : "Generate Invoice"}
          </Button>
        )}
      </PageHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <TabsList className="grid grid-cols-1 md:grid-cols-4 w-full">
          <TabsTrigger value="dashboard" className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <BarChartBig className={language === 'ar' ? "h-4 w-4 ml-2" : "h-4 w-4 mr-2"} />
            {language === 'ar' ? "لوحة التحكم المالية" : "Financial Dashboard"}
          </TabsTrigger>
          <TabsTrigger value="payments" className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <Receipt className={language === 'ar' ? "h-4 w-4 ml-2" : "h-4 w-4 mr-2"} />
            {language === 'ar' ? "المدفوعات" : "Payments"}
          </TabsTrigger>
          <TabsTrigger value="invoices" className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <FileText className={language === 'ar' ? "h-4 w-4 ml-2" : "h-4 w-4 mr-2"} />
            {language === 'ar' ? "قوالب الفواتير" : "Invoice Templates"}
          </TabsTrigger>
          <TabsTrigger value="installments" className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <FileSpreadsheet className={language === 'ar' ? "h-4 w-4 ml-2" : "h-4 w-4 mr-2"} />
            {language === 'ar' ? "عقود التقسيط" : "Installment Contracts"}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-6">
          {activeTab === "dashboard" && <FinancialDashboard />}
        </TabsContent>
        
        <TabsContent value="payments" className="space-y-6">
          {activeTab === "payments" && <PaymentsTab />}
        </TabsContent>
        
        <TabsContent value="invoices" className="space-y-6">
          {activeTab === "invoices" && <InvoiceTemplateEditor />}
        </TabsContent>
        
        <TabsContent value="installments" className="space-y-6">
          {activeTab === "installments" && <CarInstallmentContracts />}
        </TabsContent>
      </Tabs>
      
      <Dialog open={invoiceDialog} onOpenChange={setInvoiceDialog}>
        <DialogContent className="max-w-3xl" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <DialogHeader className={language === 'ar' ? 'text-right' : 'text-left'}>
            <DialogTitle>{language === 'ar' ? "إنشاء فاتورة" : "Generate Invoice"}</DialogTitle>
            <DialogDescription>
              {language === 'ar' ? "إنشاء وتخصيص فاتورة من قالب" : "Create and customize an invoice from a template"}
            </DialogDescription>
          </DialogHeader>
          
          <InvoiceGenerator 
            recordType={invoiceType}
            recordId="12345"
            onClose={() => setInvoiceDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default Financials;
