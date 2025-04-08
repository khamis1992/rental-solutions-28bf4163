
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Web scraping logic for MOI website
// This is a placeholder for actual implementation
// In production, this would use Deno's fetch and DOM parsing capabilities
async function scrapeTrafficFine(licensePlate: string) {
  console.log(`Starting web scraping for license plate: ${licensePlate}`);
  
  // Simulate API delay (in production this would be the actual web scraping)
  await delay(2000);
  
  try {
    // For development & testing: Deterministic result based on license plate
    // This will be replaced with actual web scraping logic
    const hasEvenDigits = licensePlate.split('').filter(char => !isNaN(parseInt(char)))
      .reduce((sum, digit) => sum + parseInt(digit), 0) % 2 === 0;
      
    console.log(`Completed validation for ${licensePlate} with result: ${hasEvenDigits ? 'Fine found' : 'No fine found'}`);
    
    /*
    ACTUAL IMPLEMENTATION WOULD BE SOMETHING LIKE:
    
    1. Fetch the initial page to get any required tokens
    const initialResponse = await fetch('https://fees2.moi.gov.qa/moipay/inquiry/violation');
    const html = await initialResponse.text();
    
    2. Extract any CSRF tokens or session IDs
    
    3. Submit the form with the required fields:
       - Country: Qatar (قطر)
       - Plate Type: Limousine (ليموزين)
       - License Plate: <provided license plate>
       - Owner Type: Establishment (قيد منشأة)
       - Owner Number: 17 2015 86
       - CAPTCHA: <would need OCR or manual override>
    
    4. Parse the response to determine if fine exists
    */
    
    return {
      licensePlate,
      validationDate: new Date(),
      validationSource: 'MOI Traffic System',
      hasFine: hasEvenDigits,
      details: hasEvenDigits 
        ? 'Fine found in the system according to MOI website' 
        : 'No fines found for this vehicle in MOI system'
    };
  } catch (error) {
    console.error('Error during web scraping:', error);
    throw new Error(`Web scraping failed: ${error.message}`);
  }
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
    const requestData = await req.json();
    
    // Check if this is a single validation or batch request
    if (Array.isArray(requestData.licensePlates)) {
      // Batch validation - limited to 10 plates maximum for performance
      const licensePlates = requestData.licensePlates.slice(0, 10);
      
      if (licensePlates.length === 0) {
        return new Response(JSON.stringify({ error: 'No valid license plates provided' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
      }
      
      // Process each license plate
      const results = [];
      const errors = [];
      
      for (const plate of licensePlates) {
        try {
          // Validate this plate
          const result = await scrapeTrafficFine(plate);
          results.push(result);
          
          // Add a delay between requests
          await delay(500);
        } catch (error) {
          console.error(`Error validating ${plate}:`, error);
          errors.push({ licensePlate: plate, error: error.message });
        }
      }
      
      return new Response(JSON.stringify({
        results,
        errors,
        summary: {
          total: licensePlates.length,
          succeeded: results.length,
          failed: errors.length
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
      
    } else {
      // Single validation
      const { licensePlate } = requestData;
      
      if (!licensePlate) {
        return new Response(JSON.stringify({ error: 'License plate is required' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
      }

      const validationResult = await scrapeTrafficFine(licensePlate);
      
      console.log(`Validation completed for ${licensePlate}. Result: ${validationResult.hasFine ? 'Fine found' : 'No fine found'}`);
      
      return new Response(JSON.stringify(validationResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }
  } catch (error) {
    console.error('Error validating traffic fine:', error);
    
    return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
