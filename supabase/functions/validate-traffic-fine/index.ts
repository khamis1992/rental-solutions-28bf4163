
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Mock function to simulate validation against MOI website
// In production, this would be replaced with actual web scraping logic
async function mockValidateTrafficFine(licensePlate: string) {
  // Simulate API delay
  await delay(1500);
  
  // Generate deterministic result based on license plate
  // This is just for testing - would be replaced with actual validation logic
  const hasEvenDigits = licensePlate.split('').filter(char => !isNaN(parseInt(char)))
    .reduce((sum, digit) => sum + parseInt(digit), 0) % 2 === 0;
    
  return {
    licensePlate,
    validationDate: new Date(),
    validationSource: 'MOI Traffic System',
    hasFine: hasEvenDigits, // Deterministic but arbitrary result for testing
    details: hasEvenDigits 
      ? 'Fine found in the system according to MOI website' 
      : 'No fines found for this vehicle in MOI system'
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 405 
      });
    }

    // Parse request body
    const { licensePlate } = await req.json();
    
    if (!licensePlate) {
      return new Response(JSON.stringify({ error: 'License plate is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // TODO: Replace this mock validation with actual web scraping logic
    // In a real implementation, this would:
    // 1. Access the MOI website
    // 2. Fill out the form with the provided data
    // 3. Handle CAPTCHA verification
    // 4. Parse the results
    const validationResult = await mockValidateTrafficFine(licensePlate);
    
    console.log(`Validation completed for ${licensePlate}. Result: ${validationResult.hasFine ? 'Fine found' : 'No fine found'}`);
    
    return new Response(JSON.stringify(validationResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
    
  } catch (error) {
    console.error('Error validating traffic fine:', error);
    
    return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
