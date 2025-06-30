// React Hook for ID Card Scanner - Complete Implementation
import { useState, useCallback } from 'react';
import { googleVisionOcrService, QatariIdCardData, OcrResult } from '@/services/google-vision-ocr';
import { toast } from 'sonner';

export interface ScanOptions {
  maxFileSize?: number; // in MB
  allowedTypes?: string[];
  mockData?: boolean;
}

export interface ScanResult {
  success: boolean;
  data?: QatariIdCardData;
  error?: string;
  confidence?: number;
  processingTime?: number;
}

export const useIdCardScanner = (options: ScanOptions = {}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  
  const {
    maxFileSize = 10, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'],
    mockData = false
  } = options;

  // Mock data for testing/fallback
  const generateMockData = useCallback((): QatariIdCardData => {
    const mockNames = [
      'أحمد محمد العبدالله',
      'فاطمة علي الكعبي',
      'محمد عبدالرحمن النعيمي',
      'عائشة سالم المري',
      'خالد يوسف الثاني'
    ];
    
    const randomName = mockNames[Math.floor(Math.random() * mockNames.length)];
    const randomId = '2' + Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
    
    return {
      fullName: randomName,
      nationality: 'قطري',
      idNumber: randomId,
      dateOfBirth: '15/03/1990',
      expiryDate: '15/03/2030',
      documentType: 'بطاقة هوية قطرية'
    };
  }, []);

  // Validate file before processing
  const validateFile = useCallback((file: File): boolean => {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      toast.error(`نوع الملف غير مدعوم. يرجى استخدام: ${allowedTypes.join(', ')}`);
      return false;
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSize) {
      toast.error(`حجم الملف كبير جداً. الحد الأقصى: ${maxFileSize}MB`);
      return false;
    }

    return true;
  }, [allowedTypes, maxFileSize]);

  // Convert file to base64
  const fileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('فشل في قراءة الملف'));
        }
      };
      reader.onerror = () => reject(new Error('خطأ في قراءة الملف'));
      reader.readAsDataURL(file);
    });
  }, []);

  // Main scanning function
  const scanIdCard = useCallback(async (file: File): Promise<ScanResult> => {
    console.log('🎯 Starting ID card scan process...');
    setIsScanning(true);
    
    const startTime = Date.now();
    
    try {
      // Validate file first
      if (!validateFile(file)) {
        return {
          success: false,
          error: 'ملف غير صالح'
        };
      }

      // Show scanning progress
      toast.loading('جاري مسح البطاقة الشخصية...', {
        id: 'scanning-progress'
      });

      // Use mock data if enabled
      if (mockData) {
        console.log('📝 Using mock data for testing');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time
        
        const mockResult: ScanResult = {
          success: true,
          data: generateMockData(),
          confidence: 95,
          processingTime: Date.now() - startTime
        };
        
        setLastResult(mockResult);
        toast.dismiss('scanning-progress');
        toast.success('تم مسح البطاقة بنجاح (بيانات تجريبية)');
        return mockResult;
      }

      // Convert file to base64
      const base64Image = await fileToBase64(file);
      console.log('📷 Image converted to base64');

      // Validate that it's a Qatari ID card
      const isValidQatariId = await googleVisionOcrService.validateQatariIdCard(base64Image);
      if (!isValidQatariId) {
        console.warn('⚠️ Image may not be a valid Qatari ID card');
        toast.dismiss('scanning-progress');
        toast.warning('تحذير: قد لا تكون الصورة لبطاقة هوية قطرية صالحة');
      }

      // Extract text using Google Vision OCR
      const ocrResult: OcrResult = await googleVisionOcrService.extractTextFromImage(base64Image);
      
      const result: ScanResult = {
        success: ocrResult.success,
        data: ocrResult.data,
        error: ocrResult.error,
        confidence: ocrResult.confidence,
        processingTime: Date.now() - startTime
      };

      setLastResult(result);
      toast.dismiss('scanning-progress');

      if (result.success && result.data) {
        console.log('✅ Scan completed successfully:', result);
        toast.success(`تم المسح بنجاح! دقة النتائج: ${result.confidence}%`);
      } else {
        console.error('❌ Scan failed:', result.error);
        toast.error(`فشل في المسح: ${result.error}`);
      }

      return result;

    } catch (error) {
      console.error('❌ Scanning error:', error);
      
      const errorResult: ScanResult = {
        success: false,
        error: error instanceof Error ? error.message : 'خطأ غير معروف في المسح',
        processingTime: Date.now() - startTime
      };
      
      setLastResult(errorResult);
      toast.dismiss('scanning-progress');
      toast.error(`خطأ في المسح: ${errorResult.error}`);
      
      return errorResult;
    } finally {
      setIsScanning(false);
    }
  }, [validateFile, fileToBase64, mockData, generateMockData]);

  // Scan from camera (file input)
  const scanFromCamera = useCallback((event: React.ChangeEvent<HTMLInputElement>): Promise<ScanResult> => {
    const file = event.target.files?.[0];
    if (file) {
      return scanIdCard(file);
    }
    return Promise.resolve({
      success: false,
      error: 'لم يتم اختيار ملف'
    } as ScanResult);
  }, [scanIdCard]);

  // Scan from drag and drop
  const scanFromDrop = useCallback((files: FileList): Promise<ScanResult> => {
    const file = files[0];
    if (file) {
      return scanIdCard(file);
    }
    return Promise.resolve({
      success: false,
      error: 'لم يتم إفلات ملف'
    } as ScanResult);
  }, [scanIdCard]);

  // Clear last result
  const clearResult = useCallback(() => {
    setLastResult(null);
  }, []);

  // Test with mock data
  const testWithMockData = useCallback(async (): Promise<ScanResult> => {
    console.log('🧪 Testing with mock data...');
    setIsScanning(true);
    
    const startTime = Date.now();
    
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockResult: ScanResult = {
        success: true,
        data: generateMockData(),
        confidence: Math.floor(Math.random() * 15) + 85, // 85-100%
        processingTime: Date.now() - startTime
      };
      
      setLastResult(mockResult);
      toast.success('تم اختبار النظام بنجاح!');
      
      return mockResult;
    } catch (error) {
      const errorResult: ScanResult = {
        success: false,
        error: 'فشل في اختبار النظام',
        processingTime: Date.now() - startTime
      };
      
      setLastResult(errorResult);
      toast.error('فشل في اختبار النظام');
      
      return errorResult;
    } finally {
      setIsScanning(false);
    }
  }, [generateMockData]);

  return {
    // State
    isScanning,
    lastResult,
    
    // Actions
    scanIdCard,
    scanFromCamera,
    scanFromDrop,
    clearResult,
    testWithMockData,
    
    // Utilities
    validateFile,
    
    // Configuration
    options: {
      maxFileSize,
      allowedTypes,
      mockData
    }
  };
}; 