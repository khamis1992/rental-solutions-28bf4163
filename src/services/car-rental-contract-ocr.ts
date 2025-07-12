// Car Rental Contract OCR Service - Edge Functions Integration
// نظام استخراج متطور باستخدام Edge Functions للتحليل الذكي للعقود

export interface ContractCustomerData {
  fullName: string;
  nationality: string;
  qidNumber: string;
  licenseNumber: string;
  address: string;
  phoneNumber: string;
}

export interface ContractVehicleData {
  brand: string;
  registrationNumber: string;
  chassisNumber: string;
  manufacturingYear: string;
  model?: string;
  color?: string;
}

export interface ContractDetailsData {
  startDate: string;
  monthlyRent?: number;
  contractDuration?: number;
  contractNumber?: string;
  depositAmount?: number;
}

export interface CarRentalContractData {
  customer: ContractCustomerData;
  vehicle: ContractVehicleData;
  contract: ContractDetailsData;
  rawText: string;
}

export interface ContractOcrResult {
  success: boolean;
  data?: CarRentalContractData;
  error?: string;
  confidence?: number;
  rawText?: string;
  debugInfo?: {
    extractionMethod: string;
    processedText: string;
    foundPatterns: string[];
    validationResults: Record<string, boolean>;
    advancedAnalysis: {
      textProcessingSteps: string[];
      patternMatching: string[];
      contextualInference: string[];
      finalCorrections: string[];
      confidenceLevel: number;
    };
    diagnostics?: {
      issue: string;
      severity: 'low' | 'medium' | 'high';
      suggestion: string;
      technicalDetails: string;
    };
    ocrDiagnostics?: {
      issue: string;
      severity: 'low' | 'medium' | 'high';
      suggestion: string;
      technicalDetails: string;
    };
    warningMessage?: string;
  };
}

class CarRentalContractOcrService {
  constructor() {
    // Services are now handled through Supabase Edge Functions
  }

  /**
   * استخراج بيانات العقد باستخدام Edge Functions
   */
  async extractContractFromImage(imageBase64: string): Promise<ContractOcrResult> {
    try {
      console.log('🚀 بدء استخراج البيانات من العقد باستخدام Edge Functions...');
      
      let extractedText: string;
      let diagnostics: any = null;
      
      // التحقق إذا كان النص مباشر أم صورة
      if (imageBase64.length > 500 && !imageBase64.includes('data:image') && !imageBase64.match(/^[A-Za-z0-9+/]*={0,2}$/)) {
        // نص مباشر للاختبار
        console.log('📝 استخدام النص المباشر للاختبار...');
        extractedText = imageBase64;
      } else {
        // الخطوة 1: استخراج النص باستخدام Google Vision Edge Function
        console.log('🖼️ استخراج النص من الصورة باستخدام Edge Function...');
        const visionResult = await this.extractTextWithGoogleVision(imageBase64);
        
        if (!visionResult.success || !visionResult.text) {
          // إذا فشل OCR، إرجاع خطأ واضح
          console.error('❌ فشل في استخراج النص من الصورة');
          
          return {
            success: false,
            data: this.createEmptyFormData(),
            error: `فشل في قراءة العقد: ${visionResult.diagnostics?.suggestion || 'يرجى إدخال البيانات يدوياً'}`,
            confidence: 0,
            rawText: '',
            debugInfo: {
              extractionMethod: 'manual_entry_required',
              processedText: '',
              foundPatterns: [],
              validationResults: {},
              advancedAnalysis: {
                textProcessingSteps: ['فشل في استخراج النص من الصورة'],
                patternMatching: [],
                contextualInference: [],
                finalCorrections: [],
                confidenceLevel: 0
              },
              diagnostics: visionResult.diagnostics,
              warningMessage: `${visionResult.diagnostics?.issue || 'فشل في قراءة العقد'} - ${visionResult.diagnostics?.suggestion || 'يرجى إدخال البيانات يدوياً'}`
            }
          };
        }
        
        extractedText = visionResult.text;
        diagnostics = visionResult.diagnostics;
      }

      console.log('✅ تم الحصول على النص بنجاح');
      
      // الخطوة 2: تحليل النص باستخدام OpenAI Edge Function
      const result = await this.analyzeTextWithOpenAI(extractedText);
      
      // إضافة معلومات التشخيص إذا كانت متوفرة
      if (diagnostics && result.debugInfo) {
        result.debugInfo.ocrDiagnostics = diagnostics;
      }
      
      return result;

    } catch (error) {
      console.error('❌ فشل في الاستخراج:', error);
      
      // في حالة الخطأ، إرجاع نموذج فارغ مع تشخيص الخطأ
      const diagnostics = await this.diagnoseOcrFailure(imageBase64, error);
      
      return {
        success: false,
        data: this.createEmptyFormData(),
        error: `خطأ في معالجة العقد: ${diagnostics.suggestion}`,
        confidence: 0,
        rawText: '',
        debugInfo: {
          extractionMethod: 'manual_entry_required',
          processedText: '',
          foundPatterns: [],
          validationResults: {},
          advancedAnalysis: {
            textProcessingSteps: ['فشل في معالجة العقد'],
            patternMatching: [],
            contextualInference: [],
            finalCorrections: [],
            confidenceLevel: 0
          },
          diagnostics,
          warningMessage: `${diagnostics.issue} - ${diagnostics.suggestion}`
        }
      };
    }
  }

  /**
   * استخراج النص من الصورة باستخدام Google Vision Edge Function
   */
  private async extractTextWithGoogleVision(imageBase64: string): Promise<{ success: boolean; text: string | null; diagnostics?: any }> {
    try {
      console.log('📄 استخدام Google Vision Edge Function لاستخراج النص...');
      
      // Import Supabase client dynamically
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Ensure image is properly formatted
      let cleanImageData = imageBase64;
      if (!imageBase64.startsWith('data:image/')) {
        cleanImageData = `data:image/jpeg;base64,${imageBase64}`;
      }
      
      // Call our Edge Function with improved error handling
      const { data, error } = await supabase.functions.invoke('process-google-vision', {
        body: {
          imageBase64: cleanImageData,
          maxResults: 1,
          languageHints: ['ar', 'en']
        }
      });

      if (error) {
        console.error('❌ Google Vision Edge Function error:', error);
        const diagnostics = await this.diagnoseOcrFailure(imageBase64, error);
        return { success: false, text: null, diagnostics };
      }

      if (!data || !data.success) {
        console.warn('⚠️ Google Vision processing failed:', data?.error);
        const diagnostics = await this.diagnoseOcrFailure(imageBase64, data?.error);
        return { success: false, text: null, diagnostics };
      }

      const extractedText = data.data?.text || '';
      console.log('📄 تم استخراج النص بنجاح، الطول:', extractedText.length);
      
      // Improved text quality check
      if (extractedText.length < 20) {
        console.warn('⚠️ النص المستخرج قصير جداً أو فارغ');
        const diagnostics = {
          issue: 'لم يتم العثور على نص كافِ في الصورة',
          severity: 'medium' as const,
          suggestion: 'يرجى التأكد من وضوح النص في الصورة والإضاءة الجيدة',
          technicalDetails: `Extracted text length: ${extractedText.length} characters`
        };
        return { success: false, text: extractedText, diagnostics };
      }
      
      return { success: true, text: extractedText };
    } catch (error) {
      console.error('❌ فشل في استخراج النص:', error);
      const diagnostics = await this.diagnoseOcrFailure(imageBase64, error);
      return { success: false, text: null, diagnostics };
    }
  }

  /**
   * تحليل النص باستخدام OpenAI Edge Function
   */
  private async analyzeTextWithOpenAI(contractText: string): Promise<ContractOcrResult> {
    try {
      console.log('🔍 استخدام OpenAI Edge Function للتحليل...');
      
      // Import OpenAI service
      const { openAIService } = await import('@/services/openai-service');
      
      // Use OpenAI service which handles Edge Functions
      const result = await openAIService.analyzeContract(contractText);
      
      if (!result.success) {
        console.warn('⚠️ OpenAI analysis failed:', result.error);
        console.warn('🔄 التبديل للتحليل التقليدي المحسن...');
        return this.performTraditionalAnalysis(contractText);
      }

      console.log('✅ تم التحليل بنجاح بواسطة OpenAI');
      
      try {
        // Improved JSON parsing with better error handling
        let extractedData;
        const responseText = result.data?.text || '{}';
        
        // Clean up common JSON formatting issues
        const cleanedResponse = responseText
          .replace(/```json\s*/g, '')
          .replace(/```\s*/g, '')
          .replace(/^\s*[\r\n]+/gm, '')
          .trim();
        
        console.log('🧹 Cleaned OpenAI response:', cleanedResponse.substring(0, 200));
        
        try {
          extractedData = JSON.parse(cleanedResponse);
        } catch (firstParseError) {
          console.warn('⚠️ First JSON parse failed, trying to extract JSON from text...');
          
          // Try to extract JSON from the response text
          const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            extractedData = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No valid JSON found in response');
          }
        }
        
        const confidence = this.calculateAIConfidence(extractedData);

        const debugInfo = {
          extractionMethod: 'openai_edge_function',
          processedText: contractText.substring(0, 500),
          foundPatterns: ['ai_pattern_recognition'],
          validationResults: this.validateExtractedData(extractedData),
          advancedAnalysis: {
            textProcessingSteps: [
              'استخراج النص بـ Google Vision OCR',
              'تحليل النص بالذكاء الاصطناعي OpenAI',
              'استخراج البيانات الذكي',
              'التحقق من صحة البيانات',
              'تصحيح الأخطاء تلقائياً'
            ],
            patternMatching: ['ai_pattern_recognition'],
            contextualInference: ['تحليل ذكي بـ OpenAI'],
            finalCorrections: ['تصحيح تلقائي بواسطة AI'],
            confidenceLevel: confidence
          }
        };

        return {
          success: true,
          data: this.mapAIDataToContract(extractedData),
          confidence,
          rawText: contractText,
          debugInfo
        };
      } catch (parseError) {
        console.warn('⚠️ فشل في تحليل استجابة OpenAI:', parseError);
        console.warn('📝 Raw response:', result.data?.text?.substring(0, 300));
        return this.performTraditionalAnalysis(contractText);
      }

    } catch (error) {
      console.error('❌ فشل في تحليل OpenAI:', error);
      console.warn('🔄 التبديل للتحليل التقليدي المحسن...');
      return this.performTraditionalAnalysis(contractText);
    }
  }

  /**
   * نظام تشخيص محسن لتحديد سبب فشل OCR
   */
  private async diagnoseOcrFailure(imageBase64: string, error?: any): Promise<{
    issue: string;
    severity: 'low' | 'medium' | 'high';
    suggestion: string;
    technicalDetails: string;
  }> {
    try {
      // فحص نوع الملف وجودته
      if (!imageBase64 || imageBase64.length < 100) {
        return {
          issue: 'الملف فارغ أو تالف',
          severity: 'high',
          suggestion: 'يرجى إعادة رفع ملف صحيح أو التقاط صورة جديدة',
          technicalDetails: 'File is empty or corrupted'
        };
      }

      // فحص نوع البيانات
      if (!imageBase64.startsWith('data:image/') && !imageBase64.match(/^[A-Za-z0-9+/]*={0,2}$/)) {
        return {
          issue: 'نوع الملف غير مدعوم',
          severity: 'high',
          suggestion: 'يرجى استخدام ملفات الصور (PNG, JPG) أو PDF فقط',
          technicalDetails: 'Unsupported file format'
        };
      }

      // فحص حجم الملف
      const sizeInBytes = Math.ceil(imageBase64.length * 0.75);
      if (sizeInBytes > 10 * 1024 * 1024) { // 10MB
        return {
          issue: 'حجم الملف كبير جداً',
          severity: 'medium',
          suggestion: 'يرجى تقليل حجم الصورة أو جودتها',
          technicalDetails: `File size: ${Math.round(sizeInBytes / 1024 / 1024)}MB`
        };
      }

      // فحص الاتصال بالإنترنت
      if (error && error.message && error.message.includes('network')) {
        return {
          issue: 'مشكلة في الاتصال بالإنترنت',
          severity: 'high',
          suggestion: 'يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى',
          technicalDetails: 'Network connectivity issue'
        };
      }

      // فحص عام للأخطاء
      if (error) {
        return {
          issue: 'خطأ في معالجة الصورة',
          severity: 'medium',
          suggestion: 'يرجى المحاولة مرة أخرى أو إدخال البيانات يدوياً',
          technicalDetails: error.message || 'Unknown processing error'
        };
      }

      return {
        issue: 'لم يتم العثور على نص واضح في الصورة',
        severity: 'medium',
        suggestion: 'يرجى التأكد من وضوح النص في الصورة أو إدخال البيانات يدوياً',
        technicalDetails: 'No clear text detected in image'
      };
    } catch (diagError) {
      return {
        issue: 'خطأ في التشخيص',
        severity: 'low',
        suggestion: 'يرجى المحاولة مرة أخرى',
        technicalDetails: `Diagnostic error: ${diagError}`
      };
    }
  }

  /**
   * إنشاء نموذج فارغ للملء اليدوي
   */
  private createEmptyFormData(): CarRentalContractData {
    return {
      customer: {
        fullName: '',
        nationality: '',
        qidNumber: '',
        licenseNumber: '',
        address: 'الدوحة',
        phoneNumber: ''
      },
      vehicle: {
        brand: '',
        registrationNumber: '',
        chassisNumber: '',
        manufacturingYear: '',
        model: '',
        color: ''
      },
      contract: {
        startDate: '',
        monthlyRent: 0,
        contractDuration: 12,
        contractNumber: '',
        depositAmount: 0
      },
      rawText: ''
    };
  }

  /**
   * التحليل التقليدي المحسن كبديل للـ AI
   */
  private performTraditionalAnalysis(contractText: string): ContractOcrResult {
    console.log('🔧 استخدام التحليل التقليدي المحسن...');
    
    try {
      const extractedData = this.extractWithPatternsEnhanced(contractText);
      const confidence = this.calculateTraditionalConfidence(extractedData, contractText);
      
      return {
        success: true,
        data: extractedData,
        confidence,
        rawText: contractText,
        debugInfo: {
          extractionMethod: 'enhanced_traditional_pattern_matching',
          processedText: contractText.substring(0, 500),
          foundPatterns: this.getFoundPatterns(contractText),
          validationResults: this.validateExtractedData(extractedData),
          advancedAnalysis: {
            textProcessingSteps: [
              'تنظيف النص وإزالة الرموز الخاصة',
              'البحث عن الأنماط المحسنة',
              'استخراج البيانات متعدد المراحل',
              'التحقق من صحة البيانات',
              'تصحيح الأخطاء والتنسيق'
            ],
            patternMatching: this.getFoundPatterns(contractText),
            contextualInference: ['استنتاج محسن بناءً على السياق', 'تحليل موضعي للبيانات'],
            finalCorrections: ['تصحيح تلقائي للأرقام والهويات', 'تنسيق التواريخ'],
            confidenceLevel: confidence
          }
        }
      };
    } catch (error) {
      console.error('❌ فشل في التحليل التقليدي:', error);
      return {
        success: false,
        data: this.createEmptyFormData(),
        error: 'فشل في تحليل النص - يرجى إدخال البيانات يدوياً',
        confidence: 0,
        rawText: contractText
      };
    }
  }

  // Enhanced helper methods for traditional analysis
  private extractWithPatternsEnhanced(text: string): CarRentalContractData {
    const data = this.createEmptyFormData();
    const cleanText = this.cleanTextForExtraction(text);
    
    // Enhanced customer name extraction
    const namePatterns = [
      /(?:الاسم|Name|Customer|العميل)[:\s]*([^\n\r]+)/gi,
      /([أ-ي\s]{10,50})/g, // Arabic names
      /([A-Za-z]{2,}\s+[A-Za-z]{2,}(?:\s+[A-Za-z]{2,})*)/g // English names
    ];
    
    for (const pattern of namePatterns) {
      const matches = cleanText.match(pattern);
      if (matches && matches[0] && !data.customer.fullName) {
        const name = matches[0].replace(/(?:الاسم|Name|Customer|العميل)[:\s]*/gi, '').trim();
        if (name.length > 3 && name.length < 50) {
          data.customer.fullName = name;
          break;
        }
      }
    }
    
    // Enhanced QID extraction (11 digits)
    const qidPatterns = [
      /\b(\d{11})\b/g,
      /(?:القطرية|QID|الهوية)[:\s]*(\d{11})/gi
    ];
    
    for (const pattern of qidPatterns) {
      const match = cleanText.match(pattern);
      if (match && match[1] && match[1].length === 11) {
        data.customer.qidNumber = match[1];
        break;
      }
    }
    
    // Enhanced phone extraction (8 digits starting with 3,5,6,7,9)
    const phonePatterns = [
      /\b([35679]\d{7})\b/g,
      /(?:هاتف|Phone|Mobile|جوال)[:\s]*([35679]\d{7})/gi
    ];
    
    for (const pattern of phonePatterns) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        data.customer.phoneNumber = match[1];
        break;
      }
    }
    
    // Enhanced vehicle registration extraction
    const regPatterns = [
      /\b(\d{5,6})\b/g,
      /(?:اللوحة|رقم|Registration|Plate)[:\s]*(\d{5,6})/gi
    ];
    
    for (const pattern of regPatterns) {
      const match = cleanText.match(pattern);
      if (match && match[1] && match[1].length >= 5 && match[1].length <= 6) {
        data.vehicle.registrationNumber = match[1];
        break;
      }
    }
    
    // Enhanced rent extraction
    const rentPatterns = [
      /(\d{1,5})\s*(?:ريال|QAR|Riyal)/gi,
      /(?:إيجار|Rent|شهري)[:\s]*(\d{1,5})/gi
    ];
    
    for (const pattern of rentPatterns) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        const amount = parseInt(match[1]);
        if (amount >= 500 && amount <= 50000) { // Reasonable rent range
          data.contract.monthlyRent = amount;
          break;
        }
      }
    }
    
    // Extract vehicle brand/make
    const brandPatterns = [
      /(?:تويوتا|Toyota|نيسان|Nissan|مرسيدس|Mercedes|BMW|هوندا|Honda|هيونداي|Hyundai|كيا|KIA|فورد|Ford)/gi
    ];
    
    for (const pattern of brandPatterns) {
      const match = cleanText.match(pattern);
      if (match && match[0] && !data.vehicle.brand) {
        data.vehicle.brand = match[0].trim();
        break;
      }
    }
    
    // Extract dates
    const datePatterns = [
      /(\d{1,2}[-/]\d{1,2}[-/]\d{4})/g,
      /(\d{4}[-/]\d{1,2}[-/]\d{1,2})/g
    ];
    
    for (const pattern of datePatterns) {
      const match = cleanText.match(pattern);
      if (match && match[0] && !data.contract.startDate) {
        data.contract.startDate = this.formatDate(match[0]);
        break;
      }
    }
    
    data.rawText = text;
    return data;
  }
  
  private cleanTextForExtraction(text: string): string {
    return text
      .replace(/[\r\n]+/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-zA-Z0-9\s\-\/]/g, ' ')
      .trim();
  }
  
  private formatDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (e) {
      // Try different date formats
      const parts = dateStr.split(/[-\/]/);
      if (parts.length === 3) {
        // Try YYYY-MM-DD format
        if (parts[0].length === 4) {
          return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        }
        // Try DD/MM/YYYY format
        if (parts[2].length === 4) {
          return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
    }
    return dateStr;
  }

  private calculateTraditionalConfidence(data: CarRentalContractData, text: string): number {
    let score = 0;
    let maxScore = 0;
    
    // Check each field
    const fields = [
      data.customer.fullName,
      data.customer.qidNumber,
      data.customer.phoneNumber,
      data.vehicle.registrationNumber,
      data.contract.monthlyRent?.toString()
    ];
    
    fields.forEach(field => {
      maxScore += 20;
      if (field && field.length > 0) score += 20;
    });
    
    return Math.min(100, Math.round((score / maxScore) * 100));
  }

  private calculateAIConfidence(data: any): number {
    // Simple confidence calculation based on filled fields
    let filledFields = 0;
    let totalFields = 0;
    
    const checkObject = (obj: any) => {
      Object.values(obj).forEach(value => {
        totalFields++;
        if (value && value !== '' && value !== 0) filledFields++;
      });
    };
    
    if (data.customer) checkObject(data.customer);
    if (data.vehicle) checkObject(data.vehicle);
    if (data.contract) checkObject(data.contract);
    
    return totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
  }

  private getFoundPatterns(text: string): string[] {
    const patterns = [];
    if (text.match(/\d{11}/)) patterns.push('QID_pattern');
    if (text.match(/\d{8}/)) patterns.push('phone_pattern');
    if (text.match(/\d{5,6}/)) patterns.push('registration_pattern');
    if (text.match(/\d+\s*ريال/i)) patterns.push('amount_arabic');
    if (text.match(/\d+\s*QAR/i)) patterns.push('amount_english');
    return patterns;
  }

  private validateExtractedData(data: CarRentalContractData): Record<string, boolean> {
    return {
      hasCustomerName: !!data.customer.fullName,
      hasQID: !!data.customer.qidNumber && data.customer.qidNumber.length === 11,
      hasPhone: !!data.customer.phoneNumber && data.customer.phoneNumber.length === 8,
      hasVehicleReg: !!data.vehicle.registrationNumber,
      hasRentAmount: !!data.contract.monthlyRent && data.contract.monthlyRent > 0
    };
  }

  private mapAIDataToContract(aiData: any): CarRentalContractData {
    return {
      customer: {
        fullName: aiData.customerName || '',
        nationality: aiData.nationality || '',
        qidNumber: aiData.idNumber || '',
        licenseNumber: aiData.licenseNumber || '',
        address: aiData.address || 'الدوحة',
        phoneNumber: aiData.phoneNumber || ''
      },
      vehicle: {
        brand: aiData.vehicleBrand || '',
        registrationNumber: aiData.registrationNumber || '',
        chassisNumber: aiData.chassisNumber || '',
        manufacturingYear: aiData.manufacturingYear || '',
        model: aiData.vehicleModel || '',
        color: aiData.vehicleColor || ''
      },
      contract: {
        startDate: aiData.startDate || '',
        monthlyRent: aiData.rentAmount || 0,
        contractDuration: aiData.contractDuration || 12,
        contractNumber: aiData.contractNumber || '',
        depositAmount: aiData.depositAmount || 0
      },
      rawText: aiData.rawText || ''
    };
  }
}

// Export singleton instance
export const carRentalContractOcrService = new CarRentalContractOcrService();
export default carRentalContractOcrService;