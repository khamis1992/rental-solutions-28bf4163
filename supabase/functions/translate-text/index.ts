
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
    const { text } = await req.json();
    
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
