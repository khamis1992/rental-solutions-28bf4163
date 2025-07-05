// Google Vision OCR Test Page
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { googleVisionOcrService } from '@/services/google-vision-ocr';

const GoogleVisionTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<'unknown' | 'working' | 'error'>('unknown');

  const testGoogleVisionAPI = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🧪 Testing Google Vision API...');

      // إنشاء صورة اختبار بسيطة (نص عربي وإنجليزي)
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 200;
      const ctx = canvas.getContext('2d')!;
      
      // خلفية بيضاء
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 400, 200);
      
      // نص عربي
      ctx.fillStyle = 'black';
      ctx.font = '20px Arial';
      ctx.textAlign = 'right';
      ctx.fillText('محمد علي أحمد', 350, 50);
      ctx.fillText('رقم الهوية: 28278801203', 350, 80);
      
      // نص إنجليزي
      ctx.textAlign = 'left';
      ctx.fillText('Mohamed Ali Ahmed', 50, 120);
      ctx.fillText('ID: 28278801203', 50, 150);

      const testImageBase64 = canvas.toDataURL('image/png');

      console.log('📤 Sending test image to Google Vision...');
      const ocrResult = await googleVisionOcrService.extractTextFromImage(testImageBase64, false);

      console.log('📥 OCR Result:', ocrResult);
      setResult(ocrResult);

      if (ocrResult.success) {
        setApiStatus('working');
      } else {
        setApiStatus('error');
        setError(ocrResult.error || 'فشل غير معروف');
      }

    } catch (error) {
      console.error('❌ Test failed:', error);
      setApiStatus('error');
      setError(error instanceof Error ? error.message : 'خطأ غير معروف');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (apiStatus) {
      case 'working':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />يعمل</Badge>;
      case 'error':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />خطأ</Badge>;
      default:
        return <Badge variant="secondary"><AlertTriangle className="w-3 h-3 mr-1" />غير معروف</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-right flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusBadge()}
            </div>
            اختبار Google Vision API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-right">
              هذه الصفحة لاختبار عمل خدمة Google Vision API المستخدمة لقراءة النصوص من الصور والملفات الممسوحة
            </AlertDescription>
          </Alert>

          <div className="flex justify-center">
            <Button 
              onClick={testGoogleVisionAPI}
              disabled={isLoading}
              size="lg"
              className="w-full max-w-md"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  جاري الاختبار...
                </>
              ) : (
                'اختبار Google Vision API'
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription className="text-right">
                <strong>خطأ في الاختبار:</strong><br />
                {error}
              </AlertDescription>
            </Alert>
          )}

          {result && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-right text-lg">نتائج الاختبار</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-right">
                      <strong>الحالة:</strong> {result.success ? '✅ نجح' : '❌ فشل'}
                    </div>
                    <div className="text-right">
                      <strong>مستوى الثقة:</strong> {result.confidence ? `${result.confidence}%` : 'غير متوفر'}
                    </div>
                  </div>

                  {result.rawText && (
                    <div>
                      <strong className="block text-right mb-2">النص المستخرج:</strong>
                      <div className="bg-gray-100 p-4 rounded-lg text-right whitespace-pre-wrap">
                        {result.rawText}
                      </div>
                    </div>
                  )}

                  {result.data && (
                    <div>
                      <strong className="block text-right mb-2">البيانات المستخرجة:</strong>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <pre className="text-right text-sm">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-right text-lg">معلومات النظام</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-right">
                <strong>Google Vision API Key:</strong> {
                  import.meta.env.VITE_GOOGLE_VISION_API_KEY ? 
                  `${import.meta.env.VITE_GOOGLE_VISION_API_KEY.substring(0, 10)}...` : 
                  'غير محدد'
                }
              </div>
              <div className="text-right">
                <strong>Browser:</strong> {navigator.userAgent.split(' ')[0]}
              </div>
              <div className="text-right">
                <strong>Online:</strong> {navigator.onLine ? '✅ متصل' : '❌ غير متصل'}
              </div>
            </CardContent>
          </Card>

          <Alert>
            <AlertDescription className="text-right">
              <strong>ملاحظة:</strong> إذا فشل الاختبار، تأكد من:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>الاتصال بالإنترنت يعمل</li>
                <li>مفتاح Google Vision API صحيح</li>
                <li>لا توجد قيود على الشبكة</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleVisionTest;
