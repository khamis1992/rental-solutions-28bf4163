
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

interface RecommendationRequest {
  customerId: string;
  rentalDuration?: number; // in days
  preferredAttributes?: {
    size?: string;
    type?: string;
    priceRange?: string;
    features?: string[];
  }
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

    const { customerId, rentalDuration, preferredAttributes } = await req.json() as RecommendationRequest

    // Get customer profile and rental history
    const { data: customerData, error: customerError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', customerId)
      .single()

    if (customerError) {
      throw new Error(`Error fetching customer data: ${customerError.message}`)
    }

    // Get customer's rental history
    const { data: rentalHistory, error: historyError } = await supabaseClient
      .from('leases')
      .select(`
        *,
        vehicles:vehicles(*)
      `)
      .eq('customer_id', customerId)

    // Get available vehicles
    const { data: availableVehicles, error: vehicleError } = await supabaseClient
      .from('vehicles')
      .select('*')
      .eq('status', 'available')

    if (vehicleError) {
      throw new Error(`Error fetching available vehicles: ${vehicleError.message}`)
    }

    // Prepare context for DeepSeek
    const context = {
      customer: customerData,
      rentalHistory: rentalHistory || [],
      availableVehicles,
      rentalDuration,
      preferredAttributes
    }

    // Call DeepSeek API for vehicle recommendations
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
            content: "You are a vehicle recommendation specialist. Based on the customer's profile, rental history, and preferences, recommend the most suitable vehicles from the available fleet. Return a JSON object with the following structure: { recommendations: [{ vehicleId: string, score: number, reasoning: string }], customerInsights: string }"
          },
          {
            role: "user",
            content: JSON.stringify(context)
          }
        ],
        temperature: 0.2,
        max_tokens: 2000
      })
    })

    const aiResponse = await deepseekResponse.json()

    // Store recommendation in database
    const { data: recommendationData, error: recommendationError } = await supabaseClient
      .from('ai_recommendations')
      .insert({
        customer_id: customerId,
        recommendation_type: 'vehicle',
        content: aiResponse,
        preferred_attributes: preferredAttributes,
        status: 'completed'
      })
      .select()
      .single()

    if (recommendationError) {
      throw new Error(`Error storing recommendation: ${recommendationError.message}`)
    }

    return new Response(
      JSON.stringify(recommendationData),
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
