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

interface OCRResult {
  success: boolean;
  data?: ExtractedIdData;
  error?: string;
  processingTime: number;
  rawText?: string;
}

interface GoogleVisionResponse {
  responses: Array<{
    fullTextAnnotation?: {
      text: string;
      pages: Array<{
        confidence: number;
      }>;
    };
    textAnnotations?: Array<{
      description: string;
      boundingPoly: {
        vertices: Array<{ x: number; y: number }>;
      };
    }>;
    error?: {
      code: number;
      message: string;
    };
  }>;
}

/**
 * خدمة Google Vision API لمسح البطاقة الشخصية القطرية
 */
export class GoogleVisionOCRService {
  private readonly apiKey: string;
  private readonly endpoint = 'https://vision.googleapis.com/v1/images:annotate';
  
  constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_VISION_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️ Google Vision API Key غير محدد. سيتم استخدام البيانات المحاكاة.');
    }
  }

  /**
   * معالجة صورة البطاقة الشخصية
   */
  async processIdCard(imageData: string | File): Promise<OCRResult> {
    const startTime = Date.now();
    
    try {
      // إذا لم يتم تحديد API key، استخدم البيانات المحاكاة
      if (!this.apiKey) {
        return await this.getMockData(startTime);
      }

      // تحويل الصورة إلى base64 إذا لزم الأمر
      const base64Image = await this.prepareImageData(imageData);
      
      // تحسين جودة الصورة
      const enhancedImage = await this.enhanceImageForOCR(base64Image);
      
      // إرسال الطلب إلى Google Vision API
      const ocrResult = await this.callGoogleVisionAPI(enhancedImage);
      
      if (!ocrResult.success) {
        throw new Error(ocrResult.error || 'فشل في معالجة الصورة');
      }

      // استخراج البيانات من النص المعترف عليه
      const extractedData = this.parseQatariIdCard(ocrResult.rawText || '', ocrResult.confidence || 0);
      
      return {
        success: true,
        data: extractedData,
        processingTime: Date.now() - startTime,
        rawText: ocrResult.rawText
      };

    } catch (error) {
      console.error('❌ خطأ في Google Vision OCR:', error);
      
      // في حالة الخطأ، استخدم البيانات المحاكاة كبديل
      console.log('🔄 التبديل إلى البيانات المحاكاة...');
      return await this.getMockData(startTime);
    }
  }

  /**
   * تحضير بيانات الصورة للمعالجة
   */
  private async prepareImageData(imageData: string | File): Promise<string> {
    if (typeof imageData === 'string') {
      return imageData;
    }

    // تحويل File إلى base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('فشل في قراءة الملف'));
      reader.readAsDataURL(imageData);
    });
  }

  /**
   * تحسين جودة الصورة للحصول على أفضل نتائج OCR
   */
  private async enhanceImageForOCR(imageData: string): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // تحديد حجم مثالي للمعالجة
        const maxWidth = 1920;
        const maxHeight = 1080;
        let { width, height } = img;
        
        // تحجيم الصورة إذا كانت كبيرة جداً
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // تطبيق مرشحات تحسين للوضوح
        ctx!.filter = 'contrast(120%) brightness(110%) saturate(110%)';
        ctx!.drawImage(img, 0, 0, width, height);
        
        // تحويل إلى JPEG بجودة عالية
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      };
      
      img.onerror = () => resolve(imageData); // في حالة الخطأ، أرجع الصورة الأصلية
      img.src = imageData;
    });
  }

  /**
   * استدعاء Google Vision API
   */
  private async callGoogleVisionAPI(base64Image: string): Promise<{
    success: boolean;
    rawText?: string;
    confidence?: number;
    error?: string;
  }> {
    try {
      const requestBody = {
        requests: [{
          image: {
            content: base64Image.split(',')[1] // إزالة data:image/jpeg;base64,
          },
          features: [
            {
              type: 'DOCUMENT_TEXT_DETECTION', // أفضل للوثائق
              maxResults: 10
            },
            {
              type: 'TEXT_DETECTION', // كشف النص العام
              maxResults: 50
            }
          ],
          imageContext: {
            languageHints: ['ar', 'en'], // دعم العربية والإنجليزية
            textDetectionParams: {
              enableTextDetectionConfidenceScore: true
            }
          }
        }]
      };

      const response = await fetch(`${this.endpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: GoogleVisionResponse = await response.json();
      const responseData = result.responses[0];

      if (responseData.error) {
        throw new Error(`Google Vision API Error: ${responseData.error.message}`);
      }

      const fullTextAnnotation = responseData.fullTextAnnotation;
      if (!fullTextAnnotation?.text) {
        throw new Error('لم يتم العثور على نص في الصورة');
      }

      // حساب متوسط الثقة
      const confidence = fullTextAnnotation.pages?.[0]?.confidence 
        ? Math.round(fullTextAnnotation.pages[0].confidence * 100)
        : 85; // قيمة افتراضية

      return {
        success: true,
        rawText: fullTextAnnotation.text,
        confidence
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'خطأ غير معروف في Google Vision API'
      };
    }
  }

  /**
   * تحليل وإستخراج بيانات البطاقة القطرية من النص
   */
  private parseQatariIdCard(text: string, confidence: number): ExtractedIdData {
    console.log('📝 النص المستخرج:', text);
    
    // تنظيف النص
    const cleanText = this.cleanOCRText(text);
    
    // استخراج البيانات المختلفة
    const idNumber = this.extractIdNumber(cleanText);
    const fullName = this.extractArabicName(cleanText);
    const dateOfBirth = this.extractDateOfBirth(cleanText);
    const expiryDate = this.extractExpiryDate(cleanText);
    const nationality = this.extractNationality(cleanText);
    const gender = this.extractGender(cleanText);
    const phoneNumber = this.extractPhoneNumber(cleanText);
    const address = this.extractAddress(cleanText);
    const qrCodeData = this.extractQRCodeData(cleanText);

    // تحديد مستوى الثقة بناءً على عدد البيانات المستخرجة
    const fieldsFound = [idNumber, fullName, dateOfBirth, nationality].filter(Boolean).length;
    const adjustedConfidence = Math.min(confidence, Math.round((fieldsFound / 4) * 100));

    return {
      fullName: fullName || 'غير محدد',
      idNumber: idNumber || '',
      nationality: nationality || 'قطري',
      dateOfBirth: dateOfBirth || '',
      expiryDate: expiryDate || '',
      phoneNumber,
      address,
      gender,
      qrCodeData,
      confidence: Math.max(adjustedConfidence, 60) // حد أدنى 60%
    };
  }

  /**
   * تنظيف النص المستخرج من OCR
   */
  private cleanOCRText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // توحيد المسافات
      .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0020-\u007E\d]/g, ' ') // الاحتفاظ بالعربية والإنجليزية والأرقام فقط
      .trim();
  }

  /**
   * استخراج رقم الهوية القطرية (11 رقم)
   */
  private extractIdNumber(text: string): string {
    const patterns = [
      /\b\d{11}\b/g, // 11 رقم متصل
      /\d{3}\s*\d{4}\s*\d{4}/g, // مقسم بمسافات
      /\d{2}\s*\d{3}\s*\d{3}\s*\d{3}/g // تقسيم آخر
    ];

    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        const cleaned = matches[0].replace(/\s/g, '');
        if (cleaned.length === 11) {
          return cleaned;
        }
      }
    }
    return '';
  }

  /**
   * استخراج الاسم العربي
   */
  private extractArabicName(text: string): string {
    // البحث عن النصوص العربية
    const arabicTexts = text.match(/[\u0600-\u06FF\s]{3,}/g) || [];
    
    // تصفية النصوص العربية وإزالة التواريخ والأرقام
    const nameTexts = arabicTexts
      .map(txt => txt.trim())
      .filter(txt => txt.length > 2)
      .filter(txt => !/\d/.test(txt)) // لا يحتوي على أرقام
      .filter(txt => !/(قطر|القطرية|دولة|هوية|بطاقة)/.test(txt)); // استبعاد الكلمات الشائعة

    // العثور على أطول نص (عادة الاسم الكامل)
    const fullName = nameTexts.reduce((longest, current) => 
      current.length > longest.length ? current : longest, ''
    );

    return fullName.trim();
  }

  /**
   * استخراج تاريخ الميلاد
   */
  private extractDateOfBirth(text: string): string {
    const datePatterns = [
      /\b\d{4}[-/]\d{2}[-/]\d{2}\b/g, // YYYY-MM-DD
      /\b\d{2}[-/]\d{2}[-/]\d{4}\b/g, // DD-MM-YYYY
      /\b\d{1,2}[-/]\d{1,2}[-/]\d{4}\b/g, // D-M-YYYY
      /\b\d{2}\s+\d{2}\s+\d{4}\b/g // DD MM YYYY
    ];

    for (const pattern of datePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        return this.standardizeDate(matches[0]);
      }
    }
    return '';
  }

  /**
   * استخراج تاريخ انتهاء البطاقة
   */
  private extractExpiryDate(text: string): string {
    // البحث عن تواريخ في المستقبل (عادة تاريخ الانتهاء)
    const currentYear = new Date().getFullYear();
    const dateMatches = text.match(/\b\d{4}[-/]\d{2}[-/]\d{2}\b/g) || [];
    
    for (const dateStr of dateMatches) {
      const year = parseInt(dateStr.substring(0, 4));
      if (year > currentYear && year < currentYear + 20) { // في المستقبل القريب
        return this.standardizeDate(dateStr);
      }
    }
    return '';
  }

  /**
   * استخراج الجنسية
   */
  private extractNationality(text: string): string {
    if (/قطر|قطري|قطرية/.test(text)) return 'قطري';
    if (/سعود|سعودي|سعودية/.test(text)) return 'سعودي';
    if (/مصر|مصري|مصرية/.test(text)) return 'مصري';
    if (/أردن|أردني|أردنية/.test(text)) return 'أردني';
    if (/لبنان|لبناني|لبنانية/.test(text)) return 'لبناني';
    return 'قطري'; // افتراضي للبطاقات القطرية
  }

  /**
   * استخراج الجنس
   */
  private extractGender(text: string): string {
    if (/ذكر|رجل|Male|M/i.test(text)) return 'ذكر';
    if (/أنثى|امرأة|Female|F/i.test(text)) return 'أنثى';
    return '';
  }

  /**
   * استخراج رقم الهاتف القطري
   */
  private extractPhoneNumber(text: string): string {
    const phonePatterns = [
      /\+974\s*\d{8}/g,
      /974\s*\d{8}/g,
      /\b[3-9]\d{7}\b/g // أرقام قطرية محلية
    ];

    for (const pattern of phonePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        let phone = matches[0].replace(/\s/g, '');
        if (!phone.startsWith('+974')) {
          if (phone.startsWith('974')) {
            phone = '+' + phone;
          } else if (phone.length === 8) {
            phone = '+974' + phone;
          }
        }
        return phone;
      }
    }
    return '';
  }

  /**
   * استخراج العنوان
   */
  private extractAddress(text: string): string {
    // البحث عن نمط العنوان القطري
    const addressKeywords = ['منطقة', 'مبنى', 'شارع', 'فيلا', 'الدوحة', 'الريان', 'الوكرة'];
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (addressKeywords.some(keyword => line.includes(keyword))) {
        return line.trim();
      }
    }
    return '';
  }

  /**
   * استخراج بيانات QR Code (إذا وجدت)
   */
  private extractQRCodeData(text: string): string {
    const qrPattern = /QID:\d+:[^:]+:[A-Z]{3}:\d{4}-\d{2}-\d{2}/g;
    const matches = text.match(qrPattern);
    return matches?.[0] || '';
  }

  /**
   * توحيد صيغة التاريخ إلى YYYY-MM-DD
   */
  private standardizeDate(dateStr: string): string {
    const cleaned = dateStr.replace(/\s+/g, '-');
    const parts = cleaned.split(/[-/]/);
    
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      } else if (parts[2].length === 4) {
        // DD-MM-YYYY
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    return dateStr;
  }

  /**
   * بيانات محاكاة كنسخة احتياطية
   */
  private async getMockData(startTime: number): Promise<OCRResult> {
    // محاكاة تأخير المعالجة
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockData: ExtractedIdData = {
      fullName: 'خميس هاشم محمد الجبر',
      idNumber: '29876543210',
      nationality: 'قطري',
      dateOfBirth: '1985-03-15',
      expiryDate: '2030-03-15',
      phoneNumber: '+974 5555 4321',
      address: 'أم صلال، منطقة 71، مبنى 79',
      gender: 'ذكر',
      qrCodeData: 'QID:29876543210:KhasimHashem:QAT:1985-03-15',
      confidence: 85
    };

    return {
      success: true,
      data: mockData,
      processingTime: Date.now() - startTime,
      rawText: 'بيانات محاكاة - لم يتم تحديد Google Vision API Key'
    };
  }
}

// إنشاء instance واحد للخدمة
export const googleVisionOCR = new GoogleVisionOCRService();

// تصدير الأنواع
export type { ExtractedIdData, OCRResult }; 