import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { whatsAppReportsService } from '@/services/whatsapp-reports-service';
import { MessageCircle, Users, Settings, Send, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export const WhatsAppReportsSettings: React.FC = () => {
  const [targetNumbers] = useState(whatsAppReportsService.getTargetNumbers());
  const [isTestingSent, setIsTestingSent] = useState(false);

  const sendTestMessage = async () => {
    try {
      setIsTestingSent(true);
      
      const testReport = {
        id: 'test-' + Date.now(),
        name: 'تقرير تجريبي للاختبار',
        type: 'financial' as const,
        frequency: 'daily' as const,
        recipients: ['test@example.com'],
        format: 'pdf' as const,
        status: 'active' as const,
        nextRunDate: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const result = await whatsAppReportsService.sendScheduledReport(testReport);
      
      if (result.success) {
        toast.success(`تم إرسال الرسالة التجريبية إلى ${result.sentTo.length} رقم بنجاح`);
      } else {
        toast.error('فشل في إرسال الرسالة التجريبية');
      }
    } catch (error) {
      toast.error('خطأ في النظام');
    } finally {
      setIsTestingSent(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Users className="h-5 w-5" />
            الأرقام المستهدفة للواتساب
          </CardTitle>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            {targetNumbers.length} رقم
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            التقارير المجدولة سيتم إرسالها إلى الأرقام التالية تلقائياً عند إنشائها:
          </p>
          
          <div className="grid gap-3">
            {targetNumbers.map((number, index) => (
              <div 
                key={number}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <MessageCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{number}</p>
                    <p className="text-xs text-muted-foreground">
                      واتساب نشط - {index === 0 ? 'المدير العام' : 'نائب المدير'}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  نشط
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Settings className="h-5 w-5" />
            إعدادات الإرسال
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">الإرسال التلقائي</h4>
              <p className="text-sm text-blue-700 mb-3">
                يتم إرسال إشعار واتساب تلقائياً عند إنشاء أي تقرير مجدول
              </p>
              <Badge className="bg-blue-100 text-blue-800">
                مفعل
              </Badge>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-2">نوع الرسالة</h4>
              <p className="text-sm text-green-700 mb-3">
                رسائل نصية عادية (لا تحتاج قوالب معتمدة)
              </p>
              <Badge className="bg-green-100 text-green-800">
                نص حر
              </Badge>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-3">اختبار الإرسال</h4>
            <p className="text-sm text-muted-foreground mb-4">
              يمكنك إرسال رسالة تجريبية للتأكد من عمل النظام
            </p>
            
            <Button 
              variant="outline" 
              className="w-full md:w-auto"
              disabled={isTestingSent}
              onClick={sendTestMessage}
            >
              <Send className="h-4 w-4 mr-2" />
              {isTestingSent ? 'جاري الإرسال...' : 'إرسال رسالة تجريبية'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold">معلومات مهمة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium">الإرسال الفوري</p>
              <p className="text-xs text-muted-foreground">
                يتم إرسال الإشعار فور الضغط على "تشغيل الآن" لأي تقرير
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium">محتوى الرسالة</p>
              <p className="text-xs text-muted-foreground">
                تتضمن اسم التقرير، نوعه، تاريخ ووقت الإنشاء
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium">لا يتم إرفاق الملف</p>
              <p className="text-xs text-muted-foreground">
                الواتساب يحتوي على إشعار فقط، الملف متاح في النظام
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
