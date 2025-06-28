
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Settings, 
  ExternalLink,
  MessageCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ServiceStatus {
  configured: boolean;
  authenticated: boolean;
  ready: boolean;
  error?: string;
  missingSecrets?: string[];
  setupRequired?: boolean;
}

const WhatsAppServiceStatus: React.FC = () => {
  const [status, setStatus] = useState<ServiceStatus>({
    configured: false,
    authenticated: false,
    ready: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [testMessageSent, setTestMessageSent] = useState(false);

  const checkServiceStatus = async () => {
    setIsLoading(true);
    try {
      console.log('Testing WhatsApp service status...');
      
      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: { test: true }
      });

      console.log('Service status response:', data);

      if (error) {
        console.error('Service status error:', error);
        setStatus({
          configured: false,
          authenticated: false,
          ready: false,
          error: error.message || 'Failed to check service status',
          setupRequired: true
        });
        return;
      }

      if (data?.success) {
        setStatus({
          configured: true,
          authenticated: true,
          ready: true
        });
        toast.success('WhatsApp service is configured and ready!');
      } else {
        setStatus({
          configured: false,
          authenticated: false,
          ready: false,
          error: data?.error || 'Service not configured',
          missingSecrets: data?.missing_secrets || [],
          setupRequired: data?.setup_required || false
        });
      }
    } catch (error) {
      console.error('Error checking WhatsApp service:', error);
      setStatus({
        configured: false,
        authenticated: false,
        ready: false,
        error: 'Failed to connect to WhatsApp service',
        setupRequired: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestMessage = async () => {
    if (!status.ready) {
      toast.error('WhatsApp service is not ready. Please configure it first.');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: {
          to: '+97466707063', // Test number
          messageType: 'general',
          body: 'تجربة خدمة الواتساب - نظام العراف للتأجير\n\nهذه رسالة تجريبية للتأكد من عمل الخدمة بشكل صحيح.'
        }
      });

      if (error) {
        toast.error(`فشل إرسال الرسالة: ${error.message}`);
        return;
      }

      if (data?.success) {
        setTestMessageSent(true);
        toast.success('تم إرسال الرسالة التجريبية بنجاح!');
      } else {
        toast.error(`فشل الإرسال: ${data?.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error sending test message:', error);
      toast.error('خطأ في إرسال الرسالة التجريبية');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkServiceStatus();
  }, []);

  const getStatusIcon = (isReady: boolean, hasError: boolean) => {
    if (hasError) return <XCircle className="h-5 w-5 text-red-500" />;
    if (isReady) return <CheckCircle className="h-5 w-5 text-green-500" />;
    return <AlertCircle className="h-5 w-5 text-yellow-500" />;
  };

  const getStatusBadge = (isReady: boolean, hasError: boolean) => {
    if (hasError) return <Badge variant="destructive">خطأ</Badge>;
    if (isReady) return <Badge variant="default" className="bg-green-100 text-green-800">جاهز</Badge>;
    return <Badge variant="secondary">يحتاج إعداد</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            حالة خدمة الواتساب
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Service Status */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              {getStatusIcon(status.ready, !!status.error)}
              <div>
                <p className="font-medium">حالة الخدمة</p>
                <p className="text-sm text-muted-foreground">
                  {status.ready ? 'الخدمة جاهزة وتعمل بشكل صحيح' : 'الخدمة تحتاج إعداد'}
                </p>
              </div>
            </div>
            {getStatusBadge(status.ready, !!status.error)}
          </div>

          {/* Configuration Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 p-3 border rounded">
              {status.configured ? 
                <CheckCircle className="h-4 w-4 text-green-500" /> : 
                <XCircle className="h-4 w-4 text-red-500" />
              }
              <span className="text-sm">تم الإعداد</span>
            </div>
            
            <div className="flex items-center gap-2 p-3 border rounded">
              {status.authenticated ? 
                <CheckCircle className="h-4 w-4 text-green-500" /> : 
                <XCircle className="h-4 w-4 text-red-500" />
              }
              <span className="text-sm">تم التوثيق</span>
            </div>
            
            <div className="flex items-center gap-2 p-3 border rounded">
              {status.ready ? 
                <CheckCircle className="h-4 w-4 text-green-500" /> : 
                <XCircle className="h-4 w-4 text-red-500" />
              }
              <span className="text-sm">جاهز للعمل</span>
            </div>
          </div>

          {/* Error Details */}
          {status.error && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>خطأ:</strong> {status.error}
                {status.missingSecrets && status.missingSecrets.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium">المفاتيح المفقودة:</p>
                    <ul className="list-disc list-inside text-sm">
                      {status.missingSecrets.map(secret => (
                        <li key={secret}>{secret}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Setup Instructions */}
          {status.setupRequired && (
            <Alert>
              <Settings className="h-4 w-4" />
              <AlertDescription>
                <strong>مطلوب إعداد:</strong> يجب إضافة مفاتيح Twilio في إعدادات Supabase Functions
                <div className="mt-3 space-y-2">
                  <p className="font-medium">الخطوات المطلوبة:</p>
                  <ol className="list-decimal list-inside text-sm space-y-1">
                    <li>اذهب إلى لوحة تحكم Supabase</li>
                    <li>انتقل إلى Edge Functions → Settings</li>
                    <li>أضف المفاتيح التالية في قسم Secrets:</li>
                    <ul className="list-disc list-inside ml-4 mt-1">
                      <li>TWILIO_ACCOUNT_SID</li>
                      <li>TWILIO_AUTH_TOKEN</li>
                      <li>TWILIO_WHATSAPP_NUMBER</li>
                    </ul>
                    <li>احفظ الإعدادات وأعد تشغيل الوظيفة</li>
                  </ol>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={checkServiceStatus} 
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              فحص الحالة
            </Button>

            {status.ready && (
              <Button 
                onClick={sendTestMessage}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <MessageCircle className="h-4 w-4 mr-2" />
                )}
                إرسال رسالة تجريبية
              </Button>
            )}

            <Button 
              variant="outline"
              onClick={() => window.open('https://supabase.com/dashboard/project/vqdlsidkucrownbfuouq/functions', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              إعدادات Supabase
            </Button>
          </div>

          {testMessageSent && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                تم إرسال الرسالة التجريبية بنجاح! تحقق من هاتفك للتأكد من وصول الرسالة.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppServiceStatus;
