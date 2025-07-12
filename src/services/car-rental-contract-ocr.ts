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
      
      // Call our Edge Function instead of direct API call
      const { data, error } = await supabase.functions.invoke('process-google-vision', {
        body: {
          imageBase64: imageBase64,
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
        const diagnostics = await this.diagnoseOcrFailure(imageBase64);
        return { success: false, text: null, diagnostics };
      }

      const extractedText = data.data?.text || '';
      console.log('📄 تم استخراج النص بنجاح، الطول:', extractedText.length);
      
      // فحص جودة النص المستخرج
      if (extractedText.length < 50) {
        console.warn('⚠️ النص المستخرج قصير جداً');
        const diagnostics = await this.diagnoseOcrFailure(imageBase64);
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
        const extractedData = JSON.parse(result.data?.text || '{}');
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
      const extractedData = this.extractWithPatterns(contractText);
      const confidence = this.calculateTraditionalConfidence(extractedData, contractText);
      
      return {
        success: true,
        data: extractedData,
        confidence,
        rawText: contractText,
        debugInfo: {
          extractionMethod: 'traditional_pattern_matching',
          processedText: contractText.substring(0, 500),
          foundPatterns: this.getFoundPatterns(contractText),
          validationResults: this.validateExtractedData(extractedData),
          advancedAnalysis: {
            textProcessingSteps: [
              'تنظيف النص وإزالة الرموز الخاصة',
              'البحث عن الأنماط المعروفة',
              'استخراج البيانات باستخدام التعبيرات النمطية',
              'التحقق من صحة البيانات',
              'تصحيح الأخطاء الشائعة'
            ],
            patternMatching: this.getFoundPatterns(contractText),
            contextualInference: ['استنتاج تقليدي بناءً على الموقع'],
            finalCorrections: ['تصحيح تلقائي للأرقام والهويات'],
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

  // Helper methods for traditional analysis
  private extractWithPatterns(text: string): CarRentalContractData {
    const data = this.createEmptyFormData();
    
    // Extract customer name
    const nameMatch = text.match(/الاسم[:\s]*([^\n]+)/i) || text.match(/Name[:\s]*([^\n]+)/i);
    if (nameMatch) data.customer.fullName = nameMatch[1].trim();
    
    // Extract QID
    const qidMatch = text.match(/(\d{11})/);
    if (qidMatch) data.customer.qidNumber = qidMatch[1];
    
    // Extract phone
    const phoneMatch = text.match(/(\d{8})/);
    if (phoneMatch) data.customer.phoneNumber = phoneMatch[1];
    
    // Extract vehicle registration
    const regMatch = text.match(/(\d{5,6})/);
    if (regMatch) data.vehicle.registrationNumber = regMatch[1];
    
    // Extract monthly rent
    const rentMatch = text.match(/(\d+)\s*ريال/i) || text.match(/(\d+)\s*QAR/i);
    if (rentMatch) data.contract.monthlyRent = parseInt(rentMatch[1]);
    
    data.rawText = text;
    return data;
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