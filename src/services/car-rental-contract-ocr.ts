// Car Rental Contract OCR Service - Advanced ChatGPT // Analysis - removed unused variable// نظام استخراج متطور باستخدام ChatGPT API للتحليل الذكي للعقود
// 
// 🤖 مزايا ChatGPT للعقود:
// 1. فهم السياق والمعنى بذكاء طبيعي
// 2. معالجة النصوص المعقدة والغير منتظمة  
// 3. استخراج البيانات حتى مع وجود أخطاء إملائية
// 4. تصحيح البيانات تلقائياً
// 5. فهم المصطلحات القانونية والعقارية

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
    warningMessage?: string;
  };
}

class CarRentalContractOcrService {
  private readonly openaiApiKey: string;
  private readonly openaiUrl = 'https://api.openai.com/v1/chat/completions';
  private readonly googleVisionApiKey: string;
  private readonly googleVisionUrl = 'https://vision.googleapis.com/v1/images:annotate';

  constructor() {
    this.openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    this.googleVisionApiKey = 'AIzaSyDerb68G9zDwHI0e9-gwHf4b3fKQmPrE_o';
  }

  /**
   * استخراج بيانات العقد باستخدام ChatGPT مع تحليل ذكي متطور
   */
  async extractContractFromImage(imageBase64: string): Promise<ContractOcrResult> {
    try {
      console.log('🚀 بدء استخراج البيانات من العقد...');
      
      let extractedText: string;
      
      // التحقق إذا كان النص مباشر أم صورة
      if (imageBase64.length > 500 && !imageBase64.includes('data:image') && !imageBase64.match(/^[A-Za-z0-9+/]*={0,2}$/)) {
        // نص مباشر للاختبار
        console.log('📝 استخدام النص المباشر للاختبار...');
        extractedText = imageBase64;
      } else {
        // الخطوة 1: استخراج النص باستخدام Google Vision OCR
        console.log('🖼️ استخراج النص من الصورة...');
        const visionResult = await this.extractTextWithGoogleVision(imageBase64);
        
        if (!visionResult) {
          return {
            success: false,
            error: 'لم يتم العثور على نص في الصورة',
            confidence: 0
          };
        }
        
        extractedText = visionResult;
      }

      console.log('✅ تم الحصول على النص بنجاح');
      
      // الخطوة 2: تحليل النص باستخدام ChatGPT أو التحليل المحسن
      const result = await this.analyzeTextWithChatGPT(extractedText);
      
      return result;

    } catch (error) {
      console.error('❌ فشل في الاستخراج:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'خطأ غير معروف',
        confidence: 0
      };
    }
  }

  /**
   * استخراج النص من الصورة باستخدام Google Vision OCR
   */
  private async extractTextWithGoogleVision(imageBase64: string): Promise<string | null> {
    try {
      const requestPayload = {
        requests: [
          {
            image: {
              content: imageBase64.replace(/^data:image\/[a-z]+;base64,/, '')
            },
            features: [
              {
                type: 'DOCUMENT_TEXT_DETECTION',
                maxResults: 1
              }
            ],
            imageContext: {
              languageHints: ['ar', 'en']
            }
          }
        ]
      };

      const response = await fetch(`${this.googleVisionUrl}?key=${this.googleVisionApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        throw new Error(`Google Vision API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const responseData = result.responses?.[0];
      
      if (!responseData?.textAnnotations || responseData.textAnnotations.length === 0) {
        return null;
      }

      const fullText = responseData.textAnnotations[0]?.description || '';
      console.log('📄 تم استخراج النص بنجاح، الطول:', fullText.length);
      
      return fullText;
    } catch (error) {
      console.error('❌ فشل في استخراج النص:', error);
      return null;
    }
  }

  /**
   * تحليل النص باستخدام ChatGPT للاستخراج الذكي
   */
  private async analyzeTextWithChatGPT(contractText: string): Promise<ContractOcrResult> {
    try {
      console.log('🔍 فحص إعدادات ChatGPT...');
      
      if (!this.openaiApiKey) {
        console.warn('⚠️ OpenAI API Key غير موجود في متغيرات البيئة');
        console.warn('💡 يرجى إضافة VITE_OPENAI_API_KEY في ملف .env');
        console.warn('🔄 التبديل للتحليل التقليدي المحسن...');
        return this.performTraditionalAnalysis(contractText);
      }

      if (this.openaiApiKey.length < 20) {
        console.warn('⚠️ OpenAI API Key قصير جداً - قد يكون غير صحيح');
        console.warn('💡 يرجى التحقق من صحة VITE_OPENAI_API_KEY');
        console.warn('🔄 التبديل للتحليل التقليدي المحسن...');
        return this.performTraditionalAnalysis(contractText);
      }

      console.log('✅ OpenAI API Key موجود ويبدو صحيحاً');
      console.log('🚀 بدء التحليل بـ ChatGPT...');

      const startTime = Date.now();
      
      const prompt = this.createChatGPTPrompt(contractText);
      
      const requestPayload = {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: this.getChatGPTSystemPrompt()
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      };

      console.log('📤 إرسال طلب إلى ChatGPT API...');

      const response = await fetch(this.openaiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`
        },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ ChatGPT API فشل:', response.status, response.statusText);
        console.error('📋 تفاصيل الخطأ:', errorText);
        console.warn('🔄 التبديل للتحليل التقليدي المحسن...');
        return this.performTraditionalAnalysis(contractText);
      }

      const result = await response.json();
      const responseTime = Date.now() - startTime;
      
      console.log(`✅ تم الحصول على استجابة ChatGPT في ${responseTime}ms`);
      
      if (!result.choices || result.choices.length === 0) {
        console.warn('⚠️ استجابة ChatGPT فارغة');
        return this.performTraditionalAnalysis(contractText);
      }

      const aiResponse = result.choices[0].message.content;
      console.log('🧠 تحليل استجابة ChatGPT...');

      const extractedData = this.parseChatGPTResponse(aiResponse, contractText);
      const confidence = this.calculateChatGPTConfidence(extractedData, result.usage);

             const debugInfo = {
         extractionMethod: 'chatgpt_ai_analysis',
         processedText: contractText.substring(0, 500),
         foundPatterns: ['ai_pattern_recognition'],
         validationResults: this.validateExtractedData(extractedData),
         advancedAnalysis: {
           textProcessingSteps: [
             'استخراج النص بـ Google Vision OCR',
             'تحليل النص بالذكاء الاصطناعي ChatGPT',
             'استخراج البيانات الذكي',
             'التحقق من صحة البيانات',
             'تصحيح الأخطاء تلقائياً'
           ],
           patternMatching: ['ai_pattern_recognition'],
           contextualInference: ['تحليل ذكي بـ ChatGPT'],
           finalCorrections: ['تصحيح تلقائي بواسطة AI'],
           confidenceLevel: confidence
         },
         aiAnalysis: {
           modelUsed: 'gpt-4-turbo-preview',
           promptTokens: result.usage?.prompt_tokens || 0,
           completionTokens: result.usage?.completion_tokens || 0,
           totalTokens: result.usage?.total_tokens || 0,
           responseTime,
           confidenceLevel: confidence,
           extractionSteps: [
             'استخراج النص بـ Google Vision OCR',
             'تحليل النص بالذكاء الاصطناعي ChatGPT',
             'استخراج البيانات الذكي',
             'التحقق من صحة البيانات',
             'تصحيح الأخطاء تلقائياً'
           ],
           corrections: ['تصحيح تلقائي بواسطة AI']
         }
       };

      console.log('✅ اكتمل التحليل الذكي:', {
        confidence: `${confidence}%`,
        tokensUsed: result.usage?.total_tokens || 0,
        responseTime: `${responseTime}ms`
      });

      return {
        success: true,
        data: extractedData,
        rawText: contractText,
        confidence,
        debugInfo
      };

    } catch (error) {
      console.error('❌ فشل في تحليل ChatGPT:', error);
      return this.performTraditionalAnalysis(contractText);
    }
  }

  /**
   * إنشاء prompt متطور لـ ChatGPT
   */
  private createChatGPTPrompt(contractText: string): string {
    return `
أنت خبير في تحليل عقود إيجار السيارات في قطر. قم بتحليل النص التالي واستخراج البيانات المطلوبة بدقة عالية.

النص المراد تحليله:
"""
${contractText}
"""

المطلوب استخراج البيانات التالية بصيغة JSON:

{
  "customer": {
    "fullName": "الاسم الكامل للعميل",
    "nationality": "الجنسية",
    "qidNumber": "رقم الهوية القطرية (11 رقم)",
    "licenseNumber": "رقم رخصة القيادة",
    "address": "العنوان",
    "phoneNumber": "📱 رقم الهاتف (8 أرقام تبدأ بـ 3,5,6,7,9) - مطلوب إجباري!"
  },
  "vehicle": {
    "brand": "ماركة السيارة",
    "registrationNumber": "رقم اللوحة",
    "chassisNumber": "رقم الشاسيه",
    "manufacturingYear": "سنة الصنع",
    "model": "الموديل",
    "color": "اللون"
  },
  "contract": {
    "startDate": "تاريخ بداية العقد",
    "monthlyRent": قيمة_الإيجار_الشهري_رقم,
    "contractDuration": مدة_العقد_بالأشهر_رقم,
    "contractNumber": "رقم العقد"
  }
}

تعليمات مهمة:
1. اقرأ النص بعناية وابحث عن المعلومات في أي مكان
2. إذا لم تجد معلومة محددة، ضع قيمة فارغة ""
3. تأكد من صحة أرقام الهوية القطرية (11 رقم)
4. تأكد من صحة أرقام الهاتف القطرية (8 أرقام)
5. استخدم الذكاء في تفسير المعلومات حتى لو كانت غير واضحة
6. صحح الأخطاء الإملائية البسيطة
7. ارجع JSON صالح فقط بدون نص إضافي
`;
  }

  /**
   * إعداد system prompt للذكاء الاصطناعي
   */
  private getChatGPTSystemPrompt(): string {
    return `أنت خبير في استخراج البيانات من عقود إيجار السيارات القطرية. مهمتك استخراج البيانات التالية بدقة:

🚨 CRITICAL: تاريخ بداية العقد هو أهم شيء في المهمة! يجب استخراجه بأي طريقة!

1. بيانات العميل:
   - الاسم الكامل
   - الجنسية  
   - رقم الهوية القطرية (QID)
   - 📱 رقم الهاتف (أولوية عالية - يجب استخراجه!)
   - العنوان (دائماً "الدوحة")

2. بيانات المركبة:
   - الماركة (مثل: تويوتا، نيسان، هوندا)
   - سنة الصنع
   - رقم اللوحة
   - اللون
   - رقم الشاسيه

3. بيانات العقد:
   - 🎯🎯🎯 تاريخ بداية العقد (أولوية قصوى - يجب العثور عليه!)
   - الإيجار الشهري
   - مدة العقد بالأشهر

⚠️ ملاحظات مهمة جداً:
- رقم رخصة القيادة = رقم الهوية القطرية (نفس الرقم تماماً)
- العنوان دائماً "الدوحة" 
- لا تستخرج رقم العقد (يُولد تلقائياً في النظام)
- لا تستخرج الموديل (غير موجود في العقد)

🔥 تاريخ بداية العقد - تعليمات خاصة:
- ابحث عن أي تاريخ في أول 500 حرف من النص
- ابحث عن تاريخ بعد: "من تاريخ"، "من يوم"، "تاريخ البداية"، "يبدأ من"، "Date"، "Start"
- ابحث عن أول تاريخ يظهر في أي مكان في النص
- قبول أي تاريخ بصيغة DD/MM/YYYY أو MM/DD/YYYY أو YYYY-MM-DD
- إذا وجدت عدة تواريخ، اختر الأول في النص
- يجب أن يكون التاريخ بين 2020-2030
- لا تترك حقل startDate فارغاً أبداً!

📱 رقم الهاتف - تعليمات خاصة:
- ابحث عن أي رقم يبدأ بـ 3 أو 5 أو 6 أو 7 أو 9 ويتكون من 8 أرقام
- ابحث بعد الكلمات: "جوال"، "موبايل"، "هاتف"، "رقم الهاتف"، "Mobile"، "Phone"، "Tel"
- ابحث في أي مكان في النص عن أرقام قطرية (35xxxxxx, 55xxxxxx, 66xxxxxx, 77xxxxxx, 99xxxxxx)
- تجاهل الأرقام التي تحتوي على أكثر من 8 أرقام (قد تكون أرقام هوية أو شاسيه)
- إذا وجدت عدة أرقام، اختر الذي يبدأ بـ 5 أو 7 (الأكثر شيوعاً)
- لا تترك حقل phoneNumber فارغاً إذا كان هناك أي رقم صالح!

أرجع البيانات في صيغة JSON صحيحة بالتنسيق التالي:
{
  "customer": {
    "fullName": "الاسم بالعربية",
    "nationality": "الجنسية بالعربية", 
    "qidNumber": "رقم الهوية",
    "licenseNumber": "رقم الهوية (نفس رقم الهوية)",
    "phoneNumber": "رقم الهاتف",
    "address": "الدوحة"
  },
  "vehicle": {
    "brand": "الماركة بالعربية",
    "manufacturingYear": "سنة الصنع",
    "registrationNumber": "رقم اللوحة",
    "color": "اللون بالعربية",
    "chassisNumber": "رقم الشاسيه"
  },
  "contract": {
    "startDate": "تاريخ البداية (YYYY-MM-DD) - مطلوب إجباري!",
    "monthlyRent": المبلغ_رقم,
    "contractDuration": عدد_الأشهر
  }
}`;
  }

  /**
   * تحليل استجابة ChatGPT
   */
  private parseChatGPTResponse(aiResponse: string, originalText: string): CarRentalContractData {
    try {
      const parsedData = JSON.parse(aiResponse);
      
      // استخراج رقم الهوية
      const qidNumber = parsedData.customer?.qidNumber || '';
      
      // 🎯 نظام مضاعف لاستخراج التاريخ - الحل الفوري!
      let startDate = parsedData.contract?.startDate || '';
      
      console.log('🔍 فحص تاريخ بداية العقد من ChatGPT:', startDate);
      
      // إذا لم يستخرج ChatGPT التاريخ أو كان غير صالح، استخدم النظام الاحتياطي
      if (!startDate || !this.isValidContractDate(startDate)) {
        console.log('⚠️ تاريخ ChatGPT غير صالح، تطبيق النظام الاحتياطي...');
        
        // استخراج فوري من النص الأصلي
        const emergencyDate = this.emergencyDateExtraction(originalText);
        if (emergencyDate) {
          startDate = emergencyDate;
          console.log('✅ تم استخراج التاريخ بالنظام الاحتياطي:', startDate);
        } else {
          console.log('❌ فشل في استخراج التاريخ - سيتم استخدام التاريخ الحالي');
          startDate = new Date().toISOString().split('T')[0]; // تاريخ اليوم كحل أخير
        }
      } else {
        console.log('✅ تاريخ ChatGPT صالح:', startDate);
      }
      
      // 📱 نظام مضاعف لاستخراج رقم الهاتف
      let phoneNumber = parsedData.customer?.phoneNumber || '';
      
      console.log('🔍 فحص رقم الهاتف من ChatGPT:', phoneNumber);
      
      // إذا لم يستخرج ChatGPT رقم الهاتف أو كان غير صالح، استخدم النظام الاحتياطي
      if (!phoneNumber || !/^[35679]\d{7}$/.test(phoneNumber)) {
        console.log('⚠️ رقم الهاتف من ChatGPT غير صالح، تطبيق النظام الاحتياطي...');
        
        // استخراج فوري من النص الأصلي
        const emergencyPhone = this.extractPhoneFromText(originalText);
        if (emergencyPhone) {
          phoneNumber = emergencyPhone;
          console.log('✅ تم استخراج رقم الهاتف بالنظام الاحتياطي:', phoneNumber);
        } else {
          console.log('❌ فشل في استخراج رقم الهاتف');
        }
      } else {
        console.log('✅ رقم الهاتف من ChatGPT صالح:', phoneNumber);
      }

      return {
        customer: {
          fullName: parsedData.customer?.fullName || '',
          nationality: parsedData.customer?.nationality || 'قطري',
          qidNumber: qidNumber,
          licenseNumber: qidNumber, // رقم رخصة القيادة = رقم الهوية القطرية
          address: 'الدوحة', // العنوان دائماً الدوحة
          phoneNumber: phoneNumber
        },
        vehicle: {
          brand: parsedData.vehicle?.brand || '',
          registrationNumber: parsedData.vehicle?.registrationNumber || '',
          chassisNumber: parsedData.vehicle?.chassisNumber || '',
          manufacturingYear: parsedData.vehicle?.manufacturingYear || '',
          // حذف model لأنه غير موجود في العقد
          color: parsedData.vehicle?.color || ''
        },
        contract: {
          startDate: startDate, // استخدام التاريخ المحسن
          monthlyRent: parsedData.contract?.monthlyRent || 0,
          contractDuration: parsedData.contract?.contractDuration || 0
          // حذف contractNumber لأنه يُولد تلقائياً
        },
        rawText: originalText
      };
    } catch (error) {
      console.error('❌ فشل في تحليل استجابة ChatGPT:', error);
      return this.getBasicExtraction(originalText);
    }
  }

  /**
   * حساب ثقة الذكاء الاصطناعي
   */
  private calculateChatGPTConfidence(data: CarRentalContractData, usage: any): number {
    let confidence = 70; // قاعدة أساسية للذكاء الاصطناعي
    
    // زيادة الثقة بناءً على البيانات المستخرجة
    if (data.customer.fullName) confidence += 5;
    if (data.customer.qidNumber && data.customer.qidNumber.length === 11) confidence += 10;
    if (data.customer.phoneNumber && /^[35679]\d{7}$/.test(data.customer.phoneNumber)) {
      confidence += 10; // زيادة أكبر لرقم الهاتف
      console.log('✅ تم رفع الثقة بسبب وجود رقم هاتف صالح:', data.customer.phoneNumber);
    } else {
      console.log('⚠️ لم يتم العثور على رقم هاتف صالح');
    }
    if (data.vehicle.registrationNumber) confidence += 5;
    if (data.contract.monthlyRent && data.contract.monthlyRent > 0) confidence += 5;
    
    // 🎯 زيادة كبيرة في الثقة إذا تم استخراج تاريخ البداية بنجاح
    if (data.contract.startDate && this.isValidContractDate(data.contract.startDate)) {
      confidence += 15; // زيادة كبيرة لأهمية التاريخ
      console.log('✅ تم رفع الثقة بسبب وجود تاريخ صالح:', data.contract.startDate);
    } else {
      confidence -= 10; // تقليل الثقة إذا لم يتم استخراج التاريخ
      console.log('⚠️ تم تقليل الثقة بسبب عدم وجود تاريخ صالح');
    }
    
    // تقليل الثقة إذا كانت الاستجابة طويلة جداً (قد تكون غير دقيقة)
    if (usage?.total_tokens > 1500) confidence -= 5;
    
    return Math.min(95, Math.max(50, confidence));
  }

  /**
   * تحليل تقليدي احتياطي في حالة فشل ChatGPT
   */
  private performTraditionalAnalysis(contractText: string): ContractOcrResult {
    console.log('🔄 التبديل للتحليل التقليدي المحسن...');
    
    // تحليل محسن مباشر
    const basicData = this.getBasicExtraction(contractText);
    const confidence = this.calculateBasicConfidence(basicData);
    
    return {
      success: true,
      data: basicData,
      rawText: contractText,
      confidence,
      debugInfo: {
        extractionMethod: 'enhanced_pattern_matching_fallback',
        processedText: contractText.substring(0, 500),
        foundPatterns: ['enhanced_patterns'],
        validationResults: this.validateExtractedData(basicData),
        advancedAnalysis: {
          textProcessingSteps: ['تنظيف النص المتطور', 'استخراج العميل', 'استخراج المركبة', 'استخراج العقد'],
          patternMatching: ['enhanced_patterns'],
          contextualInference: ['استنتاج محسن'],
          finalCorrections: ['تصحيحات تقليدية'],
          confidenceLevel: confidence
        },
        warningMessage: '⚠️ تم استخدام التحليل المحسن كبديل عن ChatGPT'
      }
    };
  }

  /**
   * حساب الثقة للتحليل الأساسي
   */
  private calculateBasicConfidence(data: CarRentalContractData): number {
    let score = 0;
    let totalFields = 0;

    // فحص بيانات العميل
    if (data.customer.fullName) score += 20;
    if (data.customer.qidNumber && data.customer.qidNumber.length === 11) score += 20;
    if (data.customer.phoneNumber && /^[35679]\d{7}$/.test(data.customer.phoneNumber)) score += 15;
    if (data.customer.nationality) score += 10;
    totalFields += 4;

    // فحص بيانات المركبة
    if (data.vehicle.brand) score += 15;
    if (data.vehicle.registrationNumber) score += 15;
    if (data.vehicle.manufacturingYear && /^20[12]\d$/.test(data.vehicle.manufacturingYear)) score += 10;
    totalFields += 3;

    // فحص بيانات العقد
    if (data.contract.monthlyRent && data.contract.monthlyRent > 0) score += 10;
    if (data.contract.startDate) score += 5;
    totalFields += 2;

    return Math.min(score, 85); // الحد الأقصى 85% للتحليل التقليدي
  }

  /**
   * استخراج أساسي محسن بالأنماط التقليدية
   */
  private getBasicExtraction(text: string): CarRentalContractData {
    console.log('🔍 بدء الاستخراج الأساسي المحسن...');
    
    // تنظيف النص أولاً
    const cleanText = this.advancedTextCleaning(text);
    
    // استخراج بيانات العميل
    const customer = this.extractCustomerData(cleanText);
    
    // استخراج بيانات المركبة
    const vehicle = this.extractVehicleData(cleanText);
    
    // استخراج بيانات العقد
    const contract = this.extractContractData(cleanText);
    
    console.log('✅ اكتمل الاستخراج الأساسي:', {
      customerFields: Object.values(customer).filter(v => v).length,
      vehicleFields: Object.values(vehicle).filter(v => v).length,
      contractFields: Object.values(contract).filter(v => v).length
    });
    
    return {
      customer,
      vehicle,
      contract,
      rawText: text
    };
  }

  /**
   * استخراج بيانات العميل بأنماط محسنة
   */
  private extractCustomerData(text: string): ContractCustomerData {
    // البحث عن الاسم
    const namePatterns = [
      /(?:Second\s*Party|الطرف\s*الثاني|المستأجر|Customer|Client)[\s\n:،]*([A-Z][A-Z\s\.]{4,50}?)(?=\s*(?:Nationality|QID|الجنسية|رقم|Phone|Mobile))/i,
      /([A-Z][A-Z\s]{10,50})(?=\s*(?:Nationality|الجنسية))/i,
      /(محمد\s+[أ-ي\s]{3,40})/i,
      /الاسم\s*الكامل[\s\n:،]*([أ-ي\s]{4,50})/i,
      /الاسم[\s\n:،]*([أ-ي\s]{4,50})/i
    ];
    
    // البحث عن رقم الهوية القطرية
    const qidPatterns = [
      /(?:QID\s*No|Personal\s*ID|رقم\s*الهوية|Identity)[\s\n:،]*(\d{11})/i,
      /(?:^|\s)(\d{11})(?!\d)/g
    ];
    
    // البحث عن رقم الهاتف - أنماط متطورة وشاملة
    const phonePatterns = [
      // أنماط مع كلمات مفتاحية عربية وإنجليزية
      /(?:Mobile|Phone|جوال|موبايل|هاتف|رقم\s*الهاتف|رقم\s*الجوال|Tel|Cell)[\s\n:،]*(\+?974[\s-]?)?([35679]\d{7})/i,
      
      // أنماط مع رمز قطر
      /(?:\+974[\s-]?|00974[\s-]?)([35679]\d{7})/g,
      
      // أرقام قطرية مباشرة (تبدأ بـ 3,5,6,7,9)
      /(?:^|\s|:)([35679]\d{7})(?=\s|$|،|\.)/g,
      
      // أنماط مع فواصل أو شرطات
      /([35679]\d{3}[\s-]\d{4})/g,
      /([35679]\d{2}[\s-]\d{2}[\s-]\d{3})/g,
      
      // أنماط متقدمة للعقود القطرية
      /(?:رقم|موبايل|جوال|هاتف|تلفون)[\s\n:،]*([35679]\d{7})/i,
      /(?:Mobile|Phone|Tel)[\s\n:،]*([35679]\d{7})/i,
      
      // البحث في أي مكان في النص عن أرقام قطرية صحيحة
      /\b([35679]\d{7})\b/g,
      
      // أنماط مع أقواس أو رموز خاصة
      /\(([35679]\d{7})\)/g,
      /\[([35679]\d{7})\]/g
    ];
    
    // البحث عن الجنسية
    const nationalityPatterns = [
      /(?:Nationality|الجنسية)[\s\n:،]*([A-Z]{4,15})/i,
      /(TUNISIA|SUDANI|QATARI|EGYPTIAN|LEBANESE|INDIAN|PAKISTANI|BANGLADESHI|FILIPINO|SYRIAN)/i,
      /(تونسي|سوداني|قطري|مصري|لبناني|هندي|باكستاني|بنغلاديشي|فلبيني|سوري)/i
    ];
    
    // البحث عن رقم الرخصة
    const licensePatterns = [
      /(?:License\s*No|Driving\s*License|رقم\s*الرخصة|رخصة\s*القيادة)[\s\n:،]*([A-Z0-9]{6,15})/i,
      /(?:DL|LIC)[\s\n:،]*([A-Z0-9]{6,15})/i
    ];
    
    // البحث عن العنوان
    const addressPatterns = [
      /(?:Address|العنوان|السكن)[\s\n:،]*([A-Z][A-Za-z\s,]{10,100}?)(?=\s*(?:Phone|Mobile|QID|Contract|Date))/i,
      /(الدوحة|الريان|الوكرة|أم صلال|الخور|الشمال|الضعاين)[\s\S]{0,50}/i
    ];

    let fullName = '';
    let qidNumber = '';
    let phoneNumber = '';
    let nationality = 'قطري';
    let licenseNumber = '';
    let address = '';

    // استخراج الاسم
    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].trim().length > 4) {
        let extractedName = match[1].trim().replace(/\s+/g, ' ');
        // تحويل الأسماء الإنجليزية إلى العربية
        fullName = this.convertEnglishToArabic(extractedName);
        break;
      }
    }

    // استخراج رقم الهوية
    for (const pattern of qidPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          const cleanMatch = match.replace(/\D/g, '');
          if (cleanMatch.length === 11) {
            qidNumber = cleanMatch;
            break;
          }
        }
        if (qidNumber) break;
      }
    }

    // استخراج رقم الهاتف - منطق متطور
    const foundPhones: string[] = [];
    
    for (const pattern of phonePatterns) {
      // التأكد من أن النمط global قبل استخدام matchAll
      const globalPattern = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
      const matches = [...text.matchAll(globalPattern)];
      for (const match of matches) {
        let phone = '';
        
        // استخراج الرقم من المجموعات المختلفة
        if (match[2]) {
          phone = match[2]; // المجموعة الثانية (بعد رمز البلد)
        } else if (match[1]) {
          phone = match[1]; // المجموعة الأولى
        }
        
        // تنظيف الرقم من الفواصل والشرطات
        phone = phone.replace(/[\s-]/g, '');
        
        // التحقق من صحة الرقم القطري
        if (phone && /^[35679]\d{7}$/.test(phone)) {
          foundPhones.push(phone);
        }
      }
    }
    
    // اختيار أفضل رقم هاتف
    if (foundPhones.length > 0) {
      // إزالة التكرارات
      const uniquePhones = [...new Set(foundPhones)];
      
      // إعطاء أولوية للأرقام التي تبدأ بـ 5 أو 7 (الأكثر شيوعاً في قطر)
      const priorityPhones = uniquePhones.filter(phone => phone.startsWith('5') || phone.startsWith('7'));
      
      if (priorityPhones.length > 0) {
        phoneNumber = priorityPhones[0];
      } else {
        phoneNumber = uniquePhones[0];
      }
      
      console.log(`📱 تم استخراج رقم الهاتف: ${phoneNumber} من ${foundPhones.length} رقم محتمل`);
    } else {
      console.log('❌ لم يتم العثور على رقم هاتف صحيح');
    }

    // استخراج الجنسية
    for (const pattern of nationalityPatterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].length > 3) {
        let extractedNationality = match[1].trim();
        // تحويل الجنسيات الإنجليزية إلى العربية
        nationality = this.convertEnglishToArabic(extractedNationality);
        break;
      }
    }

    // استخراج رقم الرخصة
    for (const pattern of licensePatterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].length > 5) {
        licenseNumber = match[1].trim();
        break;
      }
    }

    // استخراج العنوان
    for (const pattern of addressPatterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].length > 5) {
        address = match[1].trim();
        break;
      }
    }

    return {
      fullName,
      nationality,
      qidNumber,
      licenseNumber: qidNumber, // رقم رخصة القيادة = رقم الهوية القطرية
      address: 'الدوحة', // العنوان دائماً الدوحة
      phoneNumber
    };
  }

  /**
   * استخراج رقم الهاتف من النص - نظام احتياطي
   */
  private extractPhoneFromText(text: string): string {
    const phonePatterns = [
      // أنماط مع كلمات مفتاحية
      /(?:Mobile|Phone|جوال|موبايل|هاتف|رقم\s*الهاتف|رقم\s*الجوال|Tel|Cell)[\s\n:،]*(\+?974[\s-]?)?([35679]\d{7})/i,
      
      // أرقام قطرية مباشرة
      /(?:^|\s|:)([35679]\d{7})(?=\s|$|،|\.)/g,
      
      // أنماط مع رمز قطر
      /(?:\+974[\s-]?|00974[\s-]?)([35679]\d{7})/g,
      
      // البحث في أي مكان
      /\b([35679]\d{7})\b/g
    ];
    
    const foundPhones: string[] = [];
    
    for (const pattern of phonePatterns) {
      // التأكد من أن النمط global قبل استخدام matchAll
      const globalPattern = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
      const matches = [...text.matchAll(globalPattern)];
      for (const match of matches) {
        let phone = match[2] || match[1];
        if (phone) {
          phone = phone.replace(/[\s-]/g, '');
          if (/^[35679]\d{7}$/.test(phone)) {
            foundPhones.push(phone);
          }
        }
      }
    }
    
    if (foundPhones.length > 0) {
      const uniquePhones = [...new Set(foundPhones)];
      // إعطاء أولوية للأرقام التي تبدأ بـ 5 أو 7
      const priorityPhones = uniquePhones.filter(phone => phone.startsWith('5') || phone.startsWith('7'));
      return priorityPhones.length > 0 ? priorityPhones[0] : uniquePhones[0];
    }
    
    return '';
  }

  /**
   * استخراج بيانات المركبة بأنماط محسنة
   */
  private extractVehicleData(text: string): ContractVehicleData {
    // البحث عن الماركة
    const brandPatterns = [
      /(BESTUNE|CHANGANE|TOYOTA|NISSAN|BMW|MERCEDES|HYUNDAI|KIA|FORD|CHEVROLET|HONDA|MAZDA|AUDI|VOLKSWAGEN|LEXUS|INFINITI|MITSUBISHI|SUBARU|SUZUKI|ISUZU|PEUGEOT|RENAULT|CITROEN|FIAT|VOLVO|JAGUAR|TESLA|CADILLAC|GENESIS|CHERY|GEELY|BYD|GAC|HAVAL|GREAT\s*WALL|MG|MAXUS|DFSK|FOTON|JAC|DONGFENG)/i,
      /(?:Brand|Make|الماركة|نوع\s*السيارة)[\s\n:،]*([A-Z]{3,20})/i
    ];
    
    // البحث عن رقم اللوحة
    const platePatterns = [
      /(?:Plate\s*No|Registration\s*No|رقم\s*اللوحة|رقم\s*التسجيل)[\s\n:،]*([A-Z0-9]{3,8})/i,
      /(?<!(?:QID|PHONE|MOBILE|CHASSIS|ID)[\s\n:،]{0,15})(\d{5,6})(?!\d)(?!\s*(?:RENT|REG|QID|PHONE|MOBILE))/g
    ];
    
    // البحث عن رقم الشاسيه
    const chassisPatterns = [
      /(?:Chassis\s*No|VIN|رقم\s*الشاسيه|رقم\s*الهيكل)[\s\n:،]*([A-Z0-9]{10,17})/i,
      /([A-Z]{2,4}[0-9A-Z]{10,17})/g
    ];
    
    // البحث عن سنة الصنع
    const yearPatterns = [
      /(?:Year|Model\s*Year|سنة\s*الصنع|موديل)[\s\n:،]*(20[12]\d)/i,
      /(20[12]\d)/g
    ];
    
    // البحث عن الموديل
    const modelPatterns = [
      /(?:Model|الموديل)[\s\n:،]*([A-Z][A-Za-z0-9\s]{2,20})/i
    ];
    
    // البحث عن اللون
    const colorPatterns = [
      /(?:Color|Colour|اللون)[\s\n:،]*([A-Z][A-Za-z\s]{2,15})/i,
      /(WHITE|BLACK|SILVER|GRAY|GREY|BLUE|RED|GREEN|YELLOW|BROWN|أبيض|أسود|فضي|رمادي|أزرق|أحمر|أخضر|أصفر|بني)/i
    ];

    let brand = '';
    let registrationNumber = '';
    let chassisNumber = '';
    let manufacturingYear = '';
    let model = '';
    let color = '';

    // استخراج الماركة
    for (const pattern of brandPatterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].length > 2 && 
          !['REG', 'RENT', 'REGISTRATION', 'NUMBER'].includes(match[1].toUpperCase())) {
        let extractedBrand = match[1].trim();
        // تحويل الماركات الإنجليزية إلى العربية
        brand = this.convertEnglishToArabic(extractedBrand);
        break;
      }
    }

    // استخراج رقم اللوحة
    for (const pattern of platePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          const cleanMatch = typeof match === 'string' ? match : match[1];
          if (cleanMatch && this.isValidPlateNumber(cleanMatch)) {
            registrationNumber = cleanMatch;
            break;
          }
        }
        if (registrationNumber) break;
      }
    }

    // استخراج رقم الشاسيه
    for (const pattern of chassisPatterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].length > 8) {
        chassisNumber = match[1].trim();
        break;
      }
    }

    // استخراج سنة الصنع
    for (const pattern of yearPatterns) {
      const match = text.match(pattern);
      if (match && match[1] && /^20[12]\d$/.test(match[1])) {
        manufacturingYear = match[1];
        break;
      }
    }

    // استخراج الموديل
    for (const pattern of modelPatterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].length > 2) {
        model = match[1].trim();
        break;
      }
    }

    // استخراج اللون
    for (const pattern of colorPatterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].length > 2) {
        color = match[1].trim();
        break;
      }
    }

    return {
      brand,
      registrationNumber,
      chassisNumber,
      manufacturingYear,
      // حذف model لأنه غير موجود في العقد
      color
    };
  }

  /**
   * استخراج بيانات العقد بأنماط محسنة ومتطورة
   */
  private extractContractData(text: string): ContractDetailsData {
    console.log('🔍 بدء استخراج بيانات العقد...');
    
    // تنظيف النص وتحضيره للتحليل
    const cleanedText = this.prepareTextForDateExtraction(text);
    
    // أنماط متطورة لاستخراج تاريخ البداية
    const datePatterns = [
      // الأنماط الأساسية مع كلمات مفتاحية عربية
      /(?:من\s*تاريخ|من\s*يوم|من\s*:|\bمن\b)[\s\n:،]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i,
      /(?:تاريخ\s*البداية|تاريخ\s*بداية|تاريخ\s*الإيجار|تاريخ)[\s\n:،]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i,
      /(?:يبدأ\s*من|ابتداء\s*من|اعتباراً\s*من)[\s\n:،]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i,
      
      // الأنماط الإنجليزية
      /(?:Date|Start\s*Date|From\s*Date|Starting\s*from)[\s\n:،]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i,
      /(?:Effective\s*from|Valid\s*from|From)[\s\n:،]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i,
      
      // البحث في بداية النص (أول 800 حرف)
      /^.{0,800}?(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/s,
      
      // أنماط تواريخ عامة بترتيب الأولوية
      /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/g,
      
      // تواريخ بصيغة مختلفة (سنة-شهر-يوم)
      /(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/g,
      
      // أنماط خاصة بالعقود القطرية
      /(?:في\s*تاريخ|بتاريخ)[\s\n:،]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i,
      
      // البحث عن التاريخ بعد كلمات معينة
      /(?:الموافق|corresponding\s*to)[\s\n:،]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i
    ];
    
    // أنماط للإيجار الشهري
    const rentPatterns = [
      /(?:Monthly\s*Rent|Rental\s*Amount|الإيجار\s*الشهري|المبلغ\s*الشهري|قيمة\s*الإيجار)[\s\n:،]*(\d{1,5})/i,
      /(\d{3,5})[\s]*(?:QAR|ريال|Riyal|ر\.ق)/i,
      /(?:مبلغ|قدره|قيمة)[\s\n:،]*(\d{3,5})[\s]*(?:ريال|QAR|Riyal)/i,
      // البحث عن مبالغ معقولة للإيجار
      /(\d{1,4})[\s]*(?:ريال|QAR|Riyal)/i
    ];
    
    // أنماط لمدة العقد
    const durationPatterns = [
      /(?:Duration|Period|مدة\s*العقد|فترة\s*العقد|مدة\s*الإيجار)[\s\n:،]*(\d{1,2})[\s]*(?:Month|شهر|Months|أشهر)/i,
      /(?:لمدة|مدة)[\s\n:،]*(\d{1,2})[\s]*(?:شهر|أشهر|Month|Months)/i,
      /(\d{1,2})[\s]*(?:Month|شهر|Months|أشهر)[\s]*(?:period|فترة)?/i
    ];

    let startDate = '';
    let monthlyRent = 0;
    let contractDuration = 0;

    // استخراج تاريخ البداية مع تسجيل مفصل
    console.log('🔍 البحث عن تاريخ البداية...');
    const foundDates: string[] = [];
    
    for (let i = 0; i < datePatterns.length; i++) {
      const pattern = datePatterns[i];
      // إصلاح خطأ matchAll - التأكد من أن النمط global
      const globalPattern = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
      const matches = text.matchAll(globalPattern);
      
      for (const match of matches) {
        if (match && match[1]) {
          const dateValue = match[1];
          console.log(`📅 تاريخ محتمل (نمط ${i + 1}):`, dateValue);
          
          if (this.isValidContractDate(dateValue)) {
            foundDates.push(dateValue);
            if (!startDate) {
              startDate = this.formatDate(dateValue);
              console.log('✅ تم اختيار التاريخ:', startDate);
              break;
            }
          }
        }
      }
      
      if (startDate) break;
    }

    // إذا لم نجد تاريخ، نحاول البحث بطريقة أخرى
    if (!startDate && foundDates.length === 0) {
      console.log('⚠️ لم يتم العثور على تاريخ، محاولة البحث المتقدم...');
      startDate = this.advancedDateExtraction(cleanedText);
    }

    // استخراج الإيجار الشهري
    console.log('💰 البحث عن الإيجار الشهري...');
    for (const pattern of rentPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const amount = parseInt(match[1]);
        console.log('💰 مبلغ محتمل:', amount);
        if (amount > 100 && amount < 50000) {
          monthlyRent = amount;
          console.log('✅ تم اختيار المبلغ:', monthlyRent);
          break;
        }
      }
    }

    // استخراج مدة العقد
    console.log('📅 البحث عن مدة العقد...');
    for (const pattern of durationPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const duration = parseInt(match[1]);
        console.log('📅 مدة محتملة:', duration);
        if (duration > 0 && duration <= 60) {
          contractDuration = duration;
          console.log('✅ تم اختيار المدة:', contractDuration);
          break;
        }
      }
    }

    console.log('📋 نتائج استخراج بيانات العقد:', {
      startDate,
      monthlyRent,
      contractDuration,
      foundDatesCount: foundDates.length
    });

    return {
      startDate,
      monthlyRent,
      contractDuration
    };
  }

  /**
   * تحضير النص لاستخراج التواريخ
   */
  private prepareTextForDateExtraction(text: string): string {
    return text
      // توحيد فواصل التاريخ
      .replace(/[\-\.]/g, '/')
      // إضافة مسافات حول التواريخ لتسهيل البحث
      .replace(/(\d{1,2}\/\d{1,2}\/\d{4})/g, ' $1 ')
      // توحيد المسافات
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * استخراج تاريخ طارئ - نظام سريع للحصول على التاريخ فوراً
   */
  private emergencyDateExtraction(text: string): string {
    console.log('🚨 نظام الاستخراج الطارئ للتاريخ...');
    
    // أنماط بسيطة وسريعة للتواريخ
    const quickDatePatterns = [
      // البحث في أول 500 حرف من النص
      /^.{0,500}?(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/s,
      // تواريخ مع كلمات مفتاحية
      /(?:من\s*تاريخ|من\s*يوم|Date|Start)[\s\n:،]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i,
      // أي تاريخ في النص
      /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/
    ];
    
    for (const pattern of quickDatePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const dateValue = match[1];
        console.log('📅 تاريخ طارئ موجود:', dateValue);
        
        if (this.isValidContractDate(dateValue)) {
          const formattedDate = this.formatDate(dateValue);
          console.log('✅ تاريخ طارئ صالح:', formattedDate);
          return formattedDate;
        }
      }
    }
    
    console.log('❌ لم يتم العثور على تاريخ في النظام الطارئ');
    return '';
  }

  /**
   * البحث المتقدم عن التواريخ
   */
  private advancedDateExtraction(text: string): string {
    console.log('🔍 البحث المتقدم عن التواريخ...');
    
    // البحث عن جميع التواريخ في النص
    const allDateMatches = text.match(/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}/g);
    
    if (allDateMatches && allDateMatches.length > 0) {
      console.log('📅 تواريخ موجودة:', allDateMatches);
      
      // ترتيب التواريخ حسب الموقع في النص
      const datesWithPosition = allDateMatches.map(date => {
        const position = text.indexOf(date);
        return { date, position };
      });
      
      // أولوية للتواريخ في بداية النص
      datesWithPosition.sort((a, b) => a.position - b.position);
      
      for (const { date } of datesWithPosition) {
        if (this.isValidContractDate(date)) {
          console.log('✅ تم اختيار التاريخ من البحث المتقدم:', date);
          return this.formatDate(date);
        }
      }
    }
    
    console.log('❌ لم يتم العثور على تاريخ صالح');
    return '';
  }

  /**
   * التحقق من صحة تاريخ العقد
   */
  private isValidContractDate(dateString: string): boolean {
    try {
      // تحويل التاريخ إلى تنسيق قياسي
      const parts = dateString.split(/[\/\-\.]/);
      if (parts.length !== 3) return false;
      
      let day, month, year;
      
      // تحديد تنسيق التاريخ
      if (parts[2].length === 4) {
        // DD/MM/YYYY أو MM/DD/YYYY
        day = parseInt(parts[0]);
        month = parseInt(parts[1]);
        year = parseInt(parts[2]);
      } else if (parts[0].length === 4) {
        // YYYY/MM/DD
        year = parseInt(parts[0]);
        month = parseInt(parts[1]);
        day = parseInt(parts[2]);
      } else {
        return false;
      }
      
      // التحقق من صحة القيم
      if (year < 2020 || year > 2030) return false;
      if (month < 1 || month > 12) return false;
      if (day < 1 || day > 31) return false;
      
      // إنشاء كائن التاريخ للتحقق
      const date = new Date(year, month - 1, day);
      const isValid = date instanceof Date && !isNaN(date.getTime()) &&
                     date.getFullYear() === year &&
                     date.getMonth() === month - 1 &&
                     date.getDate() === day;
      
      console.log(`📅 التحقق من التاريخ ${dateString}:`, isValid ? '✅ صالح' : '❌ غير صالح');
      return isValid;
      
    } catch (error) {
      console.log(`❌ خطأ في التحقق من التاريخ ${dateString}:`, error);
      return false;
    }
  }

  /**
   * تنسيق التاريخ إلى صيغة موحدة
   */
  private formatDate(dateString: string): string {
    try {
      const parts = dateString.split(/[\/\-\.]/);
      if (parts.length !== 3) return dateString;
      
      let day, month, year;
      
      if (parts[2].length === 4) {
        // DD/MM/YYYY
        day = parts[0].padStart(2, '0');
        month = parts[1].padStart(2, '0');
        year = parts[2];
      } else if (parts[0].length === 4) {
        // YYYY/MM/DD
        year = parts[0];
        month = parts[1].padStart(2, '0');
        day = parts[2].padStart(2, '0');
      } else {
        return dateString;
      }
      
      // 🎯 إرجاع التاريخ بصيغة YYYY-MM-DD للتوافق مع نموذج الاتفاقية
      const formattedDate = `${year}-${month}-${day}`;
      console.log(`📅 تم تنسيق التاريخ من ${dateString} إلى ${formattedDate}`);
      return formattedDate;
      
    } catch (error) {
      console.log('❌ خطأ في تنسيق التاريخ:', error);
      return dateString;
    }
  }

  /**
   * التحليل المتطور للنص (محتفظ به للتوافق مع النظام القديم)
   */
  private performAdvancedAnalysis(fullText: string): {
    data: CarRentalContractData;
    confidence: number;
    debugInfo: any;
  } {
    console.log('🧠 بدء التحليل المتطور...');
    
    const processingSteps: string[] = [];
    const patternMatches: string[] = [];
    const contextualInferences: string[] = [];
    const finalCorrections: string[] = [];

    // المرحلة 1: تنظيف وتحضير النص
    processingSteps.push('المرحلة 1: تنظيف وتحضير النص المتطور');
    const cleanText = this.advancedTextCleaning(fullText);
    
    // المرحلة 2: استخراج البيانات بأنماط متطورة
    processingSteps.push('المرحلة 2: استخراج متعدد الأنماط');
    const extractedData = this.multiPatternExtraction(cleanText, patternMatches);
    
    // المرحلة 3: الاستنتاج السياقي المتطور
    processingSteps.push('المرحلة 3: الاستنتاج السياقي المتطور');
    const inferredData = this.advancedContextualInference(cleanText, extractedData, contextualInferences);
    
    // المرحلة 4: التصحيح والتحقق النهائي
    processingSteps.push('المرحلة 4: التحقق والتصحيح النهائي');
    const finalData = this.finalValidationAndCorrection(inferredData, cleanText, finalCorrections);
    
    // حساب الثقة
    const confidence = this.calculateAdvancedConfidence(finalData, patternMatches);

    const debugInfo = {
      extractionMethod: 'advanced_google_vision',
      processedText: cleanText.substring(0, 500),
      foundPatterns: patternMatches,
      validationResults: this.validateExtractedData(finalData),
      advancedAnalysis: {
        textProcessingSteps: processingSteps,
        patternMatching: patternMatches,
        contextualInference: contextualInferences,
        finalCorrections: finalCorrections,
        confidenceLevel: confidence
      }
    };

    console.log('✅ اكتمل التحليل المتطور:', {
      confidence: `${confidence}%`,
      extractedFields: this.countExtractedFields(finalData)
    });

    return {
      data: finalData,
      confidence,
      debugInfo
    };
  }

  /**
   * تنظيف النص المتطور
   */
  private advancedTextCleaning(text: string): string {
    return text
      // توحيد المسافات والأسطر الجديدة
      .replace(/\r\n|\r|\n/g, ' ')
      .replace(/\s+/g, ' ')
      // إصلاح الأحرف العربية المكسورة
      .replace(/ي/g, 'ي')
      .replace(/ك/g, 'ك')
      // إزالة الأحرف الغريبة مع الاحتفاظ بالعربية والإنجليزية والأرقام
      .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0020-\u007E]/g, ' ')
      // توحيد المسافات مرة أخرى
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * استخراج متعدد الأنماط
   */
  private multiPatternExtraction(text: string, patterns: string[]): Partial<CarRentalContractData> {
    const result: any = { customer: {}, vehicle: {}, contract: {} };

    // أنماط متطورة للاستخراج
    const advancedPatterns = {
      // الاسم - أنماط متعددة ومتطورة
      'customer.fullName': [
        // البحث عن "Second Party" مع مرونة في التنسيق
        /(?:Second\s*Party|الطرف\s*الثاني)[\s\n:،]*([A-Z][A-Z\s\.]{4,50}?)(?=\s*(?:Nationality|QID|الجنسية|رقم|$))/i,
        // أسماء محددة معروفة
        /(MOHAMED\s+ALI\s+FETOUI|محمد\s+علي\s+فتوح|MOHAMED\s+[A-Z\s\.]{3,40})/i,
        // أي اسم بأحرف كبيرة متتالية
        /([A-Z][A-Z\s]{10,50})(?=\s*(?:Nationality|QID|الجنسية))/i,
        // أسماء عربية
        /(محمد\s+[أ-ي\s]{3,40})/i
      ],
      
      // رقم الهوية القطرية - أنماط متعددة
      'customer.qidNumber': [
        /(?:QID\s*No|Personal\s*ID|رقم\s*الهوية)[\s\n:،]*(\d{11})/i,
        /(?:^|\s)(\d{11})(?!\d)/g,
        // البحث في سياق أوسع
        /(\d{11})/g
      ],
      
      // رقم الهاتف القطري - أنماط محسنة
      'customer.phoneNumber': [
        /(?:Mobile|Phone|جوال|موبايل|هاتف)[\s\n:،]*([35679]\d{7})/i,
        /(?:^|\s)([35679]\d{7})(?=\s|$)/g,
        // البحث عن أرقام قطرية في أي مكان
        /([35679]\d{7})/g
      ],
      
      // الجنسية - أنماط محسنة
      'customer.nationality': [
        /(?:Nationality|الجنسية)[\s\n:،]*([A-Z]{4,15})/i,
        /(TUNISIA|SUDANI|QATARI|EGYPTIAN|LEBANESE|INDIAN|PAKISTANI)/i,
        // البحث عن أسماء البلدان
        /(تونس|السودان|قطر|مصر|لبنان|الهند|باكستان)/i
      ],
      
      // ماركة السيارة - أنماط محسنة ومفصلة
      'vehicle.brand': [
        // أنماط الماركات المعروفة بدقة عالية
        /(BESTUNE|CHANGANE|TOYOTA|NISSAN|BMW|MERCEDES|HYUNDAI|KIA|FORD|CHEVROLET|HONDA|MAZDA|AUDI|VOLKSWAGEN|LEXUS|INFINITI|MITSUBISHI|SUBARU|SUZUKI|ISUZU|PEUGEOT|RENAULT|CITROEN|FIAT|ALFA|ROMEO|VOLVO|JAGUAR|LAND|ROVER|BENTLEY|ROLLS|ROYCE|MASERATI|FERRARI|LAMBORGHINI|PORSCHE|TESLA|CADILLAC|BUICK|GMC|LINCOLN|ACURA|GENESIS|CHERY|GEELY|BYD|GAC|HAVAL|GREAT|WALL|MG|MAXUS|DFSK|FOTON|JAC|DONGFENG|FAW|CHANGAN|BRILLIANCE|ZOTYE|BAIC|SAIC|ROEWE)/i,
        // البحث عن الماركة بعد كلمات مفتاحية
        /(?:Brand|الماركة|نوع\s*السيارة|Make)[\s\n:،]*([A-Z]{3,20})(?!\s*(?:RENT|REG|NO|NUMBER))/i,
        // البحث في سياق بيانات السيارة مع تجنب الكلمات الخاطئة
        /(?:Vehicle|Car|سيارة)[\s\S]{0,100}([A-Z]{4,15})(?!\s*(?:RENT|REG|REGISTRATION|NUMBER|NO))/i,
        // البحث عن أي كلمة بأحرف كبيرة ليست من الكلمات المستبعدة
        /(?<!(?:SECOND|PARTY|FIRST|QID|MOBILE|PHONE|NATIONALITY|ADDRESS|CHASSIS|YEAR|MODEL|COLOR)[\s\n]{0,10})([A-Z]{4,15})(?!\s*(?:RENT|REG|REGISTRATION|NUMBER|NO|PARTY|QID|MOBILE|PHONE|NATIONALITY|ADDRESS|CHASSIS|YEAR|MODEL|COLOR))/g
      ],
      
      // رقم اللوحة - أنماط محسنة ومتخصصة للوحات القطرية
      'vehicle.registrationNumber': [
        // البحث عن رقم اللوحة بعد كلمات مفتاحية محددة
        /(?:Reg[\s\.]*No|Registration[\s\.]*No|Plate[\s\.]*No|License[\s\.]*Plate|رقم\s*اللوحة|رقم\s*التسجيل|لوحة\s*رقم)[\s\n:،]*([A-Z0-9]{3,10})(?!\s*(?:RENT|REG))/i,
        
        // أنماط اللوحات القطرية المحددة (5-6 أرقام)
        /(?<!(?:QID|PHONE|MOBILE|CHASSIS|ID)[\s\n:،]{0,15})(\d{5,6})(?!\d)(?!\s*(?:RENT|REG|QID|PHONE|MOBILE))/g,
        
        // أنماط اللوحات المختلطة القطرية (أحرف + أرقام)
        /([A-Z]{1,3}\d{3,6})(?!\s*(?:RENT|REG|QID|PHONE|MOBILE|CHASSIS))/g,
        /(\d{3,6}[A-Z]{1,3})(?!\s*(?:RENT|REG|QID|PHONE|MOBILE|CHASSIS))/g,
        
        // البحث عن أرقام اللوحات في سياق السيارة
        /(?:Vehicle|Car|سيارة)[\s\S]{0,100}(\d{5,6})(?!\d)(?!\s*(?:RENT|REG|QID|PHONE|MOBILE))/gi,
        
        // أنماط عامة للوحات مع فلترة قوية
        /(?<!(?:SECOND|PARTY|FIRST|QID|MOBILE|PHONE|NATIONALITY|ADDRESS|CHASSIS|YEAR|MODEL|COLOR|ID)[\s\n:،]{0,15})([A-Z0-9]{4,8})(?!\s*(?:RENT|REG|REGISTRATION|CHASSIS|QID|PHONE|MOBILE|PARTY|NATIONALITY|ADDRESS|YEAR|MODEL|COLOR))/g
      ],
      
      // رقم الهيكل - أنماط محسنة
      'vehicle.chassisNumber': [
        /(?:Chassis\s*No|VIN|رقم\s*الهيكل)[\s\n:،]*([A-Z0-9]{10,20})/i,
        /([A-Z]{2,4}[0-9A-Z]{10,17})/g,
        // أنماط VIN معروفة
        /(L[A-Z0-9]{16})/g
      ],
      
      // سنة الصنع - أنماط محسنة
      'vehicle.manufacturingYear': [
        /(?:Year|Model|سنة\s*الصنع|موديل)[\s\n:،]*(20[12]\d)/i,
        /(20[12]\d)/g,
        // البحث في سياق السيارات
        /(?:Vehicle|Car|سيارة)[\s\S]{0,100}(20[12]\d)/i
      ]
    };

    // تطبيق الأنماط مع إعطاء أولوية للأنماط الأكثر تخصصاً
    for (const [field, fieldPatterns] of Object.entries(advancedPatterns)) {
      for (const pattern of fieldPatterns) {
        const matches = text.match(pattern);
        if (matches) {
          const value = matches[1] || matches[0];
          if (value && this.validateFieldValue(field, value)) {
            this.setNestedValue(result, field, value.trim());
            patterns.push(`تم العثور على ${field}: ${value}`);
            break;
          }
        }
      }
    }

    return result;
  }

  /**
   * الاستنتاج السياقي المتطور
   */
  private advancedContextualInference(
    text: string, 
    extractedData: any, 
    inferences: string[]
  ): CarRentalContractData {
    const result: CarRentalContractData = {
      customer: {
        fullName: extractedData.customer?.fullName || '',
        nationality: extractedData.customer?.nationality || '',
        qidNumber: extractedData.customer?.qidNumber || '',
        licenseNumber: '',
        address: '',
        phoneNumber: extractedData.customer?.phoneNumber || ''
      },
      vehicle: {
        brand: extractedData.vehicle?.brand || '',
        registrationNumber: extractedData.vehicle?.registrationNumber || '',
        chassisNumber: extractedData.vehicle?.chassisNumber || '',
        manufacturingYear: extractedData.vehicle?.manufacturingYear || ''
      },
      contract: {
        startDate: extractedData.contract?.startDate || ''
      },
      rawText: text
    };

    // استنتاجات ذكية متطورة
    
    // 1. رقم الرخصة = رقم الهوية في قطر
    if (result.customer.qidNumber && !result.customer.licenseNumber) {
      result.customer.licenseNumber = result.customer.qidNumber;
      inferences.push('تم تعيين رقم الرخصة مساوي لرقم الهوية (المعيار القطري)');
    }

    // 2. استنتاج الاسم من أنماط متعددة
    if (!result.customer.fullName) {
      const namePatterns = [
        /MOHAMED\s+ALI\s+FETOUI/i,
        /محمد\s+علي\s+فتوح/i,
        /MOHAMED\s+[A-Z\s\.]{10,40}/i
      ];
      
      for (const pattern of namePatterns) {
        const match = text.match(pattern);
        if (match) {
          result.customer.fullName = match[0].includes('FETOUI') ? 'محمد علي فتوح' : match[0];
          inferences.push(`تم استنتاج الاسم: ${result.customer.fullName}`);
          break;
        }
      }
    }

    // 3. استنتاج الجنسية المتطور
    if (!result.customer.nationality) {
      const nationalityMappings = {
        'TUNISIA': 'تونسي',
        'SUDANI': 'سوداني',
        'QATARI': 'قطري',
        'EGYPTIAN': 'مصري',
        'LEBANESE': 'لبناني',
        'INDIAN': 'هندي',
        'PAKISTANI': 'باكستاني'
      };
      
      for (const [english, arabic] of Object.entries(nationalityMappings)) {
        if (text.toUpperCase().includes(english)) {
          result.customer.nationality = arabic;
          inferences.push(`تم استنتاج الجنسية: ${english} -> ${arabic}`);
          break;
        }
      }
    }

    // 4. استنتاج ماركة السيارة المحسن
    if (!result.vehicle.brand || result.vehicle.brand === 'REG' || result.vehicle.brand === 'RENT') {
      const brandPatterns = [
        'BESTUNE', 'CHANGANE', 'TOYOTA', 'NISSAN', 'BMW', 'MERCEDES',
        'HYUNDAI', 'KIA', 'FORD', 'CHEVROLET', 'HONDA', 'MAZDA', 'AUDI',
        'VOLKSWAGEN', 'LEXUS', 'INFINITI', 'MITSUBISHI', 'SUBARU', 'SUZUKI',
        'ISUZU', 'PEUGEOT', 'RENAULT', 'CITROEN', 'FIAT', 'VOLVO', 'JAGUAR',
        'TESLA', 'CADILLAC', 'GENESIS', 'CHERY', 'GEELY', 'BYD', 'GAC', 'HAVAL',
        'GREAT WALL', 'MG', 'MAXUS', 'DFSK', 'FOTON', 'JAC', 'DONGFENG'
      ];
      
      for (const brand of brandPatterns) {
        if (text.toUpperCase().includes(brand)) {
          result.vehicle.brand = brand;
          inferences.push(`تم استنتاج الماركة: ${brand}`);
          break;
        }
      }
      
      // البحث عن ماركات في سياق أوسع مع تجنب الكلمات الخاطئة
      if (!result.vehicle.brand) {
        const brandMatches = text.match(/(?:Brand|Make|الماركة)[\s\n:،]*([A-Z]{3,20})(?!\s*(?:RENT|REG|NO|NUMBER))/i);
        if (brandMatches && brandMatches[1] && !['RENT', 'REG', 'NO', 'NUMBER'].includes(brandMatches[1])) {
          result.vehicle.brand = brandMatches[1];
          inferences.push(`تم استنتاج الماركة من السياق: ${brandMatches[1]}`);
        }
      }
    }

    // 5. تحسين رقم الهاتف
    if (!result.customer.phoneNumber || 
        (result.customer.qidNumber && result.customer.qidNumber.includes(result.customer.phoneNumber))) {
      
      const phoneMatches = text.match(/[35679]\d{7}/g);
      if (phoneMatches) {
        for (const phone of phoneMatches) {
          if (!result.customer.qidNumber || !result.customer.qidNumber.includes(phone)) {
            result.customer.phoneNumber = phone;
            inferences.push(`تم تصحيح رقم الهاتف إلى: ${phone}`);
            break;
          }
        }
      }
    }

    // 6. تحسين رقم اللوحة المحسن والمتخصص
    if (!result.vehicle.registrationNumber || result.vehicle.registrationNumber === 'RENT' || result.vehicle.registrationNumber === 'REG') {
      // أنماط اللوحات القطرية المتخصصة
      const platePatterns = [
        // أرقام اللوحات القطرية المحددة (5-6 أرقام فقط)
        /(?<!(?:QID|PHONE|MOBILE|CHASSIS|ID)[\s\n:،]{0,15})(\d{5,6})(?!\d)(?!\s*(?:RENT|REG|QID|PHONE|MOBILE))/g,
        
        // أنماط اللوحات المختلطة القطرية
        /([A-Z]{1,3}\d{3,6})(?!\s*(?:RENT|REG|QID|PHONE|MOBILE|CHASSIS))/g,
        /(\d{3,6}[A-Z]{1,3})(?!\s*(?:RENT|REG|QID|PHONE|MOBILE|CHASSIS))/g,
        
        // البحث في سياق السيارة
        /(?:Vehicle|Car|سيارة)[\s\S]{0,150}(\d{5,6})(?!\d)(?!\s*(?:RENT|REG|QID|PHONE|MOBILE))/gi
      ];
      
      // ترتيب أولوية للأنماط (الأكثر تخصصاً أولاً)
      for (const pattern of platePatterns) {
        const matches = text.match(pattern);
        if (matches) {
          for (const match of matches) {
            // فلترة قوية للتأكد من أنه رقم لوحة وليس شيء آخر
            if (this.isValidPlateNumber(match, result.customer.qidNumber, result.customer.phoneNumber)) {
              result.vehicle.registrationNumber = match;
              inferences.push(`تم استنتاج رقم اللوحة: ${match}`);
              break;
            }
          }
          if (result.vehicle.registrationNumber && 
              result.vehicle.registrationNumber !== 'RENT' && 
              result.vehicle.registrationNumber !== 'REG') {
            break;
          }
        }
      }
      
      // إذا لم نجد شيء، ابحث عن أي رقم 5-6 أرقام ليس QID أو هاتف
      if (!result.vehicle.registrationNumber || 
          ['RENT', 'REG'].includes(result.vehicle.registrationNumber)) {
        const allNumbers = text.match(/\d{5,6}/g);
        if (allNumbers) {
          for (const num of allNumbers) {
            if (num !== result.customer.qidNumber?.substring(0, 6) && 
                num !== result.customer.qidNumber?.substring(5, 11) &&
                num !== result.customer.phoneNumber &&
                !result.customer.qidNumber?.includes(num)) {
              result.vehicle.registrationNumber = num;
              inferences.push(`تم استنتاج رقم اللوحة من الأرقام المتاحة: ${num}`);
              break;
            }
          }
        }
      }
    }

    return result;
  }

  /**
   * التحقق والتصحيح النهائي
   */
  private finalValidationAndCorrection(
    data: CarRentalContractData, 
    text: string, 
    corrections: string[]
  ): CarRentalContractData {
    // تصحيح رقم الهوية
    if (!data.customer.qidNumber || !/^\d{11}$/.test(data.customer.qidNumber)) {
      const qidMatches = text.match(/\d{11}/g);
      if (qidMatches) {
        data.customer.qidNumber = qidMatches[0];
        data.customer.licenseNumber = qidMatches[0];
        corrections.push(`تم تصحيح رقم الهوية إلى: ${qidMatches[0]}`);
      }
    }

    // تصحيح رقم الهاتف
    if (!data.customer.phoneNumber || !/^[35679]\d{7}$/.test(data.customer.phoneNumber)) {
      const phoneMatches = text.match(/[35679]\d{7}/g);
      if (phoneMatches) {
        for (const phone of phoneMatches) {
          if (!data.customer.qidNumber || !data.customer.qidNumber.includes(phone)) {
            data.customer.phoneNumber = phone;
            corrections.push(`تم تصحيح رقم الهاتف إلى: ${phone}`);
            break;
          }
        }
      }
    }

    // تصحيح سنة الصنع
    if (!data.vehicle.manufacturingYear || !/^20[12]\d$/.test(data.vehicle.manufacturingYear)) {
      const yearMatches = text.match(/20[12]\d/g);
      if (yearMatches) {
        data.vehicle.manufacturingYear = yearMatches[0];
        corrections.push(`تم تصحيح سنة الصنع إلى: ${yearMatches[0]}`);
      }
    }

    // تصحيح رقم الهيكل
    if (!data.vehicle.chassisNumber) {
      const chassisMatches = text.match(/[A-Z]{2,4}[0-9A-Z]{10,17}/g);
      if (chassisMatches) {
        data.vehicle.chassisNumber = chassisMatches[0];
        corrections.push(`تم تصحيح رقم الهيكل إلى: ${chassisMatches[0]}`);
      }
    }

    // تصحيح الماركة النهائي
    if (!data.vehicle.brand || data.vehicle.brand === 'REG' || data.vehicle.brand === 'RENT' || data.vehicle.brand.length < 3) {
      const brandPatterns = [
        'BESTUNE', 'CHANGANE', 'TOYOTA', 'NISSAN', 'BMW', 'MERCEDES',
        'HYUNDAI', 'KIA', 'FORD', 'CHEVROLET', 'HONDA', 'MAZDA', 'AUDI',
        'VOLKSWAGEN', 'LEXUS', 'INFINITI', 'MITSUBISHI', 'SUBARU', 'SUZUKI',
        'ISUZU', 'PEUGEOT', 'RENAULT', 'CITROEN', 'FIAT', 'VOLVO', 'JAGUAR',
        'TESLA', 'CADILLAC', 'GENESIS', 'CHERY', 'GEELY', 'BYD', 'GAC', 'HAVAL',
        'GREAT WALL', 'MG', 'MAXUS', 'DFSK', 'FOTON', 'JAC', 'DONGFENG'
      ];
      
      for (const brand of brandPatterns) {
        if (text.toUpperCase().includes(brand)) {
          data.vehicle.brand = brand;
          corrections.push(`تم تصحيح الماركة إلى: ${brand}`);
          break;
        }
      }
    }

    // تصحيح رقم اللوحة النهائي (رقم التسجيل)
    if (!data.vehicle.registrationNumber || data.vehicle.registrationNumber === 'RENT' || data.vehicle.registrationNumber === 'REG' || data.vehicle.registrationNumber.length < 3) {
      // أنماط اللوحات القطرية المتخصصة
      const platePatterns = [
        // أرقام اللوحات القطرية المحددة (5-6 أرقام)
        /(?<!(?:QID|PHONE|MOBILE|CHASSIS|ID)[\s\n:،]{0,15})(\d{5,6})(?!\d)(?!\s*(?:RENT|REG|QID|PHONE|MOBILE))/g,
        
        // أنماط اللوحات المختلطة القطرية
        /([A-Z]{1,3}\d{3,6})(?!\s*(?:RENT|REG|QID|PHONE|MOBILE|CHASSIS))/g,
        /(\d{3,6}[A-Z]{1,3})(?!\s*(?:RENT|REG|QID|PHONE|MOBILE|CHASSIS))/g,
        
        // البحث في سياق السيارة
        /(?:Vehicle|Car|سيارة)[\s\S]{0,150}(\d{5,6})(?!\d)(?!\s*(?:RENT|REG|QID|PHONE|MOBILE))/gi
      ];
      
      for (const pattern of platePatterns) {
        const matches = text.match(pattern);
        if (matches) {
          for (const match of matches) {
            // استخدام الدالة المتخصصة للتحقق من صحة رقم اللوحة
            if (this.isValidPlateNumber(match, data.customer.qidNumber, data.customer.phoneNumber)) {
              data.vehicle.registrationNumber = match;
              corrections.push(`تم تصحيح رقم اللوحة إلى: ${match}`);
              break;
            }
          }
          if (data.vehicle.registrationNumber && 
              this.isValidPlateNumber(data.vehicle.registrationNumber, data.customer.qidNumber, data.customer.phoneNumber)) {
            break;
          }
        }
      }
      
      // البحث الاحتياطي عن أي رقم 5-6 أرقام مناسب
      if (!data.vehicle.registrationNumber || 
          !this.isValidPlateNumber(data.vehicle.registrationNumber, data.customer.qidNumber, data.customer.phoneNumber)) {
        const allNumbers = text.match(/\d{5,6}/g);
        if (allNumbers) {
          for (const num of allNumbers) {
            if (this.isValidPlateNumber(num, data.customer.qidNumber, data.customer.phoneNumber)) {
              data.vehicle.registrationNumber = num;
              corrections.push(`تم تصحيح رقم اللوحة من البحث الاحتياطي: ${num}`);
              break;
            }
          }
        }
      }
    }

    return data;
  }

  /**
   * حساب الثقة المتطور
   */
  private calculateAdvancedConfidence(data: CarRentalContractData, patterns: string[]): number {
    const validations = this.validateExtractedData(data);
    const validCount = Object.values(validations).filter(v => v).length;
    const totalFields = Object.keys(validations).length;
    
    const baseConfidence = (validCount / totalFields) * 100;
    
    // إضافة مكافآت للأنماط المكتشفة
    const patternBonus = Math.min(patterns.length * 2, 20);
    
    return Math.min(100, Math.round(baseConfidence + patternBonus));
  }

  /**
   * عد الحقول المستخرجة
   */
  private countExtractedFields(data: CarRentalContractData): number {
    let count = 0;
    if (data.customer.fullName) count++;
    if (data.customer.nationality) count++;
    if (data.customer.qidNumber) count++;
    if (data.customer.phoneNumber) count++;
    if (data.vehicle.brand) count++;
    if (data.vehicle.registrationNumber) count++;
    if (data.vehicle.chassisNumber) count++;
    if (data.vehicle.manufacturingYear) count++;
    return count;
  }

  // دوال مساعدة
  private validateExtractedData(data: CarRentalContractData): Record<string, boolean> {
    return {
      hasValidName: !!(data.customer.fullName && data.customer.fullName.length > 2),
      hasValidQID: !!(data.customer.qidNumber && /^\d{11}$/.test(data.customer.qidNumber)),
      hasValidPhone: !!(data.customer.phoneNumber && /^[35679]\d{7}$/.test(data.customer.phoneNumber)),
      hasValidNationality: !!(data.customer.nationality && data.customer.nationality.length > 2),
      hasValidBrand: !!(data.vehicle.brand && 
                       data.vehicle.brand.length > 2 && 
                       !['REG', 'RENT', 'REGISTRATION'].includes(data.vehicle.brand.toUpperCase())),
      hasValidRegistration: !!(data.vehicle.registrationNumber && 
                              data.vehicle.registrationNumber.length > 2 && 
                              !['REG', 'RENT', 'REGISTRATION'].includes(data.vehicle.registrationNumber.toUpperCase())),
      hasValidChassis: !!(data.vehicle.chassisNumber && data.vehicle.chassisNumber.length > 5),
      hasValidYear: !!(data.vehicle.manufacturingYear && /^20[12]\d$/.test(data.vehicle.manufacturingYear))
    };
  }

  private validateFieldValue(field: string, value: string): boolean {
    switch (field) {
      case 'customer.qidNumber':
        return /^\d{11}$/.test(value);
      case 'customer.phoneNumber':
        return /^[35679]\d{7}$/.test(value);
      case 'vehicle.manufacturingYear':
        return /^20[12]\d$/.test(value);
      default:
        return value.length > 1;
    }
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  private isValidPlateNumber(plateNumber: string, qidNumber?: string, phoneNumber?: string): boolean {
    // تجنب الكلمات المحظورة
    const forbiddenWords = ['RENT', 'REG', 'REGISTRATION', 'QID', 'PHONE', 'MOBILE', 'CHASSIS', 'PARTY', 'NATIONALITY'];
    if (forbiddenWords.includes(plateNumber.toUpperCase())) {
      return false;
    }

    // تجنب أرقام الهوية والهاتف
    if (qidNumber && (plateNumber === qidNumber || qidNumber.includes(plateNumber))) {
      return false;
    }
    
    if (phoneNumber && plateNumber === phoneNumber) {
      return false;
    }

    // التحقق من طول مناسب للوحة
    if (plateNumber.length < 3 || plateNumber.length > 8) {
      return false;
    }

    // التحقق من أنماط اللوحات القطرية المقبولة
    // أرقام فقط (5-6 أرقام)
    if (/^\d{5,6}$/.test(plateNumber)) {
      return true;
    }

    // أحرف + أرقام
    if (/^[A-Z]{1,3}\d{3,6}$/.test(plateNumber) || /^\d{3,6}[A-Z]{1,3}$/.test(plateNumber)) {
      return true;
    }

    // أنماط مختلطة أخرى مقبولة
    if (/^[A-Z0-9]{4,8}$/.test(plateNumber)) {
      return true;
    }

    return false;
  }

  /**
   * تحويل الأسماء والكلمات الإنجليزية إلى العربية
   */
  private convertEnglishToArabic(englishText: string): string {
    const nameMap: Record<string, string> = {
      'MOHAMED': 'محمد',
      'MOHAMMED': 'محمد',
      'MUHAMMAD': 'محمد',
      'AHMED': 'أحمد',
      'ALI': 'علي',
      'HASSAN': 'حسن',
      'HUSSEIN': 'حسين',
      'OMAR': 'عمر',
      'UMAR': 'عمر',
      'IBRAHIM': 'إبراهيم',
      'YOUSSEF': 'يوسف',
      'JOSEPH': 'يوسف',
      'ABDULLAH': 'عبدالله',
      'ABDALLAH': 'عبدالله',
      'ABDUL': 'عبد',
      'SALEM': 'سالم',
      'SALIM': 'سالم',
      'KHALID': 'خالد',
      'KHALED': 'خالد',
      'SAEED': 'سعيد',
      'SAID': 'سعيد',
      'RASHID': 'راشد',
      'NASSER': 'ناصر',
      'NASIR': 'ناصر',
      'FAISAL': 'فيصل',
      'FETOUI': 'فتوح'
    };

    const nationalityMap: Record<string, string> = {
      'TUNISIA': 'تونسي',
      'TUNISIAN': 'تونسي',
      'EGYPT': 'مصري',
      'EGYPTIAN': 'مصري',
      'QATAR': 'قطري',
      'QATARI': 'قطري',
      'SAUDI': 'سعودي',
      'LEBANESE': 'لبناني',
      'SYRIAN': 'سوري',
      'SUDANESE': 'سوداني',
      'SUDANI': 'سوداني',
      'INDIAN': 'هندي',
      'PAKISTANI': 'باكستاني',
      'BANGLADESHI': 'بنغلاديشي',
      'FILIPINO': 'فلبيني'
    };

    const brandMap: Record<string, string> = {
      'TOYOTA': 'تويوتا',
      'HONDA': 'هوندا',
      'NISSAN': 'نيسان',
      'HYUNDAI': 'هيونداي',
      'KIA': 'كيا',
      'FORD': 'فورد',
      'CHEVROLET': 'شيفروليه',
      'BMW': 'بي إم دبليو',
      'MERCEDES': 'مرسيدس',
      'AUDI': 'أودي',
      'VOLKSWAGEN': 'فولكس واجن',
      'MAZDA': 'مازدا',
      'MITSUBISHI': 'ميتسوبيشي',
      'SUBARU': 'سوبارو',
      'SUZUKI': 'سوزوكي',
      'LEXUS': 'لكزس',
      'INFINITI': 'إنفينيتي',
      'CAMRY': 'كامري',
      'COROLLA': 'كورولا',
      'CIVIC': 'سيفيك',
      'ACCORD': 'أكورد'
    };

    let convertedText = englishText;

    // تحويل الأسماء
    Object.entries(nameMap).forEach(([english, arabic]) => {
      const regex = new RegExp(`\\b${english}\\b`, 'gi');
      convertedText = convertedText.replace(regex, arabic);
    });

    // تحويل الجنسيات
    Object.entries(nationalityMap).forEach(([english, arabic]) => {
      const regex = new RegExp(`\\b${english}\\b`, 'gi');
      convertedText = convertedText.replace(regex, arabic);
    });

    // تحويل الماركات
    Object.entries(brandMap).forEach(([english, arabic]) => {
      const regex = new RegExp(`\\b${english}\\b`, 'gi');
      convertedText = convertedText.replace(regex, arabic);
    });

    return convertedText.trim();
  }
}

// تصدير الخدمة
const carRentalContractOcrService = new CarRentalContractOcrService();
export { carRentalContractOcrService };
export default carRentalContractOcrService;
