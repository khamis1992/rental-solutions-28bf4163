import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageCircle, 
  Send, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Phone, 
  DollarSign, 
  Calendar,
  User,
  RefreshCw,
  AlertTriangle,
  Users,
  Activity,
  Shield,
  UserPlus,
  Database,
  Info,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { useCustomers } from '@/hooks/use-customers';
import { supabase } from '@/lib/supabase';

interface WhatsAppStats {
  totalSent: number;
  totalFailed: number;
  totalCost: number;
  byType: Record<string, number>;
}

interface ServiceStatus {
  available: boolean;
  error?: string;
  fromNumber: string;
}

interface SelectedCustomer {
  id: string;
  full_name: string;
  phone: string;
  email: string;
}

interface NextPayment {
  amount: number;
  dueDate: string | null;
  agreementNumber: string | null;
  isOverdue: boolean;
  daysOverdue?: number;
}

export const WhatsAppReminders: React.FC = () => {
  const [stats, setStats] = useState<WhatsAppStats>({
    totalSent: 0,
    totalFailed: 0,
    totalCost: 0,
    byType: {}
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingCustomers, setIsCreatingCustomers] = useState(false);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>({ 
    available: false, 
    fromNumber: '', 
    error: 'Loading...' 
  });
  
  // Customer selection states
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<SelectedCustomer | null>(null);
  const [amount, setAmount] = useState(500);
  const [nextPayment, setNextPayment] = useState<NextPayment | null>(null);
  const [results, setResults] = useState<Array<{ type: string; message: string; success: boolean; timestamp: Date }>>([]);

  // جلب قائمة العملاء
  const { customers, isLoading: isLoadingCustomers, refreshCustomers } = useCustomers();

  // Load saved stats from localStorage
  useEffect(() => {
    const savedStats = localStorage.getItem('whatsapp-send-stats');
    if (savedStats) {
      const parsed = JSON.parse(savedStats);
      setStats({
        totalSent: parsed.sent || 0,
        totalFailed: parsed.failed || 0,
        totalCost: parsed.totalCost || 0,
        byType: {}
      });
    }
  }, []);

  // Check service status on component mount
  useEffect(() => {
    const checkServiceStatus = async () => {
      try {
        const { twilioWhatsAppService } = await import('@/services/TwilioWhatsAppService');
        const status = await twilioWhatsAppService.getServiceStatus();
        setServiceStatus(status);
      } catch (error) {
        setServiceStatus({
          available: false,
          error: 'Failed to load WhatsApp service',
          fromNumber: ''
        });
      }
    };
    
    checkServiceStatus();
    
    // جلب العملاء الحقيقيين من قاعدة البيانات
    console.log('🔍 جاري جلب العملاء من قاعدة البيانات...');
    refreshCustomers();
  }, []);

  // تحديث بيانات العميل المختار عند تغيير الاختيار
  useEffect(() => {
    console.log('🔍 Customers data:', customers);
    console.log('🔍 Selected customer ID:', selectedCustomerId);
    
    if (selectedCustomerId && customers.length > 0) {
      const customer = customers.find(c => c.id === selectedCustomerId);
      console.log('🔍 Found customer:', customer);
      
      if (customer) {
        // Type assertion للتعامل مع اختلاف هيكل البيانات
        const customerData = customer as any;
        setSelectedCustomer({
          id: customerData.id!,
          full_name: customerData.full_name || 'عميل',
          phone: customerData.phone || '',
          email: customerData.email || ''
        });
        // جلب الدفعة التالية المستحقة
        fetchNextPayment(customerData.id!);
      }
    } else {
      setSelectedCustomer(null);
      setNextPayment(null);
      setAmount(500); // إعادة تعيين للمبلغ الافتراضي
    }
  }, [selectedCustomerId, customers]);

  // جلب الدفعة التالية المستحقة للعميل
  const fetchNextPayment = async (customerId: string) => {
    setIsLoadingPayment(true);
    try {
      console.log('🔍 جاري البحث عن الدفعة التالية للعميل:', customerId);
      
      // البحث في unified_payments أولاً
      const { data: unifiedPayments, error: unifiedError } = await supabase
        .from('unified_payments')
        .select(`
          *,
          leases!inner(customer_id)
        `)
        .eq('leases.customer_id', customerId)
        .in('status', ['pending', 'overdue'])
        .order('original_due_date', { ascending: true })
        .limit(1);

      if (unifiedError) {
        console.error('خطأ في جلب unified_payments:', unifiedError);
      }

      let nextPaymentData: NextPayment | null = null;

      if (unifiedPayments && unifiedPayments.length > 0) {
        const payment = unifiedPayments[0];
        const dueDate = payment.original_due_date || payment.payment_date;
        const today = new Date();
        const paymentDueDate = dueDate ? new Date(dueDate) : null;
        const isOverdue = paymentDueDate ? paymentDueDate < today : false;
        const daysOverdue = isOverdue && paymentDueDate 
          ? Math.floor((today.getTime() - paymentDueDate.getTime()) / (1000 * 60 * 60 * 24))
          : 0;

        nextPaymentData = {
          amount: payment.amount || 500,
          dueDate: dueDate,
          agreementNumber: payment.reference_number || null,
          isOverdue,
          daysOverdue
        };

        console.log('✅ تم العثور على دفعة في unified_payments:', nextPaymentData);
      }

      // إذا لم نجد في unified_payments، نبحث في payment_schedules
      if (!nextPaymentData) {
        const { data: schedulePayments, error: scheduleError } = await supabase
          .from('payment_schedules')
          .select(`
            *,
            leases!inner(customer_id, agreement_number)
          `)
          .eq('leases.customer_id', customerId)
          .in('status', ['pending', 'overdue'])
          .order('due_date', { ascending: true })
          .limit(1);

        if (scheduleError) {
          console.error('خطأ في جلب payment_schedules:', scheduleError);
        }

        if (schedulePayments && schedulePayments.length > 0) {
          const payment = schedulePayments[0];
          const dueDate = payment.due_date;
          const today = new Date();
          const paymentDueDate = dueDate ? new Date(dueDate) : null;
          const isOverdue = paymentDueDate ? paymentDueDate < today : false;
          const daysOverdue = isOverdue && paymentDueDate 
            ? Math.floor((today.getTime() - paymentDueDate.getTime()) / (1000 * 60 * 60 * 24))
            : 0;

          nextPaymentData = {
            amount: payment.amount || 500,
            dueDate: dueDate,
            agreementNumber: (payment as any).leases?.agreement_number || null,
            isOverdue,
            daysOverdue
          };

          console.log('✅ تم العثور على دفعة في payment_schedules:', nextPaymentData);
        }
      }

      // إذا لم نجد في الجدولين، نبحث في car_installment_payments
      if (!nextPaymentData) {
        const { data: installmentPayments, error: installmentError } = await supabase
          .from('car_installment_payments')
          .select(`
            *,
            car_installment_contracts!inner(customer_id)
          `)
          .eq('car_installment_contracts.customer_id', customerId)
          .in('status', ['pending', 'overdue'])
          .order('payment_date', { ascending: true })
          .limit(1);

        if (installmentError) {
          console.error('خطأ في جلب car_installment_payments:', installmentError);
        }

        if (installmentPayments && installmentPayments.length > 0) {
          const payment = installmentPayments[0];
          const dueDate = payment.payment_date;
          const today = new Date();
          const paymentDueDate = dueDate ? new Date(dueDate) : null;
          const isOverdue = paymentDueDate ? paymentDueDate < today : false;
          const daysOverdue = isOverdue && paymentDueDate 
            ? Math.floor((today.getTime() - paymentDueDate.getTime()) / (1000 * 60 * 60 * 24))
            : 0;

          nextPaymentData = {
            amount: payment.amount || 500,
            dueDate: dueDate,
            agreementNumber: payment.cheque_number || null,
            isOverdue,
            daysOverdue
          };

          console.log('✅ تم العثور على دفعة في car_installment_payments:', nextPaymentData);
        }
      }

      if (nextPaymentData) {
        setNextPayment(nextPaymentData);
        setAmount(nextPaymentData.amount);
        console.log('💰 تم تحديد المبلغ تلقائياً:', nextPaymentData.amount);
      } else {
        console.log('⚠️ لم يتم العثور على دفعات مستحقة للعميل');
        setNextPayment(null);
        setAmount(500); // مبلغ افتراضي
      }

    } catch (error) {
      console.error('❌ خطأ في جلب الدفعة التالية:', error);
      setNextPayment(null);
      setAmount(500);
    } finally {
      setIsLoadingPayment(false);
    }
  };

  const sendMessage = async (messageType: 'reminder' | 'overdue' | 'confirmation' | 'monthly_reminder' | 'delay_penalty' | 'final_warning' | 'legal_action' | 'manager_report') => {
    if (!serviceStatus.available) {
      toast.error('خدمة الواتساب غير متاحة: ' + (serviceStatus.error || 'خطأ غير معروف'));
      return;
    }

    if (!selectedCustomer) {
      toast.error('الرجاء اختيار عميل من القائمة');
      return;
    }

    if (!selectedCustomer.phone) {
      toast.error('رقم هاتف العميل غير متوفر');
      return;
    }

    setIsLoading(true);
    try {
      const { twilioWhatsAppService } = await import('@/services/TwilioWhatsAppService');
      let result;

      // استخدام تاريخ الدفعة الفعلي إذا كان متوفراً
      const dueDate = nextPayment?.dueDate 
        ? nextPayment.dueDate
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const contractType = nextPayment?.agreementNumber 
        ? `عقد ${nextPayment.agreementNumber}`
        : 'تأجير سيارة';

      switch (messageType) {
        case 'reminder':
          result = await twilioWhatsAppService.sendPaymentReminder(
            selectedCustomer.phone,
            selectedCustomer.full_name,
            amount,
            dueDate,
            contractType
          );
          break;
        
        case 'overdue':
          const daysOverdue = nextPayment?.daysOverdue || 15;
          result = await twilioWhatsAppService.sendOverduePaymentAlert(
            selectedCustomer.phone,
            selectedCustomer.full_name,
            amount,
            daysOverdue,
            contractType
          );
          break;
        
        case 'confirmation':
          result = await twilioWhatsAppService.sendPaymentConfirmation(
            selectedCustomer.phone,
            selectedCustomer.full_name,
            amount,
            new Date().toLocaleDateString('ar-QA'),
            contractType,
            'R-' + Math.random().toString(36).substr(2, 9).toUpperCase()
          );
          break;

        case 'monthly_reminder':
          result = await twilioWhatsAppService.sendMonthlyReminder(
            selectedCustomer.phone,
            selectedCustomer.full_name,
            amount,
            dueDate,
            nextPayment?.agreementNumber || 'C-' + Math.random().toString(36).substr(2, 6),
            5 // default remaining installments
          );
          break;

        case 'delay_penalty':
          const penaltyAmount = Math.round(amount * 0.05); // 5% penalty
          result = await twilioWhatsAppService.sendDelayPenalty(
            selectedCustomer.phone,
            selectedCustomer.full_name,
            amount,
            penaltyAmount,
            nextPayment?.daysOverdue || 30,
            nextPayment?.agreementNumber || 'C-' + Math.random().toString(36).substr(2, 6),
            amount + penaltyAmount
          );
          break;

        case 'final_warning':
          result = await twilioWhatsAppService.sendFinalWarning(
            selectedCustomer.phone,
            selectedCustomer.full_name,
            amount,
            nextPayment?.agreementNumber || 'C-' + Math.random().toString(36).substr(2, 6),
            nextPayment?.daysOverdue || 60
          );
          break;

        case 'legal_action':
          result = await twilioWhatsAppService.sendLegalAction(
            selectedCustomer.phone,
            selectedCustomer.full_name,
            amount,
            nextPayment?.agreementNumber || 'C-' + Math.random().toString(36).substr(2, 6),
            'سيارة تويوتا كامري 2020 - لوحة 123456'
          );
          break;

        case 'manager_report':
          result = await twilioWhatsAppService.sendManagerReport(
            selectedCustomer.phone, // سيتم استخدامه كرقم المدير
            selectedCustomer.full_name, // سيتم استخدامه كاسم المدير
            new Date().toLocaleDateString('ar-QA'),
            15, // total collections
            5, // overdue payments
            3, // new contracts
            // 45000 - removed unused variable// total revenue
            // 25 - removed unused variable// active vehicles
          );
          break;
      }

      if (result.success) {
        const successMessage = `✅ تم إرسال ${getMessageTypeName(messageType)} إلى ${selectedCustomer.full_name} بنجاح!\nمعرف الرسالة: ${result.messageId}`;
        addResult(getMessageTypeName(messageType), successMessage, true);
        updateStats(true);
        toast.success(`تم إرسال ${getMessageTypeName(messageType)} إلى ${selectedCustomer.full_name} بنجاح!`);
        setShowSendDialog(false);
      } else {
        const errorMessage = `❌ فشل في إرسال ${getMessageTypeName(messageType)} إلى ${selectedCustomer.full_name}:\n${result.error}`;
        addResult(getMessageTypeName(messageType), errorMessage, false);
        updateStats(false);
        toast.error('فشل في إرسال الرسالة: ' + result.error);
      }
    } catch (error) {
      const errorMessage = `❌ خطأ في النظام:\n${error instanceof Error ? error.message : 'خطأ غير معروف'}`;
      addResult('خطأ نظام', errorMessage, false);
      updateStats(false);
      toast.error('خطأ في إرسال الرسالة');
      console.error(error);
    }
    setIsLoading(false);
  };

  const getMessageTypeName = (type: string) => {
    const names = {
      reminder: 'تذكير دفعة',
      overdue: 'تنبيه دفعة متأخرة',
      confirmation: 'تأكيد استلام دفعة',
      monthly_reminder: 'تذكير شهري',
      delay_penalty: 'إنذار غرامة تأخير',
      final_warning: 'إنذار نهائي قانوني',
      legal_action: 'إنذار إجراء قانوني',
      manager_report: 'تقرير المدير العام'
    };
    return names[type as keyof typeof names] || type;
  };

  const addResult = (type: string, message: string, success: boolean) => {
    const newResult = { type, message, success, timestamp: new Date() };
    setResults(prev => [newResult, ...prev].slice(0, 10));
  };

  const updateStats = (success: boolean) => {
    const savedStats = localStorage.getItem('whatsapp-send-stats');
    let currentStats = { sent: 0, failed: 0, totalCost: 0 };
    
    if (savedStats) {
      currentStats = JSON.parse(savedStats);
    }
    
    const newStats = {
      sent: success ? currentStats.sent + 1 : currentStats.sent,
      failed: success ? currentStats.failed : currentStats.failed + 1,
      totalCost: success ? currentStats.totalCost + 0.005 : currentStats.totalCost
    };
    
    localStorage.setItem('whatsapp-send-stats', JSON.stringify(newStats));
    
    // تحديث local state أيضاً
    setStats({
      totalSent: newStats.sent,
      totalFailed: newStats.failed,
      totalCost: newStats.totalCost,
      byType: {}
    });
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return 'غير متوفر';
    if (phone.startsWith('+974')) return phone;
    if (phone.startsWith('974')) return `+${phone}`;
    if (phone.length === 8 && /^[3-9]/.test(phone)) return `+974${phone}`;
    return phone;
  };

  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return 'غير محدد';
    try {
      return new Date(dueDate).toLocaleDateString('ar-QA');
    } catch {
      return 'تاريخ غير صحيح';
    }
  };

  const clearResults = () => {
    setResults([]);
    toast.success('تم مسح السجل');
  };

  const clearStats = () => {
    const emptyStats = { sent: 0, failed: 0, totalCost: 0 };
    localStorage.setItem('whatsapp-send-stats', JSON.stringify(emptyStats));
    setStats({
      totalSent: 0,
      totalFailed: 0,
      totalCost: 0,
      byType: {}
    });
    toast.success('تم مسح الإحصائيات');
  };

  const successRate = (stats.totalSent + stats.totalFailed) > 0 
    ? Math.round((stats.totalSent / (stats.totalSent + stats.totalFailed)) * 100)
    : 0;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Service Status Alert */}
      <Alert className={serviceStatus.available ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
        <div className="flex items-center gap-2">
          {serviceStatus.available ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-red-600" />
          )}
          <AlertDescription className={serviceStatus.available ? 'text-green-800' : 'text-red-800'}>
            <strong>
              {serviceStatus.available ? '🟢 خدمة الواتساب متاحة وجاهزة للاستخدام' : '🔴 خدمة الواتساب غير متاحة'}
            </strong>
            {serviceStatus.error && <div className="mt-1 text-sm">{serviceStatus.error}</div>}
          </AlertDescription>
        </div>
      </Alert>

      {/* No Customers Alert */}
      {customers.length === 0 && !isLoadingCustomers && (
        <Alert className="border-blue-200 bg-blue-50">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>لا توجد عملاء متاحين حالياً</strong>
              <div className="mt-1 text-sm">يمكنك إضافة عملاء جدد من صفحة العملاء في النظام.</div>
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">رسائل ناجحة</p>
                <p className="text-2xl font-bold text-green-800">{stats.totalSent}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 font-medium">رسائل فاشلة</p>
                <p className="text-2xl font-bold text-red-800">{stats.totalFailed}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium">التكلفة</p>
                <p className="text-2xl font-bold text-blue-800">${stats.totalCost.toFixed(3)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700 font-medium">معدل النجاح</p>
                <p className="text-2xl font-bold text-purple-800">{successRate}%</p>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-6 w-6 text-green-600" />
          <div>
            <h2 className="text-2xl font-bold">إرسال رسائل الواتساب</h2>
            <p className="text-sm text-gray-600">النظام جاهز للاستخدام - إرسال رسائل التذكير والإشعارات للعملاء</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={clearStats}
            variant="outline"
            size="sm"
          >
            مسح الإحصائيات
          </Button>
          
          <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Send className="h-4 w-4 ml-2" />
                إرسال رسالة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl" dir="rtl">
              <DialogHeader>
                <DialogTitle>إرسال رسالة واتساب</DialogTitle>
                <DialogDescription>
                  اختر عميل وقم بإرسال رسالة تذكير أو إشعار مع تحديد المبلغ تلقائياً.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Customer Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="customer">اختيار العميل</Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={refreshCustomers}
                        disabled={isLoadingCustomers}
                      >
                        <RefreshCw className={`h-4 w-4 ${isLoadingCustomers ? 'animate-spin' : ''}`} />
                        تحديث
                      </Button>
                      

                    </div>
                  </div>
                  <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر عميل من القائمة..." />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingCustomers ? (
                        <SelectItem value="loading" disabled>
                          جاري تحميل العملاء...
                        </SelectItem>
                      ) : customers.length === 0 ? (
                        <SelectItem value="no-customers" disabled>
                          لا توجد عملاء متاحين
                        </SelectItem>
                      ) : (
                        customers.map((customer) => {
                          const customerData = customer as any;
                          return (
                            <SelectItem key={customerData.id} value={customerData.id!}>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <div>
                                  <div className="font-medium">{customerData.full_name || 'عميل'}</div>
                                  <div className="text-xs text-gray-500">
                                    <span className="phone-number-ltr" dir="ltr">{formatPhoneNumber(customerData.phone || customerData.phone_number || '')}</span>
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Customer Info Display */}
                {selectedCustomer && (
                  <Card className="p-4 bg-blue-50 border-blue-200">
                    <h3 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      معلومات العميل المختار
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-600" />
                        <span className="text-gray-600">الاسم:</span>
                        <span className="font-medium">{selectedCustomer.full_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-blue-600" />
                        <span className="text-gray-600">الهاتف:</span>
                        <span className="font-medium font-mono" dir="ltr">
                          <span className="phone-number-ltr" dir="ltr">{formatPhoneNumber(selectedCustomer.phone)}</span>
                        </span>
                      </div>
                      {selectedCustomer.email && (
                        <div className="flex items-center gap-2 md:col-span-2">
                          <span className="text-gray-600">البريد الإلكتروني:</span>
                          <span className="font-medium">{selectedCustomer.email}</span>
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                {/* Next Payment Info */}
                {selectedCustomer && (
                  <Card className={`p-4 ${
                    nextPayment?.isOverdue 
                      ? 'bg-red-50 border-red-200' 
                      : nextPayment 
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gray-50 border-gray-200'
                  }`}>
                    <h3 className={`font-medium mb-3 flex items-center gap-2 ${
                      nextPayment?.isOverdue 
                        ? 'text-red-800' 
                        : nextPayment 
                          ? 'text-green-800'
                          : 'text-gray-600'
                    }`}>
                      {isLoadingPayment ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : nextPayment?.isOverdue ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : nextPayment ? (
                        <Calendar className="h-4 w-4" />
                      ) : (
                        <Info className="h-4 w-4" />
                      )}
                      {isLoadingPayment ? 'جاري البحث عن الدفعات...' : 
                       nextPayment?.isOverdue ? 'دفعة متأخرة' :
                       nextPayment ? 'الدفعة التالية المستحقة' : 'لا توجد دفعات مستحقة'}
                    </h3>
                    
                    {!isLoadingPayment && (
                      <div className="space-y-2 text-sm">
                        {nextPayment ? (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">المبلغ:</span>
                              <span className="font-bold text-lg">{nextPayment.amount} ر.ق</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">تاريخ الاستحقاق:</span>
                              <span className="font-medium">{formatDueDate(nextPayment.dueDate)}</span>
                            </div>
                            {nextPayment.agreementNumber && (
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600">رقم العقد:</span>
                                <span className="font-medium">{nextPayment.agreementNumber}</span>
                              </div>
                            )}
                            {nextPayment.isOverdue && nextPayment.daysOverdue && (
                              <div className="flex items-center justify-between">
                                <span className="text-red-600">أيام التأخير:</span>
                                <span className="font-bold text-red-600">{nextPayment.daysOverdue} يوم</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-gray-600 text-center py-2">لا توجد دفعات معلقة أو متأخرة لهذا العميل</p>
                        )}
                      </div>
                    )}
                  </Card>
                )}

                <div>
                  <Label htmlFor="amount">المبلغ (ريال قطري)</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      placeholder="500"
                    />
                    {nextPayment && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAmount(nextPayment.amount)}
                        className="whitespace-nowrap"
                      >
                        استخدام المبلغ المستحق
                      </Button>
                    )}
                  </div>
                  {nextPayment && (
                    <p className="text-xs text-green-600 mt-1">
                      💡 تم تحديد المبلغ تلقائياً بناءً على الدفعة المستحقة ({nextPayment.amount} ر.ق)
                    </p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button 
                    onClick={() => sendMessage('reminder')}
                    disabled={isLoading || !selectedCustomer}
                    className="bg-blue-600 hover:bg-blue-700 h-16"
                  >
                    {isLoading ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Clock className="h-5 w-5" />
                        <span>تذكير دفعة</span>
                      </div>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={() => sendMessage('overdue')}
                    disabled={isLoading || !selectedCustomer}
                    className="bg-red-600 hover:bg-red-700 h-16"
                  >
                    {isLoading ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        <span>دفعة متأخرة</span>
                      </div>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={() => sendMessage('confirmation')}
                    disabled={isLoading || !selectedCustomer}
                    className="bg-green-600 hover:bg-green-700 h-16"
                  >
                    {isLoading ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        <span>تأكيد استلام</span>
                      </div>
                    )}
                  </Button>
                </div>

                {/* القوالب الجديدة المعتمدة */}
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-800 mb-3">القوالب الجديدة المعتمدة</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Button 
                      onClick={() => sendMessage('monthly_reminder')}
                      disabled={isLoading || !selectedCustomer}
                      className="bg-indigo-600 hover:bg-indigo-700 h-16"
                    >
                      {isLoading ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          <span>تذكير شهري (28)</span>
                        </div>
                      )}
                    </Button>
                    
                    <Button 
                      onClick={() => sendMessage('delay_penalty')}
                      disabled={isLoading || !selectedCustomer}
                      className="bg-orange-600 hover:bg-orange-700 h-16"
                    >
                      {isLoading ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <AlertTriangle className="h-5 w-5" />
                          <span>غرامة تأخير (1)</span>
                        </div>
                      )}
                    </Button>
                    
                    <Button 
                      onClick={() => sendMessage('final_warning')}
                      disabled={isLoading || !selectedCustomer}
                      className="bg-red-700 hover:bg-red-800 h-16"
                    >
                      {isLoading ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <AlertTriangle className="h-5 w-5" />
                          <span>إنذار نهائي</span>
                        </div>
                      )}
                    </Button>
                    
                    <Button 
                      onClick={() => sendMessage('legal_action')}
                      disabled={isLoading || !selectedCustomer}
                      className="bg-gray-800 hover:bg-gray-900 h-16"
                    >
                      {isLoading ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <AlertTriangle className="h-5 w-5" />
                          <span>إجراء قانوني (24 ساعة)</span>
                        </div>
                      )}
                    </Button>
                  </div>
                  
                  <div className="mt-4">
                    <Button 
                      onClick={() => sendMessage('manager_report')}
                      disabled={isLoading || !selectedCustomer}
                      className="bg-purple-600 hover:bg-purple-700 h-16 w-full"
                    >
                      {isLoading ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <BarChart3 className="h-5 w-5" />
                          <span>تقرير المدير العام (1-10)</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </div>

                {!selectedCustomer && (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      يرجى اختيار عميل من القائمة أعلاه لإرسال الرسالة
                    </AlertDescription>
                  </Alert>
                )}

                {/* Recent Results */}
                {results.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">نتائج الإرسال</h3>
                      <Button variant="outline" size="sm" onClick={clearResults}>
                        مسح السجل
                      </Button>
                    </div>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {results.map((result, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border ${
                            result.success
                              ? 'bg-green-50 border-green-200 text-green-800'
                              : 'bg-red-50 border-red-200 text-red-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{result.type}</div>
                            <div className="text-xs opacity-75">
                              {result.timestamp.toLocaleTimeString('ar-QA')}
                            </div>
                          </div>
                          <div className="mt-1 text-sm whitespace-pre-line">{result.message}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppReminders;
