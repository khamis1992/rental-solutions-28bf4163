
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

interface AnalysisRequest {
  agreementId: string;
  analysisType: 'status_recommendation' | 'payment_prediction' | 'risk_assessment';
  content?: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { agreementId, analysisType, content } = await req.json() as AnalysisRequest

    // Get agreement data
    const { data: agreement, error: agreementError } = await supabaseClient
      .from('leases')
      .select(`
        *,
        customers:profiles(*),
        vehicles:vehicles(*)
      `)
      .eq('id', agreementId)
      .single()

    if (agreementError) {
      throw new Error(`Error fetching agreement: ${agreementError.message}`)
    }

    // Prepare context for DeepSeek
    const context = {
      agreement,
      analysisType,
      additionalContent: content
    }

    // Call DeepSeek API
    const deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('DEEPSEEK_API_KEY')}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are an AI assistant analyzing rental agreements. Provide insights and recommendations based on the agreement data."
          },
          {
            role: "user",
            content: JSON.stringify(context)
          }
        ],
        temperature: 0.7
      })
    })

    const aiResponse = await deepseekResponse.json()

    // Store analysis result
    const { data: analysisData, error: analysisError } = await supabaseClient
      .from('ai_analysis')
      .insert({
        agreement_id: agreementId,
        analysis_type: analysisType,
        content: aiResponse,
        status: 'completed',
        confidence_score: 0.85 // This would be calculated based on the AI response
      })
      .select()
      .single()

    if (analysisError) {
      throw new Error(`Error storing analysis: ${analysisError.message}`)
    }

    return new Response(
      JSON.stringify(analysisData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
