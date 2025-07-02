// ChatGPT Contract Extractor Service - Advanced AI Text Analysis
// نظام استخراج متطور باستخدام ChatGPT API لتحليل العقود بذكاء اصطناعي
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
  debugInfo?: any;
}

class ChatGPTContractExtractor {
  private readonly openaiApiKey: string;
  private readonly openaiUrl = 'https://api.openai.com/v1/chat/completions';

  constructor() {
    this.openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
  }

  async extractContractFromText(contractText: string): Promise<ContractOcrResult> {
    try {
      console.log('🤖 بدء التحليل الذكي باستخدام ChatGPT...');
      
      if (!this.openaiApiKey) {
        return this.getFallbackAnalysis(contractText);
      }

      const prompt = this.createAdvancedPrompt(contractText);
      
      const requestPayload = {
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'أنت خبير في تحليل العقود القطرية. استخرج البيانات بدقة عالية وارجع JSON صالح.'
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

      const response = await fetch(this.openaiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`
        },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        return this.getFallbackAnalysis(contractText);
      }

      const result = await response.json();
      const aiResponse = result.choices[0].message.content;
      const extractedData = this.parseAIResponse(aiResponse, contractText);

      return {
        success: true,
        data: extractedData,
        rawText: contractText,
        confidence: 85,
        debugInfo: {
          extractionMethod: 'chatgpt_ai_analysis',
          tokensUsed: result.usage?.total_tokens || 0
        }
      };

    } catch (error) {
      console.error('❌ فشل في التحليل الذكي:', error);
      return this.getFallbackAnalysis(contractText);
    }
  }

  private createAdvancedPrompt(contractText: string): string {
    return `
استخرج البيانات التالية من عقد إيجار السيارة:

النص:
"""
${contractText}
"""

ارجع JSON بالتنسيق التالي:
{
  "customer": {
    "fullName": "الاسم الكامل",
    "nationality": "الجنسية", 
    "qidNumber": "رقم الهوية (11 رقم)",
    "licenseNumber": "رقم الرخصة",
    "address": "العنوان",
    "phoneNumber": "رقم الهاتف"
  },
  "vehicle": {
    "brand": "الماركة",
    "registrationNumber": "رقم اللوحة", 
    "chassisNumber": "رقم الشاسيه",
    "manufacturingYear": "سنة الصنع",
    "model": "الموديل",
    "color": "اللون"
  },
  "contract": {
    "startDate": "تاريخ البداية",
    "monthlyRent": قيمة_الإيجار_رقم,
    "contractDuration": مدة_العقد_رقم,
    "contractNumber": "رقم العقد"
  }
}

ضع قيم فارغة للبيانات غير الموجودة.
`;
  }

  private parseAIResponse(aiResponse: string, originalText: string): CarRentalContractData {
    try {
      const parsedData = JSON.parse(aiResponse);
      
      return {
        customer: {
          fullName: parsedData.customer?.fullName || '',
          nationality: parsedData.customer?.nationality || 'قطري',
          qidNumber: parsedData.customer?.qidNumber || '',
          licenseNumber: parsedData.customer?.licenseNumber || '',
          address: parsedData.customer?.address || '',
          phoneNumber: parsedData.customer?.phoneNumber || ''
        },
        vehicle: {
          brand: parsedData.vehicle?.brand || '',
          registrationNumber: parsedData.vehicle?.registrationNumber || '',
          chassisNumber: parsedData.vehicle?.chassisNumber || '',
          manufacturingYear: parsedData.vehicle?.manufacturingYear || '',
          model: parsedData.vehicle?.model || '',
          color: parsedData.vehicle?.color || ''
        },
        contract: {
          startDate: parsedData.contract?.startDate || '',
          monthlyRent: parsedData.contract?.monthlyRent || 0,
          contractDuration: parsedData.contract?.contractDuration || 0,
          contractNumber: parsedData.contract?.contractNumber || ''
        },
        rawText: originalText
      };
    } catch (error) {
      return this.getBasicExtraction(originalText);
    }
  }

  private getFallbackAnalysis(contractText: string): ContractOcrResult {
    const basicData = this.getBasicExtraction(contractText);
    
    return {
      success: true,
      data: basicData,
      rawText: contractText,
      confidence: 60,
      debugInfo: {
        extractionMethod: 'fallback_pattern_matching'
      }
    };
  }

  private getBasicExtraction(text: string): CarRentalContractData {
    const cleanText = text.replace(/\s+/g, ' ').trim();
    
    const qidMatch = cleanText.match(/(\d{11})/);
    const phoneMatch = cleanText.match(/([35679]\d{7})/);
    const nameMatch = cleanText.match(/([A-Z][A-Z\s]{10,50})/);
    const plateMatch = cleanText.match(/(\d{5,6})/);
    
    return {
      customer: {
        fullName: nameMatch?.[1]?.trim() || '',
        nationality: 'قطري',
        qidNumber: qidMatch?.[1] || '',
        licenseNumber: '',
        address: '',
        phoneNumber: phoneMatch?.[1] || ''
      },
      vehicle: {
        brand: '',
        registrationNumber: plateMatch?.[1] || '',
        chassisNumber: '',
        manufacturingYear: '',
        model: '',
        color: ''
      },
      contract: {
        startDate: '',
        monthlyRent: 0,
        contractDuration: 0,
        contractNumber: ''
      },
      rawText: text
    };
  }
}

export const chatGPTContractExtractor = new ChatGPTContractExtractor();
export default ChatGPTContractExtractor; 