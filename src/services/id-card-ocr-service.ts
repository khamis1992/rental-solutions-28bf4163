import { googleVisionOCR, ExtractedIdData, OCRResult } from './google-vision-ocr';

/**
 * خدمة مسح البطاقة الشخصية - واجهة موحدة
 * تستخدم Google Vision API مع fallback للبيانات المحاكاة
 */
export class IdCardOCRService {
  /**
   * معالجة صورة البطاقة الشخصية
   */
  async processIdCard(imageData: string | File): Promise<OCRResult> {
    try {
      // استخدام خدمة Google Vision API
      const result = await googleVisionOCR.processIdCard(imageData);
      
      // إضافة تسجيل للمطورين
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 IdCardOCRService - نتائج المعالجة:', {
          success: result.success,
          confidence: result.data?.confidence || 0,
          processingTime: result.processingTime,
          hasRawText: !!result.rawText
        });
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ خطأ في IdCardOCRService:', error);
      
      // في حالة الخطأ، إنشاء استجابة خطأ
      return {
        success: false,
        error: error instanceof Error ? error.message : 'خطأ غير معروف في معالجة الصورة',
        processingTime: 0
      };
    }
  }

  /**
   * التحقق من توفر خدمة Google Vision API
   */
  isGoogleVisionAvailable(): boolean {
    return !!process.env.VITE_GOOGLE_VISION_API_KEY;
  }

  /**
   * الحصول على معلومات الخدمة
   */
  getServiceInfo() {
    return {
      provider: this.isGoogleVisionAvailable() ? 'Google Vision API' : 'Mock Data',
      isProduction: this.isGoogleVisionAvailable(),
      supportedLanguages: ['ar', 'en'],
      supportedFormats: ['image/jpeg', 'image/png', 'image/webp'],
      maxFileSize: '10MB',
      expectedAccuracy: this.isGoogleVisionAvailable() ? '85-95%' : '0% (Mock)'
    };
  }
}

export const idCardOCRService = new IdCardOCRService();
export type { ExtractedIdData, OCRResult }; 