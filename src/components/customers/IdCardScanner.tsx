import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  Upload, 
  X, 
  CheckCircle, 
  AlertTriangle,
  Scan,
  CreditCard,
  User,
  Phone,
  MapPin,
  Calendar,
  Loader2,
  RotateCcw,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

interface ExtractedIdData {
  fullName: string;
  idNumber: string;
  nationality: string;
  dateOfBirth: string;
  expiryDate: string;
  phoneNumber?: string;
  address?: string;
  gender?: string;
  qrCodeData?: string;
  confidence: number;
}

interface IdCardScannerProps {
  onDataExtracted: (data: ExtractedIdData) => void;
  onClose?: () => void;
  isArabic?: boolean;
}

export const IdCardScanner: React.FC<IdCardScannerProps> = ({
  onDataExtracted,
  onClose,
  isArabic = true
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedIdData | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<'camera' | 'upload'>('camera');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // بدء الكاميرا
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsScanning(true);
      }
    } catch (error) {
      console.error('خطأ في بدء الكاميرا:', error);
      setError(isArabic ? 'فشل في الوصول للكاميرا' : 'Camera access failed');
      toast.error(isArabic ? 'تأكد من إعطاء الإذن للكاميرا' : 'Please allow camera access');
    }
  }, [isArabic]);

  // إيقاف الكاميرا
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  // التقاط الصورة
  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (!context) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    return canvas.toDataURL('image/jpeg', 0.9);
  }, []);

  // استخراج البيانات من البطاقة القطرية باستخدام Google Vision OCR
  const extractDataFromImage = useCallback(async (imageData: string): Promise<ExtractedIdData> => {
    setIsProcessing(true);
    setScanProgress(0);

    try {
      // استيراد خدمة Google Vision OCR
      const { googleVisionOCR } = await import('@/services/google-vision-ocr');
      
      // رسائل التقدم
      const progressSteps = [
        { step: 20, message: isArabic ? 'تحضير الصورة...' : 'Preparing image...', delay: 600 },
        { step: 40, message: isArabic ? 'إرسال إلى Google Vision...' : 'Sending to Google Vision...', delay: 800 },
        { step: 60, message: isArabic ? 'استخراج النصوص...' : 'Extracting text...', delay: 1200 },
        { step: 80, message: isArabic ? 'تحليل البيانات...' : 'Analyzing data...', delay: 800 },
        { step: 100, message: isArabic ? 'اكتمل!' : 'Complete!', delay: 400 }
      ];

      // عرض رسائل التقدم
      const progressPromise = (async () => {
        for (const { step, message, delay } of progressSteps) {
          await new Promise(resolve => setTimeout(resolve, delay));
          setScanProgress(step);
          toast.info(message, { duration: 600 });
        }
      })();

      // معالجة الصورة باستخدام Google Vision
      const result = await googleVisionOCR.processIdCard(imageData);

      // انتظار انتهاء رسائل التقدم
      await progressPromise;

      if (!result.success || !result.data) {
        throw new Error(result.error || (isArabic ? 'فشل في استخراج البيانات' : 'Failed to extract data'));
      }

      // إظهار معلومات تطويرية إضافية
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 إحصائيات المسح:', {
          processingTime: `${result.processingTime}ms`,
          confidence: `${result.data.confidence}%`,
          rawTextPreview: result.rawText?.substring(0, 100) + '...',
          fieldsExtracted: Object.keys(result.data).filter(key => 
            result.data![key as keyof typeof result.data] && 
            result.data![key as keyof typeof result.data] !== ''
          ).length
        });
      }

      // تحديد جودة الاستخراج وعرض الرسائل المناسبة
      const fieldsExtracted = [
        result.data.fullName,
        result.data.idNumber,
        result.data.nationality,
        result.data.dateOfBirth
      ].filter(field => field && field !== 'غير محدد' && field !== '').length;

      if (result.data.confidence >= 90 && fieldsExtracted >= 4) {
        toast.success(isArabic ? 
          `🎉 مسح ممتاز! تم استخراج جميع البيانات بدقة ${result.data.confidence}%` :
          `🎉 Excellent scan! All data extracted with ${result.data.confidence}% accuracy`
        );
      } else if (result.data.confidence >= 75 && fieldsExtracted >= 3) {
        toast.success(isArabic ? 
          `✅ مسح جيد! تم استخراج ${fieldsExtracted} حقول` :
          `✅ Good scan! ${fieldsExtracted} fields extracted`
        );
      } else if (fieldsExtracted >= 2) {
        toast.warning(isArabic ? 
          '⚠️ تم استخراج بعض البيانات، يرجى المراجعة' :
          '⚠️ Some data extracted, please review'
        );
      } else {
        toast.error(isArabic ? 
          '❌ جودة الصورة منخفضة، يرجى المحاولة مرة أخرى' :
          '❌ Low image quality, please try again'
        );
      }

      return result.data;

    } catch (error) {
      console.error('❌ خطأ في استخراج البيانات:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(isArabic ? 
        `خطأ في معالجة الصورة: ${errorMessage}` : 
        `Image processing error: ${errorMessage}`
      );
      
      // في حالة الخطأ، إرجاع بيانات فارغة مع رسالة خطأ واضحة
      return {
        fullName: 'فشل في استخراج الاسم',
        idNumber: '',
        nationality: 'غير محدد',
        dateOfBirth: '',
        expiryDate: '',
        phoneNumber: '',
        address: '',
        gender: '',
        qrCodeData: '',
        confidence: 0
      };
    } finally {
      setIsProcessing(false);
    }
  }, [isArabic]);

  // معالجة المسح
  const handleScan = useCallback(async () => {
    try {
      setError(null);
      const imageData = captureImage();
      
      if (!imageData) {
        throw new Error(isArabic ? 'فشل في التقاط الصورة' : 'Failed to capture image');
      }

      setCapturedImage(imageData);
      stopCamera();

      const extractedData = await extractDataFromImage(imageData);
      setExtractedData(extractedData);

      if (extractedData.confidence > 80) {
        toast.success(isArabic ? 'تم استخراج البيانات بنجاح!' : 'Data extracted successfully!');
      } else {
        toast.warning(isArabic ? 'جودة المسح منخفضة، يرجى المحاولة مرة أخرى' : 'Low scan quality, please try again');
      }

    } catch (error) {
      console.error('خطأ في المسح:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      toast.error(isArabic ? 'فشل في معالجة الصورة' : 'Failed to process image');
    }
  }, [captureImage, stopCamera, extractDataFromImage, isArabic]);

  // معالجة رفع الملف
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(isArabic ? 'يرجى اختيار صورة صالحة' : 'Please select a valid image');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageData = e.target?.result as string;
      setCapturedImage(imageData);
      
      try {
        const extractedData = await extractDataFromImage(imageData);
        setExtractedData(extractedData);
        toast.success(isArabic ? 'تم تحليل الصورة بنجاح!' : 'Image analyzed successfully!');
      } catch (error) {
        console.error('خطأ في تحليل الصورة:', error);
        toast.error(isArabic ? 'فشل في تحليل الصورة' : 'Failed to analyze image');
      }
    };
    reader.readAsDataURL(file);
  }, [extractDataFromImage, isArabic]);

  // تأكيد البيانات
  const confirmData = useCallback(() => {
    if (extractedData) {
      onDataExtracted(extractedData);
      toast.success(isArabic ? 'تم تطبيق البيانات!' : 'Data applied successfully!');
    }
  }, [extractedData, onDataExtracted, isArabic]);

  // إعادة المسح
  const resetScan = useCallback(() => {
    setExtractedData(null);
    setCapturedImage(null);
    setScanProgress(0);
    setError(null);
    setIsProcessing(false);
  }, []);

  // تنظيف الموارد عند إلغاء المكون
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <Card className="w-full max-w-4xl mx-auto" dir={isArabic ? 'rtl' : 'ltr'}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <CreditCard className="h-6 w-6" />
          {isArabic ? 'مسح البطاقة الشخصية' : 'ID Card Scanner'}
          {extractedData && (
            <Badge variant="secondary" className="mr-2">
              {extractedData.confidence}% {isArabic ? 'دقة' : 'Accuracy'}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* أزرار التحكم */}
        <div className={`flex gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <Button
            variant={scanMode === 'camera' ? 'default' : 'outline'}
            onClick={() => setScanMode('camera')}
            disabled={isProcessing}
          >
            <Camera className="h-4 w-4 mr-2" />
            {isArabic ? 'الكاميرا' : 'Camera'}
          </Button>
          <Button
            variant={scanMode === 'upload' ? 'default' : 'outline'}
            onClick={() => setScanMode('upload')}
            disabled={isProcessing}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isArabic ? 'رفع صورة' : 'Upload Image'}
          </Button>
          {capturedImage && (
            <Button variant="outline" onClick={() => setIsPreviewMode(!isPreviewMode)}>
              {isPreviewMode ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {isArabic ? 'معاينة' : 'Preview'}
            </Button>
          )}
        </div>

        {/* رسائل الخطأ */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* شريط التقدم */}
        {isProcessing && (
          <div className="space-y-2">
            <Progress value={scanProgress} className="w-full" />
            <p className={`text-sm text-muted-foreground ${isArabic ? 'text-right' : 'text-left'}`}>
              {isArabic ? 'جاري معالجة البطاقة...' : 'Processing ID card...'}
            </p>
          </div>
        )}

        {/* واجهة الكاميرا */}
        {scanMode === 'camera' && !capturedImage && (
          <div className="relative">
            <video
              ref={videoRef}
              className="w-full max-h-96 bg-black rounded-lg"
              autoPlay
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* دليل المسح */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-2 border-white border-dashed rounded-lg p-8 bg-black bg-opacity-20">
                <CreditCard className="h-16 w-16 text-white mx-auto mb-2" />
                <p className="text-white text-center">
                  {isArabic ? 'ضع البطاقة هنا' : 'Place ID card here'}
                </p>
              </div>
            </div>

            {/* أزرار التحكم في الكاميرا */}
            <div className={`absolute bottom-4 ${isArabic ? 'right-4' : 'left-4'} flex gap-2`}>
              {!isScanning ? (
                <Button onClick={startCamera} disabled={isProcessing}>
                  <Camera className="h-4 w-4 mr-2" />
                  {isArabic ? 'بدء المسح' : 'Start Scan'}
                </Button>
              ) : (
                <>
                  <Button onClick={handleScan} disabled={isProcessing}>
                    <Scan className="h-4 w-4 mr-2" />
                    {isArabic ? 'التقاط' : 'Capture'}
                  </Button>
                  <Button variant="outline" onClick={stopCamera}>
                    <X className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {/* واجهة رفع الصورة */}
        {scanMode === 'upload' && !capturedImage && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">
              {isArabic ? 'اختر صورة البطاقة الشخصية' : 'Select ID Card Image'}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              {isArabic ? 'PNG, JPG, JPEG (أقصى حجم 10 ميجابايت)' : 'PNG, JPG, JPEG (Max 10MB)'}
            </p>
            <Button onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
              <Upload className="h-4 w-4 mr-2" />
              {isArabic ? 'اختيار صورة' : 'Choose Image'}
            </Button>
          </div>
        )}

        {/* معاينة الصورة */}
        {capturedImage && isPreviewMode && (
          <div className="relative">
            <img
              src={capturedImage}
              alt="Captured ID"
              className="w-full max-h-96 object-contain rounded-lg border"
            />
            <Button
              variant="outline"
              size="sm"
              className={`absolute top-2 ${isArabic ? 'left-2' : 'right-2'}`}
              onClick={() => setIsPreviewMode(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* البيانات المستخرجة */}
        {extractedData && (
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 text-green-800 ${isArabic ? 'flex-row-reverse' : ''}`}>
                <CheckCircle className="h-5 w-5" />
                {isArabic ? 'البيانات المستخرجة' : 'Extracted Data'}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{isArabic ? 'الاسم:' : 'Name:'}</span>
                  <span>{extractedData.fullName}</span>
                </div>
                <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <CreditCard className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{isArabic ? 'رقم الهوية:' : 'ID Number:'}</span>
                  <span dir="ltr">{extractedData.idNumber}</span>
                </div>
                <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{isArabic ? 'الجنسية:' : 'Nationality:'}</span>
                  <span>{extractedData.nationality}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{isArabic ? 'تاريخ الميلاد:' : 'Date of Birth:'}</span>
                  <span>{extractedData.dateOfBirth}</span>
                </div>
                {extractedData.phoneNumber && (
                  <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{isArabic ? 'الهاتف:' : 'Phone:'}</span>
                    <span dir="ltr">{extractedData.phoneNumber}</span>
                  </div>
                )}
                <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{isArabic ? 'تاريخ الانتهاء:' : 'Expiry Date:'}</span>
                  <span>{extractedData.expiryDate}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* أزرار الإجراءات */}
        <div className={`flex gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
          {extractedData ? (
            <>
              <Button onClick={confirmData} className="flex-1">
                <CheckCircle className="h-4 w-4 mr-2" />
                {isArabic ? 'تطبيق البيانات' : 'Apply Data'}
              </Button>
              <Button variant="outline" onClick={resetScan}>
                <RotateCcw className="h-4 w-4 mr-2" />
                {isArabic ? 'مسح جديد' : 'New Scan'}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={onClose} className="flex-1">
              <X className="h-4 w-4 mr-2" />
              {isArabic ? 'إلغاء' : 'Cancel'}
            </Button>
          )}
        </div>

        {/* نصائح الاستخدام */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {isArabic ? (
              <div className="space-y-1">
                <p><strong>نصائح لأفضل النتائج:</strong></p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>تأكد من إضاءة جيدة</li>
                  <li>ضع البطاقة على سطح مستوٍ</li>
                  <li>تجنب الانعكاسات والظلال</li>
                  <li>تأكد من وضوح النص</li>
                </ul>
              </div>
            ) : (
              <div className="space-y-1">
                <p><strong>Tips for best results:</strong></p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>Ensure good lighting</li>
                  <li>Place card on flat surface</li>
                  <li>Avoid reflections and shadows</li>
                  <li>Make sure text is clear</li>
                </ul>
              </div>
            )}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default IdCardScanner; 