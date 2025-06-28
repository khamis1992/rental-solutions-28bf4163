import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { googleVisionOCR, ExtractedIdData as GoogleExtractedIdData, OCRResult } from '@/services/google-vision-ocr';

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

interface UseIdCardScannerProps {
  onSuccess?: (data: ExtractedIdData) => void;
  onError?: (error: string) => void;
}

export const useIdCardScanner = ({ onSuccess, onError }: UseIdCardScannerProps = {}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedIdData | null>(null);
  const [scanProgress, setScanProgress] = useState(0);

  // معالجة OCR باستخدام Google Vision API
  const processImageWithOCR = useCallback(async (imageData: string): Promise<ExtractedIdData> => {
    try {
      // رسائل التقدم أثناء المعالجة
      const progressMessages = [
        { step: 25, message: 'تحضير الصورة...', delay: 500 },
        { step: 50, message: 'إرسال إلى Google Vision...', delay: 800 },
        { step: 75, message: 'استخراج النصوص...', delay: 1000 },
        { step: 100, message: 'تحليل البيانات...', delay: 700 }
      ];

      // عرض رسائل التقدم
      const progressPromise = (async () => {
        for (const { step, message, delay } of progressMessages) {
          await new Promise(resolve => setTimeout(resolve, delay));
          setScanProgress(step);
          toast.info(message, { duration: 800 });
        }
      })();

      // معالجة الصورة باستخدام Google Vision
      const result: OCRResult = await googleVisionOCR.processIdCard(imageData);

      // انتظار انتهاء رسائل التقدم
      await progressPromise;

      if (!result.success || !result.data) {
        throw new Error(result.error || 'فشل في استخراج البيانات من الصورة');
      }

      // تحويل النتيجة إلى التنسيق المطلوب
      const extractedData: ExtractedIdData = {
        fullName: result.data.fullName,
        idNumber: result.data.idNumber,
        nationality: result.data.nationality,
        dateOfBirth: result.data.dateOfBirth,
        expiryDate: result.data.expiryDate,
        phoneNumber: result.data.phoneNumber,
        address: result.data.address,
        gender: result.data.gender,
        qrCodeData: result.data.qrCodeData,
        confidence: result.data.confidence
      };

      // إظهار معلومات إضافية في وضع التطوير
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 نتائج Google Vision OCR:', {
          processingTime: `${result.processingTime}ms`,
          confidence: `${result.data.confidence}%`,
          rawTextLength: result.rawText?.length || 0,
          extractedFields: Object.keys(extractedData).filter(key => 
            extractedData[key as keyof ExtractedIdData] && 
            extractedData[key as keyof ExtractedIdData] !== ''
          ).length
        });
      }

      // تحديد جودة الاستخراج
      const fieldsExtracted = [
        extractedData.fullName,
        extractedData.idNumber,
        extractedData.nationality,
        extractedData.dateOfBirth
      ].filter(field => field && field !== 'غير محدد' && field !== '').length;

      if (fieldsExtracted < 2) {
        toast.warning('تم استخراج بعض البيانات، يرجى التحقق من صحتها قبل المتابعة');
      } else if (fieldsExtracted >= 3) {
        toast.success(`تم استخراج ${fieldsExtracted} حقول بنجاح!`);
      }

      return extractedData;

    } catch (error) {
      console.error('❌ خطأ في معالجة OCR:', error);
      
      // في حالة الخطأ، عرض رسالة مفيدة
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
      toast.error(`خطأ في المعالجة: ${errorMessage}`);
      
      // إرجاع خطأ ليتم التعامل معه في المستوى الأعلى
      throw new Error(`فشل في معالجة الصورة: ${errorMessage}`);
    }
  }, []);

  // مسح ملف الصورة
  const scanImageFile = useCallback(async (file: File): Promise<ExtractedIdData | null> => {
    if (!file.type.startsWith('image/')) {
      const error = 'نوع الملف غير مدعوم';
      onError?.(error);
      toast.error(error);
      return null;
    }

    setIsProcessing(true);
    setScanProgress(0);

    try {
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onload = async (e) => {
          try {
            const imageData = e.target?.result as string;
            const data = await processImageWithOCR(imageData);
            setExtractedData(data);
            onSuccess?.(data);
            resolve(data);
          } catch (error) {
            reject(error);
          } finally {
            setIsProcessing(false);
          }
        };
        reader.onerror = () => reject(new Error('فشل في قراءة الملف'));
        reader.readAsDataURL(file);
      });
    } catch (error) {
      setIsProcessing(false);
      const errorMsg = error instanceof Error ? error.message : 'خطأ غير معروف';
      onError?.(errorMsg);
      toast.error(`فشل في معالجة الصورة: ${errorMsg}`);
      return null;
    }
  }, [processImageWithOCR, onSuccess, onError]);

  // مسح صورة الكاميرا
  const scanCameraImage = useCallback(async (imageData: string): Promise<ExtractedIdData | null> => {
    setIsProcessing(true);
    setScanProgress(0);

    try {
      const data = await processImageWithOCR(imageData);
      setExtractedData(data);
      onSuccess?.(data);
      return data;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'خطأ غير معروف';
      onError?.(errorMsg);
      toast.error(`فشل في معالجة الصورة: ${errorMsg}`);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [processImageWithOCR, onSuccess, onError]);

  // إعادة تعيين
  const resetScanner = useCallback(() => {
    setExtractedData(null);
    setScanProgress(0);
    setIsProcessing(false);
    setIsScanning(false);
  }, []);

  return {
    isScanning,
    isProcessing,
    extractedData,
    scanProgress,
    scanImageFile,
    scanCameraImage,
    resetScanner,
    setIsScanning,
    setIsProcessing
  };
};

export type { ExtractedIdData }; 