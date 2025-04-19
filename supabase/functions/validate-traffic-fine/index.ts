
// validate-traffic-fine edge function
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Handle CORS preflight requests
function handleCORS(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    });
  }
  return null;
}

serve(async (req: Request) => {
  // Handle CORS
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  try {
    // Parse request body
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const requestData = await req.json();
    const { licensePlate } = requestData;

    if (!licensePlate) {
      return new Response(JSON.stringify({ error: 'License plate is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // In a real implementation, this would connect to an external API
    // For demo purposes, generate a random result
    const hasFine = Math.random() > 0.6;
    let result = {
      licensePlate,
      validationDate: new Date().toISOString(),
      validationSource: 'MOI Qatar Database',
      hasFine,
      fineDetails: null
    };

    if (hasFine) {
      result.fineDetails = {
        violationType: ['Speeding', 'Red Light', 'Illegal Parking', 'No Parking Zone'][Math.floor(Math.random() * 4)],
        amount: Math.floor(Math.random() * 1000) + 100,
        location: ['Corniche Road', 'Al Waab Street', 'C Ring Road', 'Airport Road'][Math.floor(Math.random() * 4)],
        date: new Date().toISOString(),
        violationDate: new Date().toISOString(),
        locationCode: ['A123', 'B456', 'C789', 'D012'][Math.floor(Math.random() * 4)]
      };
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in validate-traffic-fine function:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
