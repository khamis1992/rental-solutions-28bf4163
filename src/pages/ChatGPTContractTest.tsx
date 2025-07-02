import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Textarea } from '@/components/ui/textarea';

import { Alert, AlertDescription } from '@/components/ui/alert';

import { 
  Brain, 
  Zap, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Target, 
  TrendingUp, 
  AlertCircle, 
  User,
  Car,
  Calendar,
  Copy,
  Loader2
} from 'lucide-react';
import { chatGPTContractExtractor } from '@/services/chatgpt-contract-extractor';
import type { ContractOcrResult } from '@/services/chatgpt-contract-extractor';
import { useToast } from '@/hooks/use-toast';

const ChatGPTContractTest: React.FC = () => {
  const [contractText, setContractText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ContractOcrResult | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const { toast } = useToast();

  // نموذج تجريبي لعقد إيجار سيارة
  const sampleContract = `
عقد إيجار سيارة رقم: 2024/001

المؤجر: شركة الأرف لتأجير السيارات
العنوان: الدوحة، قطر

المستأجر: أحمد محمد علي السعدي
الجنسية: قطري
رقم الهوية القطرية: 28501234567
رقم رخصة القيادة: DL123456789
العنوان: شارع الكورنيش، الدوحة
رقم الهاتف: +974 5555 1234

بيانات المركبة:
الماركة: تويوتا
الموديل: كامري
سنة الصنع: 2023
اللون: أبيض
رقم اللوحة: 123456
رقم الشاسيه: JTDKAMFV12A123456

تفاصيل العقد:
تاريخ بداية العقد: 01/01/2024
مدة العقد: 12 شهر
الإيجار الشهري: 2500 ريال قطري

التوقيع: _____________
التاريخ: 01/01/2024
  `.trim();

  const processContract = async () => {
    if (!contractText.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال نص العقد أولاً",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);
    setResult(null);

    try {
      // محاكاة تقدم المعالجة
      const progressSteps = [
        { step: 25, message: 'إرسال النص إلى ChatGPT...' },
        { step: 50, message: 'تحليل النص بالذكاء الاصطناعي...' },
        { step: 75, message: 'استخراج البيانات...' },
        { step: 100, message: 'اكتمل!' }
      ];

      for (const progressStep of progressSteps) {
        setProcessingProgress(progressStep.step);
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      const extractionResult = await chatGPTContractExtractor.extractContractFromText(contractText);
      setResult(extractionResult);

      if (extractionResult.success) {
        toast({
          title: "تم التحليل بنجاح! 🎉",
          description: `تم استخراج البيانات بثقة ${extractionResult.confidence}%`,
        });
      } else {
        toast({
          title: "فشل في التحليل",
          description: extractionResult.error || "حدث خطأ غير معروف",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('خطأ في معالجة العقد:', error);
      toast({
        title: "خطأ في المعالجة",
        description: "حدث خطأ أثناء معالجة العقد",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  const loadSampleContract = () => {
    setContractText(sampleContract);
    setResult(null);
    toast({
      title: "تم تحميل النموذج",
      description: "تم تحميل نموذج عقد إيجار سيارة للاختبار",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "تم النسخ",
      description: "تم نسخ النص إلى الحافظة",
    });
  };

  const renderCustomerData = (data: any) => (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-600">الاسم الكامل</label>
          <p className="text-lg font-semibold text-gray-900 p-2 bg-gray-50 rounded border">
            {data.fullName || 'غير محدد'}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">الجنسية</label>
          <p className="text-lg font-semibold text-gray-900 p-2 bg-gray-50 rounded border">
            {data.nationality || 'غير محدد'}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">رقم الهوية القطرية</label>
          <p className="text-lg font-semibold text-gray-900 p-2 bg-gray-50 rounded border">
            {data.qidNumber || 'غير محدد'}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">رقم رخصة القيادة</label>
          <p className="text-lg font-semibold text-gray-900 p-2 bg-gray-50 rounded border">
            {data.licenseNumber || 'غير محدد'}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">رقم الهاتف</label>
          <p className="text-lg font-semibold text-gray-900 p-2 bg-gray-50 rounded border">
            {data.phoneNumber || 'غير محدد'}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">العنوان</label>
          <p className="text-lg font-semibold text-gray-900 p-2 bg-gray-50 rounded border">
            {data.address || 'غير محدد'}
          </p>
        </div>
      </div>
    </div>
  );

  const renderVehicleData = (data: any) => (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-600">الماركة</label>
          <p className="text-lg font-semibold text-gray-900 p-2 bg-gray-50 rounded border">
            {data.brand || 'غير محدد'}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">الموديل</label>
          <p className="text-lg font-semibold text-gray-900 p-2 bg-gray-50 rounded border">
            {data.model || 'غير محدد'}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">رقم اللوحة</label>
          <p className="text-lg font-semibold text-gray-900 p-2 bg-gray-50 rounded border">
            {data.registrationNumber || 'غير محدد'}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">رقم الشاسيه</label>
          <p className="text-lg font-semibold text-gray-900 p-2 bg-gray-50 rounded border">
            {data.chassisNumber || 'غير محدد'}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">سنة الصنع</label>
          <p className="text-lg font-semibold text-gray-900 p-2 bg-gray-50 rounded border">
            {data.manufacturingYear || 'غير محدد'}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">اللون</label>
          <p className="text-lg font-semibold text-gray-900 p-2 bg-gray-50 rounded border">
            {data.color || 'غير محدد'}
          </p>
        </div>
      </div>
    </div>
  );

  const renderContractData = (data: any) => (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-600">رقم العقد</label>
          <p className="text-lg font-semibold text-gray-900 p-2 bg-gray-50 rounded border">
            {data.contractNumber || 'غير محدد'}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">تاريخ بداية العقد</label>
          <p className="text-lg font-semibold text-gray-900 p-2 bg-gray-50 rounded border">
            {data.startDate || 'غير محدد'}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">الإيجار الشهري</label>
          <p className="text-lg font-semibold text-gray-900 p-2 bg-gray-50 rounded border">
            {data.monthlyRent ? `${data.monthlyRent} ريال قطري` : 'غير محدد'}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">مدة العقد</label>
          <p className="text-lg font-semibold text-gray-900 p-2 bg-gray-50 rounded border">
            {data.contractDuration ? `${data.contractDuration} شهر` : 'غير محدد'}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Brain className="w-10 h-10 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              اختبار ChatGPT لتحليل العقود
            </h1>
          </div>
          <div className="flex items-center justify-center gap-4">
            <Badge variant="default" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              مدعوم بـ ChatGPT-4
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              تحليل ذكي
            </Badge>
            <Badge variant="outline" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              دقة عالية
            </Badge>
          </div>
          <p className="text-lg text-gray-600">
            اختبر قوة ChatGPT في تحليل واستخراج بيانات عقود إيجار السيارات بذكاء اصطناعي
          </p>
        </div>

        {/* System Features */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Brain className="w-6 h-6" />
              مزايا ChatGPT للعقود
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center space-y-2">
                <Brain className="w-8 h-8 text-blue-600 mx-auto" />
                <h3 className="font-semibold text-gray-800">فهم السياق</h3>
                <p className="text-sm text-gray-600">يفهم معنى النص بذكاء طبيعي</p>
              </div>
              <div className="text-center space-y-2">
                <Target className="w-8 h-8 text-green-600 mx-auto" />
                <h3 className="font-semibold text-gray-800">تصحيح الأخطاء</h3>
                <p className="text-sm text-gray-600">يصحح الأخطاء الإملائية تلقائياً</p>
              </div>
              <div className="text-center space-y-2">
                <FileText className="w-8 h-8 text-purple-600 mx-auto" />
                <h3 className="font-semibold text-gray-800">فهم قانوني</h3>
                <p className="text-sm text-gray-600">يفهم المصطلحات القانونية</p>
              </div>
              <div className="text-center space-y-2">
                <TrendingUp className="w-8 h-8 text-orange-600 mx-auto" />
                <h3 className="font-semibold text-gray-800">استنتاج ذكي</h3>
                <p className="text-sm text-gray-600">يستنتج البيانات المفقودة</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                إدخال نص العقد
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  النص الكامل لعقد إيجار السيارة
                </label>
                <Textarea
                  value={contractText}
                  onChange={(e) => setContractText(e.target.value)}
                  placeholder="الصق نص العقد هنا..."
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={loadSampleContract}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  تحميل نموذج
                </Button>
                
                <Button
                  onClick={() => copyToClipboard(contractText)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  disabled={!contractText}
                >
                  <Copy className="w-4 h-4" />
                  نسخ
                </Button>
              </div>
              
              <Button
                onClick={processContract}
                disabled={!contractText.trim() || isProcessing}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    جاري التحليل...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    تحليل بـ ChatGPT
                  </>
                )}
              </Button>

              {isProcessing && (
                <div className="space-y-2">
                  <Progress value={processingProgress} className="w-full" />
                  <p className="text-sm text-gray-600 text-center">
                    جاري التحليل بواسطة ChatGPT...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                نتائج التحليل
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-4">
                  {result.success ? (
                    <>
                      <div className="flex items-center justify-between">
                        <Badge variant={result.confidence! > 80 ? "default" : "secondary"}>
                          دقة التحليل: {result.confidence}%
                        </Badge>
                        <Progress value={result.confidence} className="w-32" />
                      </div>
                      
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          تم تحليل العقد بنجاح باستخدام ChatGPT AI
                        </AlertDescription>
                      </Alert>

                      {result.debugInfo && (
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><strong>طريقة الاستخراج:</strong> {result.debugInfo.extractionMethod}</p>
                          {result.debugInfo.tokensUsed && (
                            <p><strong>Tokens المستخدمة:</strong> {result.debugInfo.tokensUsed}</p>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        {result.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Brain className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>قم بإدخال نص العقد واضغط "تحليل بـ ChatGPT"</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Extracted Data */}
        {result?.success && result.data && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <User className="w-5 h-5" />
                    بيانات العميل
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderCustomerData(result.data.customer)}
                </CardContent>
              </Card>

              <Card className="border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <Car className="w-5 h-5" />
                    بيانات المركبة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderVehicleData(result.data.vehicle)}
                </CardContent>
              </Card>

              <Card className="border-purple-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-700">
                    <Calendar className="w-5 h-5" />
                    بيانات العقد
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderContractData(result.data.contract)}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Tips */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">💡 نصائح للحصول على أفضل النتائج</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-blue-700">
              <li>• تأكد من وجود جميع البيانات الأساسية في النص</li>
              <li>• استخدم نص واضح ومنظم</li>
              <li>• تأكد من صحة الأرقام والتواريخ</li>
              <li>• ChatGPT يفهم النصوص العربية والإنجليزية</li>
              <li>• يمكن تصحيح الأخطاء الإملائية البسيطة تلقائياً</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChatGPTContractTest; 