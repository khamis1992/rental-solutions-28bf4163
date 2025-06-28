
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  Settings, 
  ExternalLink, 
  Copy, 
  CheckCircle,
  AlertCircle,
  MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';

const WhatsAppSetupGuide: React.FC = () => {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`تم نسخ ${label}`);
  };

  const secrets = [
    {
      name: 'TWILIO_ACCOUNT_SID',
      description: 'معرف حساب Twilio',
      example: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
    },
    {
      name: 'TWILIO_AUTH_TOKEN', 
      description: 'رمز التوثيق الخاص بـ Twilio',
      example: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
    },
    {
      name: 'TWILIO_WHATSAPP_NUMBER',
      description: 'رقم الواتساب المرتبط بـ Twilio',
      example: 'whatsapp:+14155238886'
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            دليل إعداد خدمة الواتساب
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Introduction */}
          <Alert>
            <MessageCircle className="h-4 w-4" />
            <AlertDescription>
              لتفعيل خدمة إرسال رسائل الواتساب، يجب إعداد مفاتيح Twilio في نظام Supabase.
              اتبع الخطوات التالية لإكمال الإعداد.
            </AlertDescription>
          </Alert>

          {/* Step 1: Get Twilio Credentials */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
              الحصول على بيانات Twilio
            </h3>
            
            <div className="pl-8 space-y-3">
              <p className="text-muted-foreground">
                اذهب إلى لوحة تحكم Twilio واحصل على البيانات التالية:
              </p>
              
              <div className="space-y-3">
                {secrets.map((secret) => (
                  <div key={secret.name} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{secret.name}</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(secret.name, 'اسم المفتاح')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{secret.description}</p>
                    <code className="text-xs bg-muted p-2 rounded block">
                      {secret.example}
                    </code>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                onClick={() => window.open('https://console.twilio.com/', '_blank')}
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                فتح لوحة تحكم Twilio
              </Button>
            </div>
          </div>

          {/* Step 2: Configure Supabase Secrets */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
              إعداد مفاتيح Supabase
            </h3>
            
            <div className="pl-8 space-y-3">
              <p className="text-muted-foreground">
                اتبع هذه الخطوات لإضافة المفاتيح في Supabase:
              </p>
              
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>اذهب إلى لوحة تحكم Supabase</li>
                <li>اختر مشروعك: Rental Solutions</li>
                <li>انتقل إلى Edge Functions → Settings</li>
                <li>في قسم "Secrets"، اضغط "Add a new secret"</li>
                <li>أضف كل مفتاح من المفاتيح الثلاثة بالاسم والقيمة الصحيحة</li>
                <li>احفظ الإعدادات</li>
              </ol>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>مهم:</strong> تأكد من كتابة أسماء المفاتيح بالضبط كما هي موضحة أعلاه (Case-sensitive).
                </AlertDescription>
              </Alert>

              <Button
                variant="outline"
                onClick={() => window.open('https://supabase.com/dashboard/project/vqdlsidkucrownbfuouq/functions', '_blank')}
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                فتح إعدادات Supabase Functions
              </Button>
            </div>
          </div>

          {/* Step 3: Test Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
              اختبار الإعداد
            </h3>
            
            <div className="pl-8 space-y-3">
              <p className="text-muted-foreground">
                بعد إضافة المفاتيح، عد إلى هذه الصفحة واضغط "فحص الحالة" للتأكد من نجاح الإعداد.
              </p>
              
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  عند نجاح الإعداد، ستظهر رسالة تأكيد وستتمكن من إرسال رسالة تجريبية.
                </AlertDescription>
              </Alert>
            </div>
          </div>

          {/* Troubleshooting */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">استكشاف الأخطاء</h3>
            
            <div className="space-y-3 text-sm">
              <div className="border-l-4 border-yellow-500 pl-4">
                <h4 className="font-medium">خطأ: "Authentication failed"</h4>
                <p className="text-muted-foreground">تأكد من صحة Account SID و Auth Token</p>
              </div>
              
              <div className="border-l-4 border-yellow-500 pl-4">
                <h4 className="font-medium">خطأ: "WhatsApp number not configured"</h4>
                <p className="text-muted-foreground">تأكد من أن رقم الواتساب مفعّل في حساب Twilio</p>
              </div>
              
              <div className="border-l-4 border-yellow-500 pl-4">
                <h4 className="font-medium">خطأ: "Secrets not found"</h4>
                <p className="text-muted-foreground">تأكد من إضافة جميع المفاتيح الثلاثة في Supabase</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppSetupGuide;
