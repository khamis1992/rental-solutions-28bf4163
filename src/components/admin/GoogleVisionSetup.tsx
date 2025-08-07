import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  AlertCircle, 
  ExternalLink, 
  Copy, 
  Eye, 
  RefreshCw,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { safeEdgeCall } from '@/utils/safe-edge-function';

interface SetupStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  action?: () => void;
}

export const GoogleVisionSetup = () => {
  const [isTestingAPI, setIsTestingAPI] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const steps: SetupStep[] = [
    {
      id: 'google-cloud',
      title: 'إنشاء مشروع Google Cloud',
      description: 'إنشاء حساب وتفعيل Vision API',
      status: 'pending'
    },
    {
      id: 'api-key',
      title: 'إنشاء API Key',
      description: 'إنشاء وتأمين مفتاح API',
      status: 'pending'
    },
    {
      id: 'supabase-config',
      title: 'إعداد Supabase',
      description: 'إضافة المفتاح إلى Edge Functions',
      status: 'pending'
    },
    {
      id: 'test-api',
      title: 'اختبار التكامل',
      description: 'التحقق من عمل الخدمة',
      status: 'pending',
      action: testGoogleVisionAPI
    }
  ];

  const [setupSteps, setSetupSteps] = useState(steps);

  async function testGoogleVisionAPI() {
    setIsTestingAPI(true);
    
    try {
      // Create a simple test image (1x1 white pixel)
      const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
      
      const result = await safeEdgeCall('process-google-vision', {
        imageBase64: testImage,
        saveImage: false
      }, 10000);

      setTestResult(result);

      if (result.success) {
        toast.success('✅ Google Vision API يعمل بنجاح!');
        updateStepStatus('test-api', 'completed');
      } else {
        toast.error('❌ فشل في اختبار Google Vision API');
        updateStepStatus('test-api', 'failed');
      }
    } catch (error) {
      console.error('Test failed:', error);
      setTestResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      toast.error('❌ فشل في الاتصال بالخدمة');
      updateStepStatus('test-api', 'failed');
    }

    setIsTestingAPI(false);
  }

  const updateStepStatus = (stepId: string, status: SetupStep['status']) => {
    setSetupSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ));
  };

  const getStepIcon = (status: SetupStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'in-progress':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('تم النسخ!');
  };

  const progressPercentage = (setupSteps.filter(step => step.status === 'completed').length / setupSteps.length) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6" dir="rtl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-6 w-6" />
              إعداد Google Vision API
            </CardTitle>
            <Badge variant="secondary">
              {Math.round(progressPercentage)}% مكتمل
            </Badge>
          </div>
          <Progress value={progressPercentage} className="w-full" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overview */}
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              Google Vision API يمكّن النظام من قراءة النصوص من الصور تلقائياً، مما يسرّع عملية إدخال بيانات العملاء والعقود.
              <strong> الخدمة اختيارية - النظام يعمل بدونها.</strong>
            </AlertDescription>
          </Alert>

          {/* Steps */}
          <div className="space-y-4">
            {setupSteps.map((step) => (
              <div key={step.id} className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  {getStepIcon(step.status)}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-lg">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                  
                  {/* Step-specific content */}
                  {step.id === 'google-cloud' && (
                    <div className="mt-3 space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open('https://console.cloud.google.com/', '_blank')}
                        className="gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        فتح Google Cloud Console
                      </Button>
                      <div className="text-sm text-muted-foreground">
                        <p>1. أنشئ مشروع جديد أو اختر مشروع موجود</p>
                        <p>2. فعّل Cloud Vision API</p>
                        <p>3. أعد إعداد الفوترة (مطلوب حتى للاستخدام المجاني)</p>
                      </div>
                    </div>
                  )}

                  {step.id === 'api-key' && (
                    <div className="mt-3 space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open('https://console.cloud.google.com/apis/credentials', '_blank')}
                        className="gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        إدارة Credentials
                      </Button>
                      <div className="text-sm text-muted-foreground">
                        <p>1. انقر "Create Credentials" → "API Key"</p>
                        <p>2. اختر "Restrict key" → "Cloud Vision API"</p>
                        <p>3. انسخ المفتاح بحذر</p>
                      </div>
                    </div>
                  )}

                  {step.id === 'supabase-config' && (
                    <div className="mt-3 space-y-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open('https://supabase.com/dashboard/project/_/functions', '_blank')}
                        className="gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        فتح Supabase Dashboard
                      </Button>
                      
                      <div className="space-y-2">
                        <p className="text-sm font-medium">أضف المتغير التالي:</p>
                        <div className="flex items-center gap-2 p-2 bg-muted rounded font-mono text-sm">
                          <span>GOOGLE_VISION_API_KEY</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard('GOOGLE_VISION_API_KEY')}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          اذهب إلى Project Settings → Edge Functions → Environment Variables
                        </p>
                      </div>
                    </div>
                  )}

                  {step.id === 'test-api' && (
                    <div className="mt-3 space-y-3">
                      <Button
                        onClick={step.action}
                        disabled={isTestingAPI}
                        variant="default"
                        size="sm"
                        className="gap-2"
                      >
                        {isTestingAPI ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        {isTestingAPI ? 'جاري الاختبار...' : 'اختبار الخدمة'}
                      </Button>

                      {testResult && (
                        <Alert className={testResult.success ? 'border-green-200' : 'border-red-200'}>
                          <AlertDescription>
                            {testResult.success ? (
                              <span className="text-green-700">
                                ✅ الخدمة تعمل بنجاح! يمكنك الآن استخدام ميزة قراءة النصوص من الصور.
                              </span>
                            ) : (
                              <span className="text-red-700">
                                ❌ خطأ: {testResult.error}
                              </span>
                            )}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Cost Information */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>معلومات التكلفة:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• أول 1,000 طلب شهرياً: مجاني تماماً</li>
                <li>• للاستخدام العادي (100-500 عميل/شهر): عادة مجاني</li>
                <li>• بعد الحد المجاني: $1.50 لكل 1,000 طلب</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Alternative Options */}
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">بدائل أخرى:</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• <strong>إدخال يدوي:</strong> يمكن إدخال بيانات العملاء يدوياً</p>
              <p>• <strong>بيانات تجريبية:</strong> النظام يوفر بيانات تجريبية للاختبار</p>
              <p>• <strong>تفعيل لاحق:</strong> يمكن إعداد الخدمة في أي وقت لاحق</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 