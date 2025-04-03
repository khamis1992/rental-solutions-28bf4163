
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Handles CORS preflight requests
const handleCors = (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }
  return null;
};

// Define the expected structure of the request body
interface TranslateRequest {
  text: string | string[];
  targetLanguage: string;
  sourceLanguage?: string;
}

// Set up Google Translation API
const GOOGLE_TRANSLATE_API_KEY = Deno.env.get('GOOGLE_TRANSLATE_API_KEY');
const GOOGLE_TRANSLATE_URL = 'https://translation.googleapis.com/language/translate/v2';

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  // Validate API key is available
  if (!GOOGLE_TRANSLATE_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'Google Translate API key not configured' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Get request body
    const { text, targetLanguage, sourceLanguage = 'en' } = await req.json() as TranslateRequest;
    
    // Validate request parameters
    if (!text || !targetLanguage) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: text or targetLanguage' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Format text for the API (handles both strings and arrays)
    const textArray = Array.isArray(text) ? text : [text];
    
    // Call Google Translate API
    const url = new URL(GOOGLE_TRANSLATE_URL);
    url.searchParams.append('key', GOOGLE_TRANSLATE_API_KEY);
    
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: textArray,
        target: targetLanguage,
        source: sourceLanguage,
        format: 'text',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Translation API error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Translation API error', details: errorData }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const data = await response.json();
    
    // Process and return the translations
    const translations = data.data.translations.map((t: any) => t.translatedText);
    
    return new Response(
      JSON.stringify({ 
        translations: Array.isArray(text) ? translations : translations[0],
        source: sourceLanguage,
        target: targetLanguage
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('Error processing translation request:', error);
    return new Response(
      JSON.stringify({ error: 'Error processing translation request', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
