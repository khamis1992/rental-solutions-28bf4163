import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { twilioWhatsAppService } from '@/services/TwilioWhatsAppService';
import { whatsAppAutomationService } from '@/services/WhatsAppAutomationService';
import { errorLogger } from '@/lib/errors/error-logger';
import { 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  MessageCircle,
  BarChart3,
  Gavel,
  Clock,
  DollarSign,
  Send
} from 'lucide-react';
import { toast } from 'sonner';

export const WhatsAppTemplateTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testPhone, setTestPhone] = useState('+97450000000');
  const [testCustomerName, setTestCustomerName] = useState('أحمد محمد');
  const [testAmount, setTestAmount] = useState(1500);
  const [results, setResults] = useState<Array<{
    template: string;
    success: boolean;
    message: string;
    timestamp: Date;
  }>>([]);

  const addResult = (template: string, success: boolean, message: string) => {
    setResults(prev => [{
      template,
      success,
      message,
      timestamp: new Date()
    }, ...prev].slice(0, 20)); // حفظ آخر 20 نتيجة
  };

  const testTemplate = async (templateType: string, templateName: string, testFunction: () => Promise<any>) => {
    setIsLoading(true);
    try {
      const result = await testFunction();
      
      if (result.success) {
        const successMsg = `✅ تم إرسال ${templateName} بنجاح! معرف الرسالة: ${result.messageId}`;
        addResult(templateName, true, successMsg);
        toast.success(`تم إرسال ${templateName} بنجاح!`);
      } else {
        const errorMsg = `❌ فشل في إرسال ${templateName}: ${result.error}`;
        addResult(templateName, false, errorMsg);
        toast.error(`فشل في إرسال ${templateName}`);
      }
    } catch (error) {
      const errorMsg = `❌ خطأ في النظام: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`;
      addResult(templateName, false, errorMsg);
      toast.error('خطأ في النظام');
      errorLogger.logError(error as Error, {
        context: 'WhatsAppTemplateTest',
        templateType,
        templateName,
        testPhone,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testMonthlyReminder = () => testTemplate(
    'monthly_reminder',
    'التذكير الشهري',
    () => twilioWhatsAppService.sendMonthlyReminder(
      testPhone,
      testCustomerName,
      testAmount,
      new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      'C-123456',
      5
    )
  );

  const testDelayPenalty = () => testTemplate(
    'delay_penalty',
    'غرامة التأخير',
    () => twilioWhatsAppService.sendDelayPenalty(
      testPhone,
      testCustomerName,
      testAmount,
      Math.round(testAmount * 0.05),
      15,
      'C-123456',
      testAmount + Math.round(testAmount * 0.05)
    )
  );

  const testFinalWarning = () => testTemplate(
    'final_warning',
    'الإنذار النهائي',
    () => twilioWhatsAppService.sendFinalWarning(
      testPhone,
      testCustomerName,
      testAmount,
      'C-123456',
      60
    )
  );

  const testLegalAction = () => testTemplate(
    'legal_action',
    'الإجراء القانوني',
    () => twilioWhatsAppService.sendLegalAction(
      testPhone,
      testCustomerName,
      testAmount,
      'C-123456',
      'تويوتا كامري 2020 - لوحة 123456'
    )
  );

  const testManagerReport = () => testTemplate(
    'manager_report',
    'تقرير المدير',
    () => twilioWhatsAppService.sendManagerReport(
      testPhone,
      'السيد المدير العام',
      new Date().toLocaleDateString('ar-QA'),
      15,
      5,
      3,
      45000,
      25
    )
  );

  const runAutomationProcess = async () => {
    setIsLoading(true);
    try {
      await whatsAppAutomationService.processScheduledMessages();
      toast.success('تم تنفيذ عملية الأتمتة بنجاح!');
      addResult('الأتمتة', true, 'تم تنفيذ جميع القواعد المجدولة بنجاح');
    } catch (error) {
      toast.error('خطأ في عملية الأتمتة');
      addResult('الأتمتة', false, `خطأ: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
    toast.success('تم مسح النتائج');
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-green-600" />
            اختبار قوالب الواتساب الجديدة
          </h2>
          <p className="text-gray-600 mt-1">
            اختبار جميع القوالب المعتمدة الخمسة للتأكد من عملها بشكل صحيح
          </p>
        </div>
      </div>

      {/* إعدادات الاختبار */}
      <Card>
        <CardHeader>
          <CardTitle>إعدادات الاختبار</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="testPhone">رقم الهاتف للاختبار</Label>
              <Input
                id="testPhone"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="+97450000000"
                dir="ltr"
              />
            </div>
            <div>
              <Label htmlFor="testCustomerName">اسم العميل التجريبي</Label>
              <Input
                id="testCustomerName"
                value={testCustomerName}
                onChange={(e) => setTestCustomerName(e.target.value)}
                placeholder="أحمد محمد"
              />
            </div>
            <div>
              <Label htmlFor="testAmount">المبلغ التجريبي (ر.ق)</Label>
              <Input
                id="testAmount"
                type="number"
                value={testAmount}
                onChange={(e) => setTestAmount(Number(e.target.value))}
                placeholder="1500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* أزرار اختبار القوالب */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* تذكير شهري */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="font-bold">تذكير شهري</h3>
                <p className="text-sm text-gray-600">28 من كل شهر</p>
              </div>
            </div>
            <Button
              onClick={testMonthlyReminder}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? <Clock className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              اختبار الإرسال
            </Button>
          </CardContent>
        </Card>

        {/* غرامة تأخير */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="h-8 w-8 text-orange-600" />
              <div>
                <h3 className="font-bold">غرامة تأخير</h3>
                <p className="text-sm text-gray-600">1 من كل شهر</p>
              </div>
            </div>
            <Button
              onClick={testDelayPenalty}
              disabled={isLoading}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {isLoading ? <Clock className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              اختبار الإرسال
            </Button>
          </CardContent>
        </Card>

        {/* إنذار نهائي */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div>
                <h3 className="font-bold">إنذار نهائي</h3>
                <p className="text-sm text-gray-600">للمتأخرين 60+ يوم</p>
              </div>
            </div>
            <Button
              onClick={testFinalWarning}
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {isLoading ? <Clock className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              اختبار الإرسال
            </Button>
          </CardContent>
        </Card>

        {/* إجراء قانوني */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Gavel className="h-8 w-8 text-gray-800" />
              <div>
                <h3 className="font-bold">إجراء قانوني</h3>
                <p className="text-sm text-gray-600">إنذار 24 ساعة</p>
              </div>
            </div>
            <Button
              onClick={testLegalAction}
              disabled={isLoading}
              className="w-full bg-gray-800 hover:bg-gray-900"
            >
              {isLoading ? <Clock className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              اختبار الإرسال
            </Button>
          </CardContent>
        </Card>

        {/* تقرير المدير */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              <div>
                <h3 className="font-bold">تقرير المدير</h3>
                <p className="text-sm text-gray-600">أيام 1-10</p>
              </div>
            </div>
            <Button
              onClick={testManagerReport}
              disabled={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isLoading ? <Clock className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              اختبار الإرسال
            </Button>
          </CardContent>
        </Card>

        {/* عملية الأتمتة */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="font-bold">تشغيل الأتمتة</h3>
                <p className="text-sm text-gray-600">تنفيذ جميع القواعد</p>
              </div>
            </div>
            <Button
              onClick={runAutomationProcess}
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isLoading ? <Clock className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              تشغيل الأتمتة
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* نتائج الاختبار */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>نتائج الاختبار</CardTitle>
              <Button variant="outline" size="sm" onClick={clearResults}>
                مسح النتائج
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <Alert
                  key={index}
                  className={
                    result.success
                      ? 'border-green-200 bg-green-50'
                      : 'border-red-200 bg-red-50'
                  }
                >
                  <div className={`flex items-center gap-2 ${
                    result.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {result.success ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <strong>{result.template}</strong>
                        <span className="text-xs opacity-75">
                          {result.timestamp.toLocaleTimeString('ar-QA')}
                        </span>
                      </div>
                      <div className="mt-1 text-sm">{result.message}</div>
                    </AlertDescription>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* معلومات حول القوالب */}
      <Card>
        <CardHeader>
          <CardTitle>معلومات القوالب المعتمدة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-bold text-blue-600 mb-2">📅 تذكير شهري (28 من كل شهر)</h4>
              <p>يرسل تذكير للعملاء بالدفعة المستحقة قبل 3 أيام من الموعد</p>
            </div>
            <div>
              <h4 className="font-bold text-orange-600 mb-2">💰 غرامة تأخير (1 من كل شهر)</h4>
              <p>يرسل إنذار بغرامة 5% للعملاء المتأخرين في الدفع</p>
            </div>
            <div>
              <h4 className="font-bold text-red-600 mb-2">⚠️ إنذار نهائي</h4>
              <p>للعملاء المتأخرين أكثر من 60 يوم - إنذار أخير قبل الإجراءات</p>
            </div>
            <div>
              <h4 className="font-bold text-gray-800 mb-2">⚖️ إجراء قانوني (24 ساعة)</h4>
              <p>إنذار نهائي للعملاء المتأخرين أكثر من 90 يوم</p>
            </div>
            <div className="md:col-span-2">
              <h4 className="font-bold text-purple-600 mb-2">📊 تقرير المدير العام (أيام 1-10)</h4>
              <p>تقرير يومي شامل للمدير بالإحصائيات والمحصلات والعقود الجديدة</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppTemplateTest;  