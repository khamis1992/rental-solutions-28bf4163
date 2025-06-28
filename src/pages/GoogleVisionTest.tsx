import React from 'react';
import { GoogleVisionTestComponent } from '@/components/customers/GoogleVisionTestComponent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Info } from 'lucide-react';

/**
 * صفحة اختبار Google Vision API
 */
const GoogleVisionTest: React.FC = () => {
  // التحقق من توفر API Key
  const hasApiKey = !!import.meta.env.VITE_GOOGLE_VISION_API_KEY;
  const apiKeyPreview = import.meta.env.VITE_GOOGLE_VISION_API_KEY?.substring(0, 10) + '...';

  return (
    <div className="min-h-screen bg-gray-50 py-8" dir="rtl">
      <div className="max-w-6xl mx-auto px-4">
        {/* Status Header */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-3">
              {hasApiKey ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-red-600" />
              )}
              حالة Google Vision API
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">حالة API Key</span>
                </div>
                <Badge variant={hasApiKey ? "default" : "destructive"}>
                  {hasApiKey ? 'مُعد ✅' : 'غير مُعد ❌'}
                </Badge>
                {hasApiKey && (
                  <p className="text-sm text-blue-700 mt-1">
                    {apiKeyPreview}
                  </p>
                )}
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-900">الخدمة</span>
                </div>
                <p className="text-green-800">
                  {hasApiKey ? 'Google Vision API' : 'البيانات المحاكاة'}
                </p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-purple-900">الدقة المتوقعة</span>
                </div>
                <p className="text-purple-800">
                  {hasApiKey ? '85-95%' : '0% (وهمي)'}
                </p>
              </div>
            </div>

            {!hasApiKey && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">تحذير:</span>
                </div>
                <p className="text-yellow-700 mt-1">
                  لم يتم تحديد Google Vision API Key. النظام سيستخدم البيانات المحاكاة.
                  أضف VITE_GOOGLE_VISION_API_KEY في ملف .env لاستخدام الخدمة الحقيقية.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Component */}
        <GoogleVisionTestComponent />

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              تعليمات الاختبار
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">كيفية اختبار النظام:</h4>
                <ol className="list-decimal list-inside space-y-1 text-gray-700">
                  <li>اضغط على "اختيار صورة" أعلاه</li>
                  <li>ارفع صورة بطاقة شخصية قطرية واضحة</li>
                  <li>انتظر المعالجة (1-4 ثواني)</li>
                  <li>راجع النتائج المستخرجة</li>
                  <li>تحقق من دقة البيانات</li>
                </ol>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">للحصول على أفضل النتائج:</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>استخدم صور عالية الدقة (1920x1080+)</li>
                  <li>تأكد من الإضاءة الجيدة والمتساوية</li>
                  <li>تجنب الانعكاسات والظلال</li>
                  <li>ضع البطاقة بشكل مستقيم</li>
                </ul>
              </div>

              {hasApiKey && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-green-800">
                    🎉 <strong>ممتاز!</strong> Google Vision API مُعد ويعمل. 
                    يمكنك الآن مسح البطاقات الحقيقية بدقة عالية!
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GoogleVisionTest; 