import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OpenAIRequest {
  prompt: string;
  systemPrompt?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
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
      prompt, 
      systemPrompt = 'You are a helpful AI assistant.',
      model = 'gpt-4o-mini',
      maxTokens = 1000,
      temperature = 0.7
    }: OpenAIRequest = await req.json()

    if (!prompt) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Prompt is required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get OpenAI API key from environment
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    
    if (!openAIApiKey) {
      console.error('❌ OpenAI API key not configured')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'OpenAI API not configured' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('🤖 Processing request with OpenAI API...')

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: maxTokens,
        temperature: temperature
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ OpenAI API error:', errorText)
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'OpenAI API request failed',
          details: errorText
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const data = await response.json()
    
    if (!data.choices || data.choices.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No response from OpenAI API' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let generatedText = data.choices[0].message.content
    console.log('✅ Raw OpenAI response:', generatedText)

    // Fix markdown parsing - remove code blocks if present
    if (generatedText && typeof generatedText === 'string') {
      // Remove markdown code blocks (```json...``` or ```...```)
      generatedText = generatedText.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, '$1')
      // Clean up any extra whitespace
      generatedText = generatedText.trim()
      console.log('✅ Cleaned OpenAI response:', generatedText)
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        data: {
          text: generatedText,
          usage: data.usage,
          model: data.model
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Error processing OpenAI request:', error)
    
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