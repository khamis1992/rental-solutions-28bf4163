import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageCircle, 
  Send, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  DollarSign,
  Phone,
  User,
  Calendar,
  CreditCard,
  Shield,
  Activity,
  Users,
  RefreshCw,
  UserPlus,
  Database,
  Info,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/PageContainer';
import { useCustomers } from '@/hooks/use-customers';
import { supabase } from '@/lib/supabase';
import { twilioWhatsAppService } from '@/services/TwilioWhatsAppService';

  interface ServiceStatus {
    available: boolean;
    error?: string;
    fromNumber?: string;
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

interface TestResult {
  type: 'status' | 'message';
  success: boolean;
  message: string;
  details?: any;
}

const WhatsAppTest: React.FC = () => {
  const [stats, setStats] = useState({ sent: 0, failed: 0, totalCost: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingCustomers, setIsCreatingCustomers] = useState(false);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
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
  const [results, setResults] = useState<TestResult[]>([]);

  // جلب قائمة العملاء
  const { customers, isLoading: isLoadingCustomers, refreshCustomers } = useCustomers();

  // Load saved stats from localStorage
  useEffect(() => {
    const savedStats = localStorage.getItem('whatsapp-send-stats');
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }
  }, []);

  // Check service status on component mount
  useEffect(() => {
    const checkServiceStatus = async () => {
      try {
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
          phone: customerData.phone || customerData.phone_number || '',
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

  // إنشاء عملاء تجريبيين
  const createSampleCustomers = async () => {
    setIsCreatingCustomers(true);
    try {
      const sampleCustomers = [
        {
          full_name: 'أحمد محمد العلي',
          email: 'ahmed.ali@example.com',
          phone_number: '+97433123456',
          driver_license: 'DL123456',
          nationality: 'قطري',
          address: 'الدوحة، قطر',
          notes: 'عميل جديد - تم إنشاؤه تلقائياً',
          status: 'active',
          role: 'customer'
        },
        {
          full_name: 'فاطمة أحمد الكعبي',
          email: 'fatima.kaabi@example.com',
          phone_number: '+97455987654',
          driver_license: 'DL789012',
          nationality: 'قطري',
          address: 'الريان، قطر',
          notes: 'عميل مميز - تم إنشاؤه تلقائياً',
          status: 'active',
          role: 'customer'
        },
        {
          full_name: 'محمد علي السليطي',
          email: 'mohamed.sulaiti@example.com',
          phone_number: '+97470456789',
          driver_license: 'DL345678',
          nationality: 'قطري',
          address: 'الوكرة، قطر',
          notes: 'عميل منتظم - تم إنشاؤه تلقائياً',
          status: 'active',
          role: 'customer'
        },
        {
          full_name: 'عائشة سالم المري',
          email: 'aisha.marri@example.com',
          phone_number: '+97466654321',
          driver_license: 'DL567890',
          nationality: 'قطري',
          address: 'الخور، قطر',
          notes: 'عميل جديد - تم إنشاؤه تلقائياً',
          status: 'active',
          role: 'customer'
        },
        {
          full_name: 'خالد عبدالله الثاني',
          email: 'khalid.thani@example.com',
          phone_number: '+97444321987',
          driver_license: 'DL098765',
          nationality: 'قطري',
          address: 'أم صلال، قطر',
          notes: 'عميل VIP - تم إنشاؤه تلقائياً',
          status: 'active',
          role: 'customer'
        }
      ];

      console.log('🔄 جاري إنشاء العملاء التجريبيين...');
      
      const { data, error } = await supabase
        .from('profiles')
        .insert(sampleCustomers)
        .select();

      if (error) {
        console.error('❌ خطأ في إنشاء العملاء:', error);
        toast.error('فشل في إنشاء العملاء التجريبيين: ' + error.message);
        return;
      }

      console.log('✅ تم إنشاء العملاء التجريبيين بنجاح:', data.length, 'عميل');
      toast.success(`✅ تم إنشاء ${data.length} عملاء تجريبيين بنجاح!`);
      
      // تحديث قائمة العملاء
      await refreshCustomers();
      
    } catch (error) {
      console.error('❌ خطأ عام:', error);
      toast.error('خطأ في إنشاء العملاء التجريبيين');
    } finally {
      setIsCreatingCustomers(false);
    }
  };

  const sendMessage = async (messageType: 'reminder' | 'overdue' | 'confirmation') => {
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
      }

      if (result.success) {
        const successMessage = `✅ تم إرسال ${getMessageTypeName(messageType)} إلى ${selectedCustomer.full_name} بنجاح!\nمعرف الرسالة: ${result.messageId}`;
        addResult({
          type: 'message',
          success: true,
          message: successMessage,
          details: result
        });
        updateStats(true);
        toast.success(`تم إرسال ${getMessageTypeName(messageType)} إلى ${selectedCustomer.full_name} بنجاح!`);
      } else {
        const errorMessage = `❌ فشل في إرسال ${getMessageTypeName(messageType)} إلى ${selectedCustomer.full_name}:\n${result.error}`;
        addResult({
          type: 'message',
          success: false,
          message: errorMessage,
          details: result
        });
        updateStats(false);
        toast.error('فشل في إرسال الرسالة: ' + result.error);
      }
    } catch (error) {
      const errorMessage = `❌ خطأ في النظام:\n${error instanceof Error ? error.message : 'خطأ غير معروف'}`;
      addResult({
        type: 'message',
        success: false,
        message: errorMessage,
        details: error
      });
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
      confirmation: 'تأكيد استلام دفعة'
    };
    return names[type as keyof typeof names] || type;
  };

  const addResult = (result: TestResult) => {
    setResults(prev => [result, ...prev].slice(0, 10));
  };

  const updateStats = (success: boolean) => {
    const newStats = {
      sent: success ? stats.sent + 1 : stats.sent,
      failed: success ? stats.failed : stats.failed + 1,
      totalCost: success ? stats.totalCost + 0.005 : stats.totalCost
    };
    setStats(newStats);
    localStorage.setItem('whatsapp-send-stats', JSON.stringify(newStats));
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
    setStats(emptyStats);
    localStorage.setItem('whatsapp-send-stats', JSON.stringify(emptyStats));
    toast.success('تم مسح الإحصائيات');
  };

  const successRate = (stats.sent + stats.failed) > 0 ? Math.round((stats.sent / (stats.sent + stats.failed)) * 100) : 0;

  const testServiceStatus = async () => {
    setIsLoading(true);
    try {
      const status = await twilioWhatsAppService.getServiceStatus();
      addResult({
        type: 'status',
        success: status.available,
        message: status.available 
          ? 'خدمة الواتساب متاحة وجاهزة للاستخدام' 
          : `خدمة الواتساب غير متاحة: ${status.error}`,
        details: status
      });
    } catch (error) {
      addResult({
        type: 'status',
        success: false,
        message: `خطأ في اختبار الحالة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`,
        details: error
      });
    }
    setIsLoading(false);
  };

  const sendTestMessage = async () => {
    if (!selectedCustomer || !selectedCustomer.phone || !selectedCustomer.full_name) {
      addResult({
        type: 'message',
        success: false,
        message: 'يرجى اختيار عميل من القائمة'
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await twilioWhatsAppService.sendMessage(selectedCustomer.phone, selectedCustomer.full_name, 'general');
      addResult({
        type: 'message',
        success: result.success,
        message: result.success 
          ? `تم إرسال الرسالة بنجاح! معرف الرسالة: ${result.messageId}`
          : `فشل في إرسال الرسالة: ${result.error}`,
        details: result
      });
    } catch (error) {
      addResult({
        type: 'message',
        success: false,
        message: `خطأ في إرسال الرسالة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`,
        details: error
      });
    }
    setIsLoading(false);
  };

  return (
    <PageContainer
      title="إرسال رسائل الواتساب"
    >
      <div className="space-y-6" dir="rtl">
        
        {/* Page Description */}
        <div className="text-center">
          <p className="text-lg text-gray-600">النظام جاهز للاستخدام - إرسال رسائل التذكير والإشعارات للعملاء</p>
        </div>

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

        {/* No Customers Alert with Create Button */}
        {customers.length === 0 && !isLoadingCustomers && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>لا توجد عملاء في النظام</strong>
                  <div className="mt-1 text-sm">يمكنك إنشاء عملاء تجريبيين للاختبار أو إضافة عملاء جدد.</div>
                </AlertDescription>
              </div>
              <Button
                onClick={createSampleCustomers}
                disabled={isCreatingCustomers}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                {isCreatingCustomers ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                إنشاء عملاء تجريبيين
              </Button>
            </div>
          </Alert>
        )}

        {/* Customer Selection Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              اختيار العميل
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 ml-4">
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
                                  {formatPhoneNumber(customerData.phone || customerData.phone_number || '')}
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
                
                {customers.length === 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={createSampleCustomers}
                    disabled={isCreatingCustomers}
                  >
                    {isCreatingCustomers ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Database className="h-4 w-4" />
                    )}
                    إنشاء عملاء
                  </Button>
                )}
              </div>
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
                      {formatPhoneNumber(selectedCustomer.phone)}
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
          </CardContent>
        </Card>

        {/* Message Sending Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              إرسال الرسائل
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            {!selectedCustomer && (
              <Alert className="border-yellow-200 bg-yellow-50 mt-4">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  يرجى اختيار عميل من القائمة أعلاه لإرسال الرسالة
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 font-medium">رسائل ناجحة</p>
                  <p className="text-2xl font-bold text-green-800">{stats.sent}</p>
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
                  <p className="text-2xl font-bold text-red-800">{stats.failed}</p>
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

        {/* Results Section */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>نتائج الإرسال</CardTitle>
                <Button variant="outline" size="sm" onClick={clearResults}>
                  مسح السجل
                </Button>
              </div>
            </CardHeader>
            <CardContent>
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
                        {new Date().toLocaleTimeString('ar-QA')}
                      </div>
                    </div>
                    <div className="mt-1 text-sm whitespace-pre-line">{result.message}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>إعدادات سريعة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Phone className="h-5 w-5 text-blue-600" />
                  <h3 className="font-medium">رقم الواتساب</h3>
                </div>
                <p className="text-sm text-gray-600 font-mono" dir="ltr">
                  {import.meta.env.VITE_TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'}
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="h-5 w-5 text-green-600" />
                  <h3 className="font-medium">العملاء المتاحين</h3>
                </div>
                <p className="text-sm text-gray-600">{customers.length} عميل</p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="h-5 w-5 text-purple-600" />
                  <h3 className="font-medium">إجراءات</h3>
                </div>
                <Button variant="outline" size="sm" onClick={clearStats}>
                  مسح الإحصائيات
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Service Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right">فحص حالة الخدمة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 text-right">
              تحقق من أن خدمة الواتساب مكونة بشكل صحيح ومتصلة بـ Twilio
            </p>
            <Button 
              onClick={testServiceStatus}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
              فحص حالة الخدمة
            </Button>
          </CardContent>
        </Card>

        {/* Send Test Message */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right">إرسال رسالة اختبار</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="phone" className="text-right block mb-2">رقم الهاتف</Label>
              <Input
                id="phone"
                value={selectedCustomer?.phone || ''}
                onChange={(e) => setSelectedCustomer(prev => prev ? { ...prev, phone: e.target.value } : null)}
                placeholder="+97450000000"
                className="text-right"
                dir="ltr"
              />
              <p className="text-xs text-gray-500 text-right mt-1">
                أدخل رقم هاتف صحيح بصيغة +974XXXXXXXX
              </p>
            </div>

            <div>
              <Label htmlFor="message" className="text-right block mb-2">نص الرسالة</Label>
              <Textarea
                id="message"
                value={selectedCustomer?.full_name || ''}
                onChange={(e) => setSelectedCustomer(prev => prev ? { ...prev, full_name: e.target.value } : null)}
                placeholder="اكتب رسالتك هنا..."
                className="text-right min-h-[100px]"
                rows={4}
              />
            </div>

            <Button 
              onClick={sendTestMessage}
              disabled={isLoading || !selectedCustomer || !selectedCustomer.phone || !selectedCustomer.full_name}
              className="w-full"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
              إرسال رسالة اختبار
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default WhatsAppTest;
