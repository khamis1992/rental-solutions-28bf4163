import { useState, useCallback } from 'react';
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

interface UseIdCardScannerProps {
  onSuccess?: (data: ExtractedIdData) => void;
  onError?: (error: string) => void;
}

export const useIdCardScanner = ({ onSuccess, onError }: UseIdCardScannerProps = {}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedIdData | null>(null);
  const [scanProgress, setScanProgress] = useState(0);

  // معالجة OCR محاكاة
  const processImageWithOCR = useCallback(async (imageData: string): Promise<ExtractedIdData> => {
    const progressSteps = [
      { step: 25, delay: 800 },
      { step: 50, delay: 1000 },
      { step: 75, delay: 800 },
      { step: 100, delay: 500 }
    ];

    for (const { step, delay } of progressSteps) {
      await new Promise(resolve => setTimeout(resolve, delay));
      setScanProgress(step);
    }

    // بيانات محاكاة
    const mockData = {
      fullName: 'خميس هاشم محمد الجبر',
      idNumber: '29876543210',
      nationality: 'قطري',
      dateOfBirth: '1985-03-15',
      expiryDate: '2030-03-15',
      phoneNumber: '+974 5555 4321',
      address: 'أم صلال، منطقة 71، مبنى 79',
      gender: 'ذكر',
      confidence: 94,
      qrCodeData: 'QID:29876543210:KhasimHashem:QAT:1985-03-15'
    };
    
    return mockData;
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