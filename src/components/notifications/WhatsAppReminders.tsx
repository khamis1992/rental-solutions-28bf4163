import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessageCircle, Send, Clock, CheckCircle, XCircle, Phone, DollarSign, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';

interface WhatsAppStats {
  totalSent: number;
  totalFailed: number;
  totalCost: number;
  byType: Record<string, number>;
}

export const WhatsAppReminders: React.FC = () => {
  const [stats, setStats] = useState<WhatsAppStats>({
    totalSent: 0,
    totalFailed: 0,
    totalCost: 0,
    byType: {}
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [serviceStatus, setServiceStatus] = useState<{
    available: boolean;
    error?: string;
    fromNumber: string;
  }>({ available: false, fromNumber: '', error: 'Loading...' });
  const [testData, setTestData] = useState({
    phoneNumber: '+97450000000',
    customerName: 'عميل تجريبي',
    amount: 500,
    dueDate: '2024-01-15',
    contractType: 'تأجير سيارة'
  });

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
    loadStats();
  }, []);

  const sendTestMessage = async () => {
    if (!serviceStatus.available) {
      toast.error('خدمة الواتساب غير متاحة: ' + (serviceStatus.error || 'خطأ غير معروف'));
      return;
    }

    setIsLoading(true);
    try {
      const { twilioWhatsAppService } = await import('@/services/TwilioWhatsAppService');
      
      const result = await twilioWhatsAppService.sendPaymentReminder(
        testData.phoneNumber,
        testData.customerName,
        testData.amount,
        testData.dueDate,
        testData.contractType
      );

      if (result.success) {
        toast.success(`تم إرسال رسالة الاختبار بنجاح! المعرف: ${result.messageId}`);
        loadStats();
        setShowTestDialog(false);
      } else {
        toast.error('فشل في إرسال الرسالة: ' + result.error);
      }
    } catch (error) {
      toast.error('خطأ في إرسال الرسالة');
      console.error(error);
    }
    setIsLoading(false);
  };

  const sendOverdueTest = async () => {
    setIsLoading(true);
    try {
      const { twilioWhatsAppService } = await import('@/services/TwilioWhatsAppService');
      
      const result = await twilioWhatsAppService.sendOverduePaymentAlert(
        testData.phoneNumber,
        testData.customerName,
        testData.amount,
        15, // 15 days overdue
        testData.contractType
      );

      if (result.success) {
        toast.success(`تم إرسال تنبيه الدفعة المتأخرة! المعرف: ${result.messageId}`);
        loadStats();
      } else {
        toast.error('فشل في إرسال التنبيه: ' + result.error);
      }
    } catch (error) {
      toast.error('خطأ في إرسال التنبيه');
      console.error(error);
    }
    setIsLoading(false);
  };

  const sendConfirmationTest = async () => {
    setIsLoading(true);
    try {
      const { twilioWhatsAppService } = await import('@/services/TwilioWhatsAppService');
      
      const result = await twilioWhatsAppService.sendPaymentConfirmation(
        testData.phoneNumber,
        testData.customerName,
        testData.amount,
        new Date().toLocaleDateString('ar-QA'),
        testData.contractType,
        'R-' + Math.random().toString(36).substr(2, 9).toUpperCase()
      );

      if (result.success) {
        toast.success(`تم إرسال تأكيد الاستلام! المعرف: ${result.messageId}`);
        loadStats();
      } else {
        toast.error('فشل في إرسال التأكيد: ' + result.error);
      }
    } catch (error) {
      toast.error('خطأ في إرسال التأكيد');
      console.error(error);
    }
    setIsLoading(false);
  };

  const loadStats = async () => {
    try {
      const { twilioWhatsAppService } = await import('@/services/TwilioWhatsAppService');
      const statistics = await twilioWhatsAppService.getWhatsAppStats(30);
      setStats(statistics);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const getTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      'payment_reminder': 'تذكير دفعة',
      'overdue_payment': 'دفعة متأخرة',
      'payment_received': 'تأكيد استلام',
      'general': 'رسالة عامة'
    };
    return typeLabels[type] || type;
  };

  const successRate = stats && (stats.totalSent + stats.totalFailed) > 0 
    ? Math.round((stats.totalSent / (stats.totalSent + stats.totalFailed)) * 100)
    : 0;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Service Status Alert */}
      {!serviceStatus.available && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <h3 className="font-medium text-yellow-800">خدمة الواتساب غير متاحة</h3>
                <p className="text-sm text-yellow-700">
                  {serviceStatus.error || 'تحقق من إعدادات Twilio أو متغيرات البيئة'}
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  تأكد من وجود VITE_TWILIO_ACCOUNT_SID و VITE_TWILIO_AUTH_TOKEN في ملف .env
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-6 w-6 text-green-600" />
          <div>
            <h2 className="text-2xl font-bold">تذكيرات الواتساب</h2>
            <p className="text-sm text-gray-600">إدارة رسائل التذكير عبر واتساب</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={loadStats}
            variant="outline"
            size="sm"
          >
            تحديث الإحصائيات
          </Button>
          
          <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Send className="h-4 w-4 ml-2" />
                اختبار الرسائل
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" dir="rtl">
              <DialogHeader>
                <DialogTitle>اختبار رسائل الواتساب</DialogTitle>
                <DialogDescription>
                  إرسال رسائل تجريبية للتحقق من إعدادات خدمة الواتساب.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input
                    id="phone"
                    type="text"
                    value={testData.phoneNumber}
                    onChange={(e) => setTestData({...testData, phoneNumber: e.target.value})}
                    placeholder="+97450000000"
                    dir="ltr"
                    className="text-left"
                  />
                </div>
                
                <div>
                  <Label htmlFor="name">اسم العميل</Label>
                  <Input
                    id="name"
                    type="text"
                    value={testData.customerName}
                    onChange={(e) => setTestData({...testData, customerName: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="amount">المبلغ (ريال قطري)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={testData.amount}
                    onChange={(e) => setTestData({...testData, amount: Number(e.target.value)})}
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    onClick={sendTestMessage}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-xs"
                  >
                    تذكير دفعة
                  </Button>
                  
                  <Button 
                    onClick={sendOverdueTest}
                    disabled={isLoading}
                    className="bg-red-600 hover:bg-red-700 text-xs"
                  >
                    دفعة متأخرة
                  </Button>
                  
                  <Button 
                    onClick={sendConfirmationTest}
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700 text-xs"
                  >
                    تأكيد استلام
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">الرسائل المرسلة</p>
                <p className="text-2xl font-bold text-green-800">{stats?.totalSent || 0}</p>
                <p className="text-xs text-green-600">آخر 30 يوم</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 font-medium">الرسائل الفاشلة</p>
                <p className="text-2xl font-bold text-red-800">{stats?.totalFailed || 0}</p>
                <p className="text-xs text-red-600">تحتاج مراجعة</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium">التكلفة الإجمالية</p>
                <p className="text-2xl font-bold text-blue-800">${(stats.totalCost || 0).toFixed(3)}</p>
                <p className="text-xs text-blue-600">USD</p>
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
                <p className="text-xs text-purple-600">
                  {successRate >= 95 ? 'ممتاز' : successRate >= 80 ? 'جيد' : 'يحتاج تحسين'}
                </p>
              </div>
              <MessageCircle className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Message Types Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            إحصائيات أنواع الرسائل
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(stats?.byType || {}).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(stats?.byType || {}).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                    <span className="font-medium">{getTypeLabel(type)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {count} رسالة
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {Math.round((count / ((stats?.totalSent || 0) + (stats?.totalFailed || 0))) * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>لا توجد رسائل مرسلة بعد</p>
              <p className="text-sm">جرب إرسال رسالة اختبار لبدء الإحصائيات</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>إجراءات سريعة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <Phone className="h-5 w-5 text-blue-600" />
                <h3 className="font-medium">رقم Twilio الحالي</h3>
              </div>
              <p className="text-sm text-gray-600 font-mono" dir="ltr">
                {import.meta.env.VITE_TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'}
              </p>
            </div>
            
            <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="h-5 w-5 text-green-600" />
                <h3 className="font-medium">آخر تحديث</h3>
              </div>
              <p className="text-sm text-gray-600">
                {new Date().toLocaleDateString('ar-QA')} - {new Date().toLocaleTimeString('ar-QA')}
              </p>
            </div>
            
            <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="h-5 w-5 text-purple-600" />
                <h3 className="font-medium">متوسط التكلفة</h3>
              </div>
              <p className="text-sm text-gray-600">
                ${(stats?.totalSent || 0) > 0 ? ((stats?.totalCost || 0) / (stats?.totalSent || 1)).toFixed(4) : '0.0000'} لكل رسالة
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppReminders;
