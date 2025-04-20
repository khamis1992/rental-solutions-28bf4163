
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

interface AnalysisRequest {
  agreementId: string;
  analysisType: 'status_recommendation' | 'payment_prediction' | 'risk_assessment' | 'vehicle_recommendation' | 'agreement_health';
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

    // Get agreement data with more details for comprehensive analysis
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

    // For payment prediction, fetch payment history
    let paymentHistory = null
    if (analysisType === 'payment_prediction' || analysisType === 'risk_assessment') {
      const { data: payments, error: paymentsError } = await supabaseClient
        .from('unified_payments')
        .select('*')
        .eq('lease_id', agreementId)
        .order('due_date', { ascending: true })

      if (!paymentsError) {
        paymentHistory = payments
      }
    }

    // For vehicle recommendation, fetch vehicle fleet
    let fleetData = null
    if (analysisType === 'vehicle_recommendation') {
      const { data: fleet, error: fleetError } = await supabaseClient
        .from('vehicles')
        .select('*')
        .eq('status', 'available')

      if (!fleetError) {
        fleetData = fleet
      }
    }

    // Get customer history for better context
    let customerHistory = null
    if (agreement.customer_id) {
      const { data: customerLeases, error: customerLeasesError } = await supabaseClient
        .from('leases')
        .select('id, start_date, end_date, status')
        .eq('customer_id', agreement.customer_id)
        .neq('id', agreementId)

      if (!customerLeasesError) {
        customerHistory = customerLeases
      }
    }

    // Generate system prompt based on analysis type
    let systemPrompt = 'You are an AI assistant analyzing rental agreements. Provide insights based on the agreement data.'
    const today = new Date().toISOString().split('T')[0]
    
    switch(analysisType) {
      case 'status_recommendation':
        systemPrompt = `You are a rental agreement analysis specialist. Based on the agreement data provided, recommend the optimal status for this agreement. Consider the payment history, rental duration, and current status. Today's date is ${today}. Return a JSON object with fields: recommendedStatus (string), confidence (number 0-1), reasoning (string), and actionItems (array of strings).`
        break
      case 'payment_prediction':
        systemPrompt = `You are a financial analyst specializing in rental payment predictions. Analyze the customer's payment history and predict the likelihood of on-time payments for the remaining term of this agreement. Consider payment patterns, delays, and customer history. Today's date is ${today}. Return a JSON object with fields: paymentRiskLevel (string: 'low', 'medium', 'high'), onTimePaymentProbability (number 0-1), reasoning (string), and recommendedActions (array of strings).`
        break
      case 'risk_assessment':
        systemPrompt = `You are a risk assessment specialist for vehicle rentals. Evaluate the overall risk level of this agreement based on customer profile, payment history, vehicle details, and rental terms. Today's date is ${today}. Return a JSON object with fields: overallRiskScore (number 0-100), riskLevel (string: 'low', 'moderate', 'high', 'critical'), keyRiskFactors (array of strings), and mitigationRecommendations (array of strings).`
        break
      case 'vehicle_recommendation':
        systemPrompt = `You are a vehicle matching specialist. Based on the customer's profile and rental history, recommend the most suitable vehicles from the available fleet. Consider customer preferences, previous rentals, and optimal vehicle characteristics. Today's date is ${today}. Return a JSON object with fields: recommendedVehicles (array of vehicle IDs), reasoningPerVehicle (object mapping vehicle ID to reasoning string), and customerPreferenceSummary (string).`
        break
      case 'agreement_health':
        systemPrompt = `You are a rental agreement health analyst. Evaluate the overall health and compliance of this agreement. Check for any missing information, potential legal issues, or contractual anomalies. Today's date is ${today}. Return a JSON object with fields: healthScore (number 0-100), compliance (boolean), issues (array of strings), and recommendations (array of strings).`
        break
    }

    // Prepare context for DeepSeek
    const context = {
      agreement,
      analysisType,
      additionalContent: content,
      paymentHistory,
      fleetData,
      customerHistory,
      currentDate: today
    }

    // Call DeepSeek API with enhanced prompting
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
            content: systemPrompt
          },
          {
            role: "user",
            content: JSON.stringify(context)
          }
        ],
        temperature: 0.4, // Lower temperature for more consistent, predictable outputs
        max_tokens: 2000
      })
    })

    const aiResponse = await deepseekResponse.json()
    
    // Calculate confidence score based on response
    let confidenceScore = 0.85 // Default
    try {
      // Try to extract confidence from JSON response if available
      const responseContent = aiResponse.choices[0].message.content
      const parsedResponse = JSON.parse(responseContent)
      if (analysisType === 'status_recommendation' && parsedResponse.confidence) {
        confidenceScore = parsedResponse.confidence
      } else if (analysisType === 'payment_prediction' && parsedResponse.onTimePaymentProbability) {
        confidenceScore = parsedResponse.onTimePaymentProbability
      } else if (analysisType === 'risk_assessment' && parsedResponse.overallRiskScore) {
        confidenceScore = parsedResponse.overallRiskScore / 100 // Convert 0-100 scale to 0-1
      } else if (analysisType === 'agreement_health' && parsedResponse.healthScore) {
        confidenceScore = parsedResponse.healthScore / 100 // Convert 0-100 scale to 0-1
      }
    } catch (e) {
      console.log('Could not parse AI response as JSON, using default confidence score')
    }

    // Store analysis result
    const { data: analysisData, error: analysisError } = await supabaseClient
      .from('ai_analysis')
      .insert({
        agreement_id: agreementId,
        analysis_type: analysisType,
        content: aiResponse,
        status: 'completed',
        confidence_score: confidenceScore
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
