import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessageCircle, Send } from 'lucide-react';

const WhatsAppTest: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('+97450000000');
  const [customerName, setCustomerName] = useState('عميل تجريبي');
  const [amount, setAmount] = useState(500);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const sendTestMessage = async () => {
    setIsLoading(true);
    setResult('');
    
    try {
      // استيراد خدمة Twilio
      const { twilioWhatsAppService } = await import('@/services/TwilioWhatsAppService');
      
      // إرسال رسالة تذكير
      const response = await twilioWhatsAppService.sendPaymentReminder(
        phoneNumber,
        customerName,
        amount,
        '2024-01-15',
        'تأجير سيارة'
      );

      if (response.success) {
        setResult(` تم إرسال الرسالة بنجاح!
معرف الرسالة: ${response.messageId}
التكلفة: $${response.cost?.toFixed(4) || '0.0000'}`);
      } else {
        setResult(` فشل في إرسال الرسالة:
${response.error}`);
      }
    } catch (error) {
      setResult(` خطأ في النظام:
${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
      console.error('WhatsApp Test Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
      <div className="max-w-md mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <MessageCircle className="h-6 w-6 text-green-600" />
              <CardTitle>اختبار واتساب Twilio</CardTitle>
            </div>
            <p className="text-sm text-gray-600">اختبار إرسال رسائل التذكير</p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input
                id="phone"
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
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
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="اسم العميل"
              />
            </div>
            
            <div>
              <Label htmlFor="amount">المبلغ (ريال قطري)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="500"
              />
            </div>
            
            <Button
              onClick={sendTestMessage}
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  جارٍ الإرسال...
                </div>
              ) : (
                <>
                  <Send className="h-4 w-4 ml-2" />
                  إرسال رسالة تذكير
                </>
              )}
            </Button>
            
            {result && (
              <div className={`p-3 rounded-lg text-sm whitespace-pre-line ${
                result.includes('') 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {result}
              </div>
            )}
            
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-1">معلومات النظام</h4>
              <div className="text-xs text-blue-700 space-y-1">
                <p>Account SID: {import.meta.env.VITE_TWILIO_ACCOUNT_SID || 'غير محدد'}</p>
                <p>رقم الواتساب: {import.meta.env.VITE_TWILIO_WHATSAPP_NUMBER || 'غير محدد'}</p>
                <p>حالة الاتصال: {navigator.onLine ? 'متصل' : 'غير متصل'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WhatsAppTest;
