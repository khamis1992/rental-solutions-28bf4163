
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_TRANSLATE_API_KEY = Deno.env.get("GOOGLE_TRANSLATE_API_KEY");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!GOOGLE_TRANSLATE_API_KEY) {
      throw new Error('Google Translate API key is not configured');
    }

    const { text, sourceLang, targetLang } = await req.json();

    if (!text || !targetLang) {
      throw new Error('Text and target language are required');
    }

    console.log(`Translating from ${sourceLang || 'auto'} to ${targetLang}: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
    
    // Google Translate API v2 endpoint
    const url = `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_TRANSLATE_API_KEY}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: sourceLang || '',  // Empty string defaults to auto-detect
        target: targetLang,
        format: 'text',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Translation API error:', errorData);
      throw new Error(`Translation failed: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const translatedText = data.data.translations[0].translatedText;
    
    console.log(`Translation success. Result: "${translatedText.substring(0, 50)}${translatedText.length > 50 ? '...' : ''}"`);
    
    return new Response(
      JSON.stringify({ translatedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in translate function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
