
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// We'll use an alternative approach without deno_dom to avoid the installation issues
import { corsHeaders } from '../../lib/cors.ts';

import { delay, scrapeTrafficFine } from "../../services/traffic.ts";


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
    
    // Check if this is a test request
    if (requestData.test === true) {
      console.log("Received test request, responding with success");
      return new Response(JSON.stringify({ 
        status: "available", 
        message: "Edge function is running properly" 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }
    
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
