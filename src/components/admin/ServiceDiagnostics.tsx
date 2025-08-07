import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { openAIService } from '@/services/openai-service';
import { googleVisionOcrService } from '@/services/google-vision-ocr';


interface ServiceStatus {
  name: string;
  status: 'active' | 'inactive' | 'error' | 'checking';
  lastChecked?: Date;
  error?: string;
  details?: Record<string, any>;
}

export function ServiceDiagnostics() {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'OpenAI Service', status: 'checking' },
    { name: 'Google Vision OCR', status: 'checking' },
    { name: 'Supabase Functions', status: 'checking' }
  ]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkServiceStatus = async () => {
    setIsRefreshing(true);
    const updatedServices: ServiceStatus[] = [];

    try {
      // Check OpenAI Service with enhanced error handling
      console.log('🔍 Checking OpenAI service status...');
      
      let openAIActive = false;
      let openAIError = '';
      
      try {
        const testResponse = await openAIService.generateText(
          'Hello, this is a test message. Please respond with "Service is working".',
          'You are a helpful assistant.'
        );
        
        openAIActive = testResponse.success;
        if (!testResponse.success) {
          openAIError = testResponse.error || 'خدمة غير متاحة';
        }
      } catch (error) {
        console.warn('OpenAI service check failed:', error);
        openAIError = error instanceof Error ? error.message : 'فشل في الاتصال';
      }

      updatedServices.push({
        name: 'OpenAI Service',
        status: openAIActive ? 'active' : 'inactive',
        lastChecked: new Date(),
        error: openAIActive ? undefined : openAIError
      });

      // Check Google Vision OCR Service with safe error handling
      console.log('🔍 Checking Google Vision OCR service status...');
      let visionActive = false;
      let visionError = '';
      
      try {
        // Use a more defensive approach - test with a minimal valid base64 image
        const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
        
        // Set a timeout for the Vision API call
        const visionPromise = googleVisionOcrService.extractTextFromImage(testImage, false);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('طلب انتهت مهلته')), 10000)
        );
        
        const visionResult = await Promise.race([visionPromise, timeoutPromise]) as any;
        
        // Consider the service working if it doesn't throw an error
        visionActive = true;
        
        // Check if the service is configured properly
        if (!visionResult.success && visionResult.error?.includes('not configured')) {
          visionError = 'الخدمة غير مكونة - يرجى إضافة مفتاح Google Vision API';
          visionActive = false;
        }
      } catch (error) {
        console.warn('Google Vision service check failed:', error);
        visionError = error instanceof Error ? error.message : 'خدمة غير متاحة';
        // Don't mark as error if it's just a configuration issue
        if (visionError.includes('not configured') || visionError.includes('API')) {
          visionActive = false;
        }
      }

      updatedServices.push({
        name: 'Google Vision OCR',
        status: visionActive ? 'active' : 'inactive',
        lastChecked: new Date(),
        error: visionActive ? undefined : visionError
      });

      // Check Supabase Functions with enhanced error handling
      console.log('🔍 Checking Supabase functions...');
      let functionsActive = false;
      let functionsError = '';
      
      try {
        // Test functions with safer approach and timeout
        const functionTests = await Promise.allSettled([
          Promise.race([
            supabase.functions.invoke('process-openai', {
              body: { test: true, prompt: 'test' }
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('انتهت المهلة')), 8000))
          ]),
          Promise.race([
            supabase.functions.invoke('process-google-vision', {
              body: { test: true, imageBase64: 'test' }
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('انتهت المهلة')), 8000))
          ])
        ]);

        // Check if at least one function is working
        let workingFunctions = 0;
        const functionErrors: string[] = [];

        functionTests.forEach((result, index) => {
          const functionName = index === 0 ? 'OpenAI' : 'Vision';
          
          if (result.status === 'fulfilled' && !(result.value as any)?.error) {
            workingFunctions++;
          } else {
            const errorMsg = result.status === 'rejected' 
              ? result.reason?.message || result.reason 
              : (result.value as any)?.error?.message || 'خطأ غير معروف';
            functionErrors.push(`${functionName}: ${errorMsg}`);
          }
        });
        
        functionsActive = workingFunctions > 0;
        
        if (!functionsActive && functionErrors.length > 0) {
          functionsError = functionErrors.join(', ');
        }
      } catch (error) {
        console.warn('Supabase functions check failed:', error);
        functionsError = error instanceof Error ? error.message : 'فشل في الاتصال';
      }

      updatedServices.push({
        name: 'Supabase Functions',
        status: functionsActive ? 'active' : 'inactive',
        lastChecked: new Date(),
        error: functionsActive ? undefined : functionsError
      });

    } catch (error) {
      console.error('Error in service status check:', error);
      // Don't show error toast for diagnostic failures
      console.warn('فشل في فحص بعض الخدمات - استكمال بدون خدمات خارجية');
    }

    setServices(updatedServices);
    setIsRefreshing(false);
  };

  // Safe initialization - don't fail on mount
  useEffect(() => {
    // Add a delay to prevent rushing the checks on page load
    const timeoutId = setTimeout(() => {
      checkServiceStatus().catch(error => {
        console.warn('Initial service check failed:', error);
        // Set all services to inactive on initial failure
        setServices(prev => prev.map(service => ({
          ...service,
          status: 'inactive' as const,
          error: 'فشل في الفحص الأولي',
          lastChecked: new Date()
        })));
        setIsRefreshing(false);
      });
    }, 2000); // Wait 2 seconds after component mount

    return () => clearTimeout(timeoutId);
  }, []);

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'inactive':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'checking':
        return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />;
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
      case 'inactive':
        return <Badge variant="secondary">غير نشط</Badge>;
      case 'checking':
        return <Badge variant="outline">جاري الفحص...</Badge>;
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
            onClick={() => checkServiceStatus().catch(console.warn)}
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
                    <p className="text-sm text-yellow-600 mt-1">
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
          <h4 className="font-medium mb-2">معلومات مهمة:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• الخدمات الخارجية اختيارية - النظام يعمل بدونها</li>
            <li>• في حالة عدم توفر المفاتيح، يتم استخدام بيانات تجريبية</li>
            <li>• OPENAI_API_KEY: لخدمة الذكاء الاصطناعي المحسنة</li>
            <li>• GOOGLE_VISION_API_KEY: لقراءة النصوص من الصور</li>
            <li>• يمكن إضافة المفاتيح في إعدادات Supabase Edge Functions</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}