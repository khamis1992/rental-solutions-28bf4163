import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Upload, Brain, Zap, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';
import { carRentalContractOcrService } from '@/services/car-rental-contract-ocr';

interface SystemStatus {
  googleVision: boolean;
  openaiApi: boolean;
  googleVisionKey: string;
  openaiKey: string;
}

const CarRentalContractTest: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [testText, setTestText] = useState<string>('');

  // فحص حالة النظام عند التحميل
  React.useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = () => {
    const googleVisionKey = import.meta.env.VITE_GOOGLE_VISION_API_KEY || '';
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    
    setSystemStatus({
      googleVision: googleVisionKey.length > 20,
      openaiApi: openaiKey.length > 20,
      googleVisionKey: googleVisionKey ? `${googleVisionKey.substring(0, 10)}...` : 'غير موجود',
      openaiKey: openaiKey ? `${openaiKey.substring(0, 10)}...` : 'غير موجود'
    });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSelectedImage(result);
        setExtractedData(null);
        setError(null);
        setDebugInfo(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTestWithSampleText = () => {
    const sampleContractText = `
اتفاقية إيجار سيارة - قطر

الطرف الأول: شركة الأرف لتأجير السيارات
الطرف الثاني: محمد علي فتوح

بيانات العميل:
الاسم الكامل: محمد علي فتوح
الجنسية: تونسي
رقم الهوية القطرية: 28945612378
رقم الهاتف: 55123456
العنوان: الدوحة، قطر

بيانات المركبة:
الماركة: تويوتا
الموديل: كامري
سنة الصنع: 2023
رقم اللوحة: 123456
رقم الشاسيه: JTDKN3DU8E0123456
اللون: أبيض

تفاصيل العقد:
تاريخ بداية العقد: 15/03/2024
مدة العقد: 12 شهر
الإيجار الشهري: 2500 ريال قطري
رقم العقد: RC/2024/001

تم توقيع هذه الاتفاقية في تاريخ 15/03/2024
    `;
    
    setTestText(sampleContractText);
    setSelectedImage(null);
    setExtractedData(null);
    setError(null);
    setDebugInfo(null);
  };

  const handleExtraction = async () => {
    if (!selectedImage && !testText) return;

    setIsLoading(true);
    setError(null);
    setExtractedData(null);
    setDebugInfo(null);

    try {
      console.log('🚀 بدء استخراج البيانات من العقد...');
      
      const ocrService = carRentalContractOcrService;
      const base64Data = selectedImage ? selectedImage.split(',')[1] : testText;
      
      const result = await ocrService.extractContractFromImage(base64Data);
      
      console.log('✅ اكتملت عملية الاستخراج:', result);
      
      if (result.success && result.data) {
        setExtractedData(result.data);
        setDebugInfo(result.debugInfo);
      } else {
        setError(result.error || 'فشل في استخراج البيانات');
      }
    } catch (err) {
      console.error('❌ خطأ في الاستخراج:', err);
      setError('حدث خطأ أثناء معالجة الصورة');
    } finally {
      setIsLoading(false);
    }
  };

  const getMethodBadge = (method: string) => {
    if (method?.includes('chatgpt')) {
      return <Badge className="bg-green-500 text-white"><Brain className="w-3 h-3 mr-1" />ChatGPT AI</Badge>;
    } else if (method?.includes('advanced')) {
      return <Badge className="bg-blue-500 text-white"><Zap className="w-3 h-3 mr-1" />تحليل متطور</Badge>;
    } else {
      return <Badge className="bg-orange-500 text-white"><AlertTriangle className="w-3 h-3 mr-1" />تحليل تقليدي</Badge>;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 70) return 'text-blue-600';
    if (confidence >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">اختبار نظام استخراج عقود إيجار السيارات</h1>
        <p className="text-gray-600">نظام هجين يستخدم ChatGPT + Google Vision OCR</p>
      </div>

      {/* حالة النظام */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            حالة النظام
          </CardTitle>
        </CardHeader>
        <CardContent>
          {systemStatus && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  {systemStatus.googleVision ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className="font-medium">Google Vision OCR</span>
                </div>
                <div className="text-sm text-gray-600">
                  {systemStatus.googleVisionKey}
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  {systemStatus.openaiApi ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className="font-medium">ChatGPT API</span>
                </div>
                <div className="text-sm text-gray-600">
                  {systemStatus.openaiKey}
                </div>
              </div>
            </div>
          )}
          
          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {systemStatus?.openaiApi ? (
                <span className="text-green-700">✅ النظام جاهز لاستخدام ChatGPT للتحليل الذكي</span>
              ) : (
                <span className="text-orange-700">⚠️ سيتم استخدام التحليل المحسن كبديل عن ChatGPT</span>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* رفع الصورة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            رفع صورة العقد أو اختبار بنص تجريبي
          </CardTitle>
          <CardDescription>
            ارفع صورة واضحة لعقد إيجار السيارة أو استخدم النص التجريبي لاختبار النظام
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            ref={fileInputRef}
            className="hidden"
          />
          
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              اختر صورة
            </Button>
            
            <Button 
              onClick={handleTestWithSampleText}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Brain className="w-4 h-4" />
              اختبار بنص تجريبي
            </Button>
            
            <Button 
              onClick={handleExtraction}
              disabled={(!selectedImage && !testText) || isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  جاري الاستخراج...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  استخراج البيانات
                </>
              )}
            </Button>
          </div>

          {selectedImage && (
            <div className="mt-4">
              <img 
                src={selectedImage} 
                alt="العقد المرفوع" 
                className="max-w-full h-auto max-h-64 object-contain border rounded-lg"
              />
            </div>
          )}

          {testText && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">النص التجريبي:</h4>
              <div className="text-sm text-gray-700 max-h-32 overflow-y-auto">
                {testText.substring(0, 300)}...
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* معلومات التشخيص */}
      {debugInfo && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-500" />
              معلومات التشخيص
              {getMethodBadge(debugInfo.extractionMethod)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">طريقة الاستخراج:</span>
                <span className="mr-2">{debugInfo.extractionMethod}</span>
              </div>
              <div>
                <span className="font-medium">مستوى الثقة:</span>
                <span className={`mr-2 font-bold ${getConfidenceColor(debugInfo.advancedAnalysis?.confidenceLevel || 0)}`}>
                  {debugInfo.advancedAnalysis?.confidenceLevel || 0}%
                </span>
              </div>
            </div>
            
            {debugInfo.warningMessage && (
              <Alert className="bg-orange-50 border-orange-200">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <AlertDescription className="text-orange-700">
                  {debugInfo.warningMessage}
                </AlertDescription>
              </Alert>
            )}
            
            {debugInfo.aiAnalysis && (
              <div className="bg-green-50 p-3 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">تحليل ChatGPT AI:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-green-700">
                  <div>النموذج: {debugInfo.aiAnalysis.modelUsed}</div>
                  <div>وقت الاستجابة: {debugInfo.aiAnalysis.responseTime}ms</div>
                  <div>Tokens المستخدمة: {debugInfo.aiAnalysis.totalTokens}</div>
                  <div>مستوى الثقة: {debugInfo.aiAnalysis.confidenceLevel}%</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* النتائج */}
      {extractedData && (
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-5 h-5" />
              البيانات المستخرجة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* بيانات العميل */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-blue-700">بيانات العميل</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <span className="font-medium text-blue-800">الاسم الكامل:</span>
                  <div className="text-blue-600">{extractedData.customer.fullName || 'غير محدد'}</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <span className="font-medium text-blue-800">الجنسية:</span>
                  <div className="text-blue-600">{extractedData.customer.nationality || 'غير محدد'}</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <span className="font-medium text-blue-800">رقم الهوية:</span>
                  <div className="text-blue-600">{extractedData.customer.qidNumber || 'غير محدد'}</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <span className="font-medium text-blue-800">رقم الهاتف:</span>
                  <div className="text-blue-600">{extractedData.customer.phoneNumber || 'غير محدد'}</div>
                </div>
              </div>
            </div>

            <Separator />

            {/* بيانات المركبة */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-purple-700">بيانات المركبة</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-purple-50 p-3 rounded-lg">
                  <span className="font-medium text-purple-800">الماركة:</span>
                  <div className="text-purple-600">{extractedData.vehicle.brand || 'غير محدد'}</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <span className="font-medium text-purple-800">رقم اللوحة:</span>
                  <div className="text-purple-600">{extractedData.vehicle.registrationNumber || 'غير محدد'}</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <span className="font-medium text-purple-800">سنة الصنع:</span>
                  <div className="text-purple-600">{extractedData.vehicle.manufacturingYear || 'غير محدد'}</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <span className="font-medium text-purple-800">رقم الشاسيه:</span>
                  <div className="text-purple-600">{extractedData.vehicle.chassisNumber || 'غير محدد'}</div>
                </div>
              </div>
            </div>

            <Separator />

            {/* بيانات العقد */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-green-700">بيانات العقد</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 p-3 rounded-lg">
                  <span className="font-medium text-green-800">تاريخ البداية:</span>
                  <div className="text-green-600">{extractedData.contract.startDate || 'غير محدد'}</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <span className="font-medium text-green-800">الإيجار الشهري:</span>
                  <div className="text-green-600">
                    {extractedData.contract.monthlyRent ? `${extractedData.contract.monthlyRent} ريال` : 'غير محدد'}
                  </div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <span className="font-medium text-green-800">مدة العقد:</span>
                  <div className="text-green-600">
                    {extractedData.contract.contractDuration ? `${extractedData.contract.contractDuration} شهر` : 'غير محدد'}
                  </div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <span className="font-medium text-green-800">رقم العقد:</span>
                  <div className="text-green-600">{extractedData.contract.contractNumber || 'غير محدد'}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* الأخطاء */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-700">
            {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default CarRentalContractTest; 