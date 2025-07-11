// OpenAI Service for contract analysis using Supabase Edge Functions

export interface OpenAIAnalysisResult {
  success: boolean;
  data?: {
    text: string;
    usage?: any;
    model?: string;
  };
  error?: string;
}

class OpenAIService {
  /**
   * Analyze contract text using OpenAI through Supabase Edge Function
   */
  async analyzeContract(contractText: string): Promise<OpenAIAnalysisResult> {
    try {
      console.log('🤖 Analyzing contract with OpenAI Edge Function...');
      
      // Import Supabase client dynamically
      const { supabase } = await import('@/integrations/supabase/client');
      
      const systemPrompt = `أنت خبير في تحليل عقود إيجار السيارات. استخرج البيانات من النص التالي وأرجعها في تنسيق JSON بهذا الشكل:

{
  "customer": {
    "fullName": "الاسم الكامل",
    "nationality": "الجنسية",
    "qidNumber": "رقم الهوية (11 رقم)",
    "licenseNumber": "رقم الرخصة",
    "address": "العنوان",
    "phoneNumber": "رقم الهاتف (8 أرقام)"
  },
  "vehicle": {
    "brand": "الماركة",
    "model": "الطراز",
    "registrationNumber": "رقم اللوحة",
    "chassisNumber": "رقم الشاصي",
    "manufacturingYear": "سنة الصنع",
    "color": "اللون"
  },
  "contract": {
    "startDate": "تاريخ البداية (YYYY-MM-DD)",
    "monthlyRent": المبلغ الشهري (رقم),
    "contractDuration": مدة العقد بالأشهر (رقم),
    "contractNumber": "رقم العقد",
    "depositAmount": مبلغ الضمان (رقم)
  }
}

إذا لم تجد معلومة معينة، اتركها فارغة. تأكد من أن الاستجابة JSON صحيحة.`;

      // Call OpenAI Edge Function
      const { data, error } = await supabase.functions.invoke('process-openai', {
        body: {
          prompt: contractText,
          systemPrompt,
          model: 'gpt-4o-mini',
          maxTokens: 1500,
          temperature: 0.1
        }
      });

      if (error) {
        console.error('❌ OpenAI Edge Function error:', error);
        return {
          success: false,
          error: `OpenAI processing failed: ${error.message}`
        };
      }

      if (!data || !data.success) {
        console.warn('⚠️ OpenAI processing failed:', data?.error);
        return {
          success: false,
          error: data?.error || 'OpenAI analysis failed'
        };
      }

      console.log('✅ OpenAI analysis completed successfully');
      return {
        success: true,
        data: {
          text: data.data?.text || '',
          usage: data.data?.usage,
          model: data.data?.model
        }
      };

    } catch (error) {
      console.error('❌ OpenAI service error:', error);
      return {
        success: false,
        error: `OpenAI service error: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Simple text generation using OpenAI
   */
  async generateText(prompt: string, systemPrompt?: string): Promise<OpenAIAnalysisResult> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.functions.invoke('process-openai', {
        body: {
          prompt,
          systemPrompt: systemPrompt || 'You are a helpful assistant.',
          model: 'gpt-4o-mini',
          maxTokens: 1000,
          temperature: 0.7
        }
      });

      if (error) {
        return {
          success: false,
          error: `OpenAI processing failed: ${error.message}`
        };
      }

      if (!data || !data.success) {
        return {
          success: false,
          error: data?.error || 'OpenAI generation failed'
        };
      }

      return {
        success: true,
        data: {
          text: data.data?.text || '',
          usage: data.data?.usage,
          model: data.data?.model
        }
      };

    } catch (error) {
      return {
        success: false,
        error: `OpenAI service error: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

export const openAIService = new OpenAIService();