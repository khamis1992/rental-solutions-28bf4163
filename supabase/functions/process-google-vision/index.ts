import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GoogleVisionRequest {
  imageBase64: string;
  maxResults?: number;
  languageHints?: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const { imageBase64, maxResults = 1, languageHints = ['ar', 'en'] }: GoogleVisionRequest = await req.json();
    
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Image data is required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('🔍 Processing image with Google Vision...');

    // Get Google Vision API key from environment
    const googleVisionApiKey = Deno.env.get('GOOGLE_VISION_API_KEY');
    
    if (!googleVisionApiKey) {
      console.error('❌ Google Vision API Key not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Google Vision API not configured' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const startTime = Date.now();

    // Clean base64 string
    let cleanBase64 = imageBase64;
    if (imageBase64.startsWith('data:')) {
      cleanBase64 = imageBase64.split(',')[1];
    }

    // Prepare Google Vision API request
    const requestBody = {
      requests: [{
        image: { content: cleanBase64 },
        features: [
          { type: 'TEXT_DETECTION', maxResults },
          { type: 'DOCUMENT_TEXT_DETECTION', maxResults }
        ],
        imageContext: {
          languageHints
        }
      }]
    };

    // Call Google Vision API
    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${googleVisionApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Google Vision API Error:', errorText);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Google Vision API request failed',
          details: errorText
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const result = await response.json();
    const processingTime = Date.now() - startTime;
    
    if (result.responses?.[0]?.error) {
      console.error('❌ Vision API Error:', result.responses[0].error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Vision API Error: ${result.responses[0].error.message}` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const extractedText = result.responses?.[0]?.fullTextAnnotation?.text || 
                          result.responses?.[0]?.textAnnotations?.[0]?.description || '';
    
    if (!extractedText || typeof extractedText !== 'string' || extractedText.trim().length === 0) {
      console.warn('❌ No valid text extracted from image');
      return new Response(JSON.stringify({
        success: false,
        error: 'No text detected in image',
        data: {
          text: '',
          confidence: 0
        },
        processingTime
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cleanedText = extractedText.trim();
    console.log(`✅ Google Vision OCR completed in ${processingTime}ms`);
    console.log(`✅ Extracted text length: ${cleanedText.length} characters`);
    console.log(`✅ First 200 chars: ${cleanedText.substring(0, 200)}...`);

    return new Response(JSON.stringify({
      success: true,
      data: {
        text: cleanedText,
        confidence: 0.9
      },
      processingTime
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in Google Vision processing:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Google Vision processing failed',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
