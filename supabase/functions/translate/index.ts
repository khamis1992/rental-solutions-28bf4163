
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

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  console.log("Translation request received");

  try {
    // Get request body
    let body;
    try {
      body = await req.json();
      console.log("Request body parsed:", JSON.stringify(body));
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    const { text, targetLanguage, sourceLanguage = 'en' } = body as TranslateRequest;
    
    // Validate request parameters
    if (!text || !targetLanguage) {
      console.error("Missing required parameters:", { text, targetLanguage });
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
    console.log(`Translating ${textArray.length} items from ${sourceLanguage} to ${targetLanguage}`);
    
    // Use LibreTranslate API (open source alternative)
    const url = 'https://translate.fedilab.app/translate';
    
    const translations = [];
    for (const item of textArray) {
      console.log(`Translating text: "${item}"`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: item,
          source: sourceLanguage,
          target: targetLanguage,
          format: 'text',
        }),
      });

      if (!response.ok) {
        console.error('Translation API error:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error details:', errorText);
        throw new Error(`Translation API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Translation result:", data);
      translations.push(data.translatedText);
    }
    
    const result = { 
      translations: Array.isArray(text) ? translations : translations[0],
      source: sourceLanguage,
      target: targetLanguage
    };
    console.log(`Returning ${translations.length} translated items`);
    
    return new Response(
      JSON.stringify(result),
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
