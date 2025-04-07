
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { licensePlate } = await req.json();

    if (!licensePlate) {
      return new Response(JSON.stringify({ error: 'License plate is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Return mock result for now since actual web automation requires more complex setup
    // In production, this would be replaced with actual web scraping logic
    console.log(`Validation requested for license plate: ${licensePlate}`);
    
    // Simulate validation delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock validation result - randomly return found/not found
    const hasFine = Math.random() > 0.5;
    const violationTypes = [
      "Speed violation", 
      "Illegal parking", 
      "Red light violation", 
      "Driving in emergency lane",
      "Illegal turn"
    ];
    const locationCodes = ["D45", "A12", "B37", "C55", "E23"];
    
    return new Response(
      JSON.stringify({
        success: true,
        result: {
          success: true,
          licensePlate,
          hasFine,
          validationDate: new Date().toISOString(),
          validationSource: "MOI Qatar",
          // If fine found, add some mock details
          ...(hasFine ? {
            fineDetails: {
              amount: Math.floor(Math.random() * 500) + 100,
              violationDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
              violationType: violationTypes[Math.floor(Math.random() * violationTypes.length)],
              locationCode: locationCodes[Math.floor(Math.random() * locationCodes.length)]
            }
          } : {})
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in validate-traffic-fine function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
