import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { openAIService } from '@/services/openai-service';
import { googleVisionOcrService } from '@/services/google-vision-ocr';
import { supabase } from '@/integrations/supabase/client';

interface ServiceStatus {
  name: string;
  status: 'active' | 'inactive' | 'error' | 'checking';
  lastChecked?: Date;
  error?: string;
  details?: Record<string, any>;
}

export function ServiceDiagnostics() {
  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: 'OpenAI Service',
      status: 'checking'
    },
    {
      name: 'Google Vision OCR',
      status: 'checking'
    },
    {
      name: 'Supabase Functions',
      status: 'checking'
    }
  ]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkServiceStatus = async () => {
    setIsRefreshing(true);
    const updatedServices: ServiceStatus[] = [];

    try {
      // Check OpenAI Service
      console.log('🔍 Checking OpenAI service status...');
      const openAIStatus = openAIService.getServiceStatus();
      
      let openAIActive = false;
      let openAIError = '';
      
      try {
        const testResponse = await openAIService.processText({
          prompt: 'Hello, this is a test message. Please respond with "Service is working".',
          maxTokens: 50
        });
        
        openAIActive = testResponse.success;
        if (!testResponse.success) {
          openAIError = testResponse.error || 'Unknown error';
        }
      } catch (error) {
        openAIError = error instanceof Error ? error.message : 'Connection failed';
      }

      updatedServices.push({
        name: 'OpenAI Service',
        status: openAIActive ? 'active' : 'error',
        lastChecked: new Date(),
        error: openAIActive ? undefined : openAIError,
        details: openAIStatus
      });

      // Check Google Vision OCR Service
      console.log('🔍 Checking Google Vision OCR service status...');
      let visionActive = false;
      let visionError = '';
      
      try {
        // Test with a simple base64 image (1x1 white pixel)
        const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
        const visionResult = await googleVisionOcrService.extractTextFromImage(testImage, false);
        
        visionActive = true; // If no error thrown, service is accessible
        if (!visionResult.success && visionResult.error?.includes('not configured')) {
          visionError = visionResult.error;
          visionActive = false;
        }
      } catch (error) {
        visionError = error instanceof Error ? error.message : 'Connection failed';
      }

      updatedServices.push({
        name: 'Google Vision OCR',
        status: visionActive ? 'active' : 'error',
        lastChecked: new Date(),
        error: visionActive ? undefined : visionError
      });

      // Check Supabase Functions
      console.log('🔍 Checking Supabase functions...');
      let functionsActive = false;
      let functionsError = '';
      
      try {
        // Test both functions
        const [openAITest, visionTest] = await Promise.allSettled([
          supabase.functions.invoke('process-openai', {
            body: { prompt: 'test' }
          }),
          supabase.functions.invoke('process-google-vision', {
            body: { imageBase64: 'test' }
          })
        ]);

        const openAIWorking = openAITest.status === 'fulfilled' && !openAITest.value.error;
        const visionWorking = visionTest.status === 'fulfilled' && !visionTest.value.error;
        
        functionsActive = openAIWorking || visionWorking;
        
        if (!functionsActive) {
          const errors = [];
          if (openAITest.status === 'rejected') errors.push(`OpenAI: ${openAITest.reason}`);
          if (visionTest.status === 'rejected') errors.push(`Vision: ${visionTest.reason}`);
          functionsError = errors.join(', ') || 'Functions not responding';
        }
      } catch (error) {
        functionsError = error instanceof Error ? error.message : 'Connection failed';
      }

      updatedServices.push({
        name: 'Supabase Functions',
        status: functionsActive ? 'active' : 'error',
        lastChecked: new Date(),
        error: functionsActive ? undefined : functionsError
      });

    } catch (error) {
      console.error('Error checking services:', error);
      toast.error('فشل في فحص الخدمات');
    }

    setServices(updatedServices);
    setIsRefreshing(false);
  };

  useEffect(() => {
    checkServiceStatus();
  }, []);

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'checking':
        return <Clock className="h-5 w-5 text-yellow-500 animate-pulse" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">نشط</Badge>;
      case 'error':
        return <Badge variant="destructive">خطأ</Badge>;
      case 'checking':
        return <Badge variant="secondary">جاري الفحص...</Badge>;
      default:
        return <Badge variant="outline">غير معروف</Badge>;
    }
  };

  return (
    <Card className="w-full" dir="rtl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            تشخيص الخدمات
          </CardTitle>
          <Button
            onClick={checkServiceStatus}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {services.map((service, index) => (
          <div key={service.name}>
            <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-3">
                {getStatusIcon(service.status)}
                <div>
                  <h3 className="font-medium">{service.name}</h3>
                  {service.lastChecked && (
                    <p className="text-sm text-muted-foreground">
                      آخر فحص: {service.lastChecked.toLocaleTimeString('ar-QA')}
                    </p>
                  )}
                  {service.error && (
                    <p className="text-sm text-red-600 mt-1">
                      {service.error}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-left">
                {getStatusBadge(service.status)}
              </div>
            </div>
            {index < services.length - 1 && <Separator className="my-2" />}
          </div>
        ))}
        
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">معلومات إضافية:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• يجب إدخال مفاتيح API في إعدادات Edge Functions بـ Supabase</li>
            <li>• OPENAI_API_KEY: مطلوب لخدمة الذكاء الاصطناعي</li>
            <li>• GOOGLE_VISION_API_KEY: مطلوب لقراءة النصوص من الصور</li>
            <li>• يمكن الحصول على المفاتيح من لوحات تحكم الخدمات المعنية</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}