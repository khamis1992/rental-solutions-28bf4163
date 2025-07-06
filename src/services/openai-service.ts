// OpenAI Service - Enhanced with Edge Function Integration

export interface OpenAIRequest {
  prompt: string;
  systemPrompt?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface OpenAIResponse {
  success: boolean;
  data?: {
    text: string;
    usage?: any;
    model?: string;
  };
  error?: string;
  details?: string;
}

class OpenAIService {
  private isConfigured = false;

  constructor() {
    // Service uses Edge Functions, no direct API key needed
    this.isConfigured = true;
  }

  /**
   * Process text with OpenAI via Edge Function
   */
  async processText({
    prompt,
    systemPrompt = 'You are a helpful AI assistant.',
    model = 'gpt-4o-mini',
    maxTokens = 1000,
    temperature = 0.7
  }: OpenAIRequest): Promise<OpenAIResponse> {
    try {
      console.log('🤖 Starting OpenAI processing via Edge Function...');
      
      // Import Supabase client dynamically
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Call our Edge Function instead of direct API call
      const { data, error } = await supabase.functions.invoke('process-openai', {
        body: {
          prompt,
          systemPrompt,
          model,
          maxTokens,
          temperature
        }
      });

      if (error) {
        console.error('❌ OpenAI Edge Function error:', error);
        return {
          success: false,
          error: 'OpenAI service is not available',
          details: error.message
        };
      }

      if (!data || !data.success) {
        console.error('❌ OpenAI processing failed:', data?.error);
        return {
          success: false,
          error: data?.error || 'OpenAI processing failed',
          details: data?.details
        };
      }

      console.log('✅ OpenAI Edge Function processed successfully');
      
      return {
        success: true,
        data: data.data
      };

    } catch (error) {
      console.error('❌ OpenAI service error:', error);
      return {
        success: false,
        error: 'Internal service error',
        details: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Generate contract analysis
   */
  async analyzeContract(contractText: string): Promise<OpenAIResponse> {
    return this.processText({
      prompt: contractText,
      systemPrompt: `You are an expert legal document analyzer. Extract key information from this rental agreement contract in Arabic or English. 
      Return the extracted data in JSON format with these fields:
      - customerName (string)
      - idNumber (string) 
      - vehicleInfo (string)
      - rentAmount (number)
      - depositAmount (number)
      - startDate (string)
      - endDate (string)
      - terms (string)
      
      If any field cannot be found, return empty string or 0 for numbers.`,
      model: 'gpt-4o-mini',
      maxTokens: 1500,
      temperature: 0.3
    });
  }

  /**
   * Generate customer communication
   */
  async generateCustomerMessage(template: string, customerData: any): Promise<OpenAIResponse> {
    return this.processText({
      prompt: `Generate a professional customer communication message in Arabic based on this template: "${template}" and customer data: ${JSON.stringify(customerData)}`,
      systemPrompt: 'You are a professional customer service representative. Generate polite and clear messages in Arabic.',
      model: 'gpt-4o-mini',
      maxTokens: 500,
      temperature: 0.7
    });
  }

  /**
   * Check if the service is properly configured
   */
  isServiceAvailable(): boolean {
    return this.isConfigured;
  }

  /**
   * Get service status for diagnostics
   */
  getServiceStatus(): { configured: boolean; available: boolean; lastError?: string } {
    return {
      configured: this.isConfigured,
      available: this.isConfigured,
      lastError: this.isConfigured ? undefined : 'OpenAI service not configured'
    };
  }
}

// Export singleton instance
export const openAIService = new OpenAIService();
export default openAIService;