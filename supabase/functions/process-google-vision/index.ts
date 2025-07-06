import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GoogleVisionRequest {
  imageBase64: string;
  maxResults?: number;
  languageHints?: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    })
  }

  try {
    const { 
      imageBase64, 
      maxResults = 1,
      languageHints = ['ar', 'en']
    }: GoogleVisionRequest = await req.json()

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
      )
    }

    // Get Google Vision API key from environment
    const googleVisionApiKey = Deno.env.get('GOOGLE_VISION_API_KEY')
    
    if (!googleVisionApiKey) {
      console.error('❌ Google Vision API key not configured')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Google Vision API not configured' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('🔍 Processing image with Google Vision API...')

    // Clean base64 data
    const cleanImageData = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '')

    const requestPayload = {
      requests: [
        {
          image: {
            content: cleanImageData
          },
          features: [
            {
              type: 'DOCUMENT_TEXT_DETECTION',
              maxResults: maxResults
            }
          ],
          imageContext: {
            languageHints: languageHints
          }
        }
      ]
    }

    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${googleVisionApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Google Vision API error:', errorText)
      
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
      )
    }

    const result = await response.json()
    const responseData = result.responses?.[0]
    
    if (!responseData?.textAnnotations || responseData.textAnnotations.length === 0) {
      console.log('⚠️ No text detected in image')
      return new Response(
        JSON.stringify({ 
          success: true,
          data: {
            text: '',
            fullTextAnnotation: null,
            hasText: false
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const fullText = responseData.textAnnotations[0]?.description || ''
    console.log('✅ Text extracted successfully, length:', fullText.length)

    return new Response(
      JSON.stringify({ 
        success: true,
        data: {
          text: fullText,
          fullTextAnnotation: responseData.fullTextAnnotation,
          hasText: fullText.length > 0,
          confidence: responseData.fullTextAnnotation?.pages?.[0]?.confidence || 0.9
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Error processing Google Vision request:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})