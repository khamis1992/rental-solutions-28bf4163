import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { twilioWhatsAppService } from '@/services/TwilioWhatsAppService';
import { whatsAppAutomationService } from '@/services/WhatsAppAutomationService';
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

const WhatsAppTemplatesTest: React.FC = () => {
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
    }, ...prev].slice(0, 20));
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
      console.error(error);
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
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <MessageCircle className="h-8 w-8 text-green-600" />
            اختبار قوالب الواتساب المعتمدة
          </h1>
          <p className="text-gray-600 mt-2">
            صفحة اختبار شاملة لجميع القوالب الخمسة المعتمدة من WhatsApp للتأكد من عملها بشكل صحيح
          </p>
        </div>
      </div>

      {/* ملخص القوالب */}
      <Alert className="border-blue-200 bg-blue-50">
        <CheckCircle className="h-5 w-5 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>✅ تم اعتماد 5 قوالب جديدة:</strong>
          <div className="mt-2 text-sm">
            1. تذكير شهري (28 من كل شهر) • 2. غرامة تأخير (1 من كل شهر) • 3. إنذار نهائي قانوني •
            4. إجراء قانوني (24 ساعة) • 5. تقرير المدير العام (أيام 1-10)
          </div>
        </AlertDescription>
      </Alert>

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* تذكير شهري */}
        <Card className="hover:shadow-lg transition-shadow border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="h-10 w-10 text-blue-600" />
              <div>
                <h3 className="font-bold text-lg">تذكير شهري</h3>
                <p className="text-sm text-gray-600">يرسل في 28 من كل شهر</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-4">
              تذكير للعملاء بالدفعة المستحقة قبل 3 أيام من موعد الاستحقاق
            </p>
            <Button
              onClick={testMonthlyReminder}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? <Clock className="h-4 w-4 animate-spin ml-2" /> : <Send className="h-4 w-4 ml-2" />}
              اختبار الإرسال
            </Button>
          </CardContent>
        </Card>

        {/* غرامة تأخير */}
        <Card className="hover:shadow-lg transition-shadow border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="h-10 w-10 text-orange-600" />
              <div>
                <h3 className="font-bold text-lg">غرامة تأخير</h3>
                <p className="text-sm text-gray-600">يرسل في 1 من كل شهر</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-4">
              إنذار بغرامة 5% للعملاء المتأخرين في دفع الأقساط
            </p>
            <Button
              onClick={testDelayPenalty}
              disabled={isLoading}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {isLoading ? <Clock className="h-4 w-4 animate-spin ml-2" /> : <Send className="h-4 w-4 ml-2" />}
              اختبار الإرسال
            </Button>
          </CardContent>
        </Card>

        {/* إنذار نهائي */}
        <Card className="hover:shadow-lg transition-shadow border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-10 w-10 text-red-600" />
              <div>
                <h3 className="font-bold text-lg">إنذار نهائي</h3>
                <p className="text-sm text-gray-600">للمتأخرين 60+ يوم</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-4">
              إنذار أخير قانوني للعملاء المتأخرين أكثر من 60 يوم
            </p>
            <Button
              onClick={testFinalWarning}
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {isLoading ? <Clock className="h-4 w-4 animate-spin ml-2" /> : <Send className="h-4 w-4 ml-2" />}
              اختبار الإرسال
            </Button>
          </CardContent>
        </Card>

        {/* إجراء قانوني */}
        <Card className="hover:shadow-lg transition-shadow border-gray-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Gavel className="h-10 w-10 text-gray-800" />
              <div>
                <h3 className="font-bold text-lg">إجراء قانوني</h3>
                <p className="text-sm text-gray-600">إنذار 24 ساعة نهائي</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-4">
              إنذار نهائي للعملاء المتأخرين أكثر من 90 يوم قبل المقاضاة
            </p>
            <Button
              onClick={testLegalAction}
              disabled={isLoading}
              className="w-full bg-gray-800 hover:bg-gray-900"
            >
              {isLoading ? <Clock className="h-4 w-4 animate-spin ml-2" /> : <Send className="h-4 w-4 ml-2" />}
              اختبار الإرسال
            </Button>
          </CardContent>
        </Card>

        {/* تقرير المدير */}
        <Card className="hover:shadow-lg transition-shadow border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="h-10 w-10 text-purple-600" />
              <div>
                <h3 className="font-bold text-lg">تقرير المدير</h3>
                <p className="text-sm text-gray-600">أيام 1-10 من كل شهر</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-4">
              تقرير يومي شامل للمدير العام بإحصائيات الشركة
            </p>
            <Button
              onClick={testManagerReport}
              disabled={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isLoading ? <Clock className="h-4 w-4 animate-spin ml-2" /> : <Send className="h-4 w-4 ml-2" />}
              اختبار الإرسال
            </Button>
          </CardContent>
        </Card>

        {/* عملية الأتمتة */}
        <Card className="hover:shadow-lg transition-shadow border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
              <div>
                <h3 className="font-bold text-lg">تشغيل الأتمتة</h3>
                <p className="text-sm text-gray-600">تنفيذ جميع القواعد المجدولة</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-4">
              تنفيذ دورة كاملة لجميع قواعد الأتمتة والرسائل المجدولة
            </p>
            <Button
              onClick={runAutomationProcess}
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isLoading ? <Clock className="h-4 w-4 animate-spin ml-2" /> : <Send className="h-4 w-4 ml-2" />}
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
              <CardTitle>سجل نتائج الاختبار</CardTitle>
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
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <AlertTriangle className="h-5 w-5" />
                    )}
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <strong className="text-base">{result.template}</strong>
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

      {/* معلومات تفصيلية */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle>معلومات تفصيلية عن القوالب</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-bold text-blue-600 mb-3 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                تذكير شهري (28 من كل شهر)
              </h4>
              <ul className="space-y-1 text-gray-700">
                <li>• يرسل للعملاء في 28 من كل شهر</li>
                <li>• يذكر بالدفعة المستحقة خلال 3 أيام</li>
                <li>• يتضمن: اسم العميل، المبلغ، تاريخ الاستحقاق، رقم العقد</li>
                <li>• يعرض عدد الأقساط المتبقية</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-orange-600 mb-3 flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                غرامة تأخير (1 من كل شهر)
              </h4>
              <ul className="space-y-1 text-gray-700">
                <li>• يرسل في 1 من كل شهر للمتأخرين</li>
                <li>• يحسب غرامة 5% من قيمة القسط</li>
                <li>• يعرض عدد أيام التأخير</li>
                <li>• يتضمن إجمالي المبلغ المطلوب مع الغرامة</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-red-600 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                إنذار نهائي قانوني
              </h4>
              <ul className="space-y-1 text-gray-700">
                <li>• للعملاء المتأخرين أكثر من 60 يوم</li>
                <li>• إنذار أخير قبل الإجراءات القانونية</li>
                <li>• يتضمن إجمالي المبلغ المتأخر</li>
                <li>• يحدد مهلة زمنية محددة للسداد</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Gavel className="h-5 w-5" />
                إجراء قانوني (24 ساعة)
              </h4>
              <ul className="space-y-1 text-gray-700">
                <li>• للعملاء المتأخرين أكثر من 90 يوم</li>
                <li>• إنذار نهائي قبل 24 ساعة من المقاضاة</li>
                <li>• يتضمن تفاصيل المركبة المطلوب استردادها</li>
                <li>• يحدد الإجراءات القانونية المتوقعة</li>
              </ul>
            </div>
            
            <div className="md:col-span-2">
              <h4 className="font-bold text-purple-600 mb-3 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                تقرير المدير العام (أيام 1-10 من كل شهر)
              </h4>
              <ul className="space-y-1 text-gray-700">
                <li>• يرسل يومياً للمدير العام في العشر الأوائل من كل شهر</li>
                <li>• يتضمن: عدد المحصلات اليومية، الدفعات المتأخرة، العقود الجديدة</li>
                <li>• يعرض إجمالي الإيرادات اليومية وعدد المركبات النشطة</li>
                <li>• تقرير شامل لمساعدة الإدارة في اتخاذ القرارات</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppTemplatesTest; 