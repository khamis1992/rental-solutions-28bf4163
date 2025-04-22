
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { text, mode } = body;
    
    // Handle different modes (transliteration or agreement analysis)
    if (mode === 'agreement_analysis') {
      return await handleAgreementAnalysis(body);
    }
    
    // Default mode is transliteration
    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({ 
        error: 'Invalid input. Text must be a non-empty string.' 
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`Transliterating text: "${text}"`);

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a name transliterator expert. Convert Arabic and other non-Latin script names and text to their English representation using standard romanization. Only return the romanized text, nothing else. Do not add any explanations or notes. Examples: عبد الله -> Abdullah, محمد -> Mohammed, فاطمة -> Fatima, زينب -> Zainab, عبد الرحمن -> Abdul Rahman, مركز الملك عبدالله المالي -> King Abdullah Financial Center'
          },
          {
            role: 'user',
            content: `Transliterate this text to English (romanized form): ${text}`
          }
        ],
        temperature: 0.1,
        max_tokens: 100
      }),
    });

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid response from Perplexity API:', data);
      throw new Error('Invalid response from transliteration service');
    }
    
    const transliteratedText = data.choices[0].message.content.trim();
    console.log(`Transliteration result: "${transliteratedText}"`);

    return new Response(JSON.stringify({ translatedText: transliteratedText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in translate-text function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// New function to handle agreement analysis
async function handleAgreementAnalysis(body: any) {
  const { agreementData } = body;
  
  if (!agreementData) {
    return new Response(JSON.stringify({ 
      error: 'Invalid input. Agreement data is required.' 
    }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
  
  console.log(`Analyzing agreement data for ID: ${agreementData.id}`);
  
  try {
    // Extract relevant agreement details for analysis
    const {
      start_date,
      end_date,
      status,
      total_amount,
      deposit_amount,
      payments = []
    } = agreementData;
    
    // Calculate key metrics for analysis
    const today = new Date();
    const endDate = new Date(end_date);
    const daysUntilExpiration = Math.floor((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const isExpired = daysUntilExpiration < 0;
    
    // Calculate payment status
    const paidPayments = payments.filter((p: any) => p.status === 'paid').length;
    const totalPayments = payments.length;
    const paymentRate = totalPayments > 0 ? paidPayments / totalPayments : 0;
    const hasOverduePayments = payments.some((p: any) => 
      p.status === 'pending' && new Date(p.due_date) < today
    );
    
    // Generate AI prompt for agreement analysis
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: `You are an agreement status analyzer. Based on the data provided, determine the appropriate status for the agreement and provide a brief explanation. Your response should be in this JSON format only: {"recommendedStatus": "status", "confidence": number, "explanation": "explanation", "riskLevel": "low|medium|high", "actionItems": ["action1", "action2"]}. Do not include any other text.`
          },
          {
            role: 'user',
            content: `Analyze this agreement data and recommend an appropriate status:
              Current Status: ${status}
              Days Until Expiration: ${daysUntilExpiration}
              Is Expired: ${isExpired}
              Payment Rate: ${(paymentRate * 100).toFixed(1)}%
              Has Overdue Payments: ${hasOverduePayments}
              Total Amount: ${total_amount}
              Deposit Amount: ${deposit_amount}
              Number of Payments: ${totalPayments}
              Paid Payments: ${paidPayments}`
          }
        ],
        temperature: 0.2,
        max_tokens: 500
      }),
    });

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid response from Perplexity API:', data);
      throw new Error('Invalid response from agreement analysis service');
    }
    
    const analysisText = data.choices[0].message.content.trim();
    console.log(`Agreement analysis result: "${analysisText}"`);
    
    // Parse JSON response from AI
    let analysisResult;
    try {
      analysisResult = JSON.parse(analysisText);
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', e);
      // Extract JSON from text if it's surrounded by other text
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          analysisResult = JSON.parse(jsonMatch[0]);
        } catch (e) {
          throw new Error('Could not parse analysis result');
        }
      } else {
        throw new Error('Could not parse analysis result');
      }
    }
    
    // Add timestamp and processed agreement ID
    const result = {
      ...analysisResult,
      analyzedAt: new Date().toISOString(),
      agreementId: agreementData.id,
      currentStatus: status
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in agreement analysis:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error during analysis',
      agreementId: agreementData.id
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
