
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, createSuccessResponse, createErrorResponse } from './core.ts';
import { validateTrafficFine, validateTrafficFinesBatch } from './validation.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  
  try {
    if (req.method !== 'POST') {
      return createErrorResponse('Method not allowed', 405);
    }

    // Parse request body
    const requestData = await req.json();
    
    // Check if this is a test request
    if (requestData.test === true) {
      console.log("Received test request, responding with success");
      return createSuccessResponse({ 
        status: "available", 
        message: "Edge function is running properly",
        environment: Deno.env.get("DEVELOPMENT_MODE") === "true" ? "development" : "production"
      });
    }
    
    // Check if this is a single validation or batch request
    if (Array.isArray(requestData.licensePlates)) {
      // Batch validation - limited to 10 plates maximum for performance
      try {
        const batchResults = await validateTrafficFinesBatch(requestData.licensePlates);
        return createSuccessResponse(batchResults);
      } catch (error) {
        return createErrorResponse(
          error instanceof Error ? error.message : 'Failed to process batch validation',
          400
        );
      }
    } else {
      // Single validation
      const { licensePlate } = requestData;
      
      if (!licensePlate) {
        return createErrorResponse('License plate is required', 400);
      }

      try {
        const validationResult = await validateTrafficFine(licensePlate);
        console.log(`Validation completed for ${licensePlate}. Result: ${validationResult.hasFine ? 'Fine found' : 'No fine found'}`);
        return createSuccessResponse(validationResult);
      } catch (error) {
        return createErrorResponse(
          `Failed to validate license plate ${licensePlate}: ${error instanceof Error ? error.message : String(error)}`,
          500
        );
      }
    }
  } catch (error) {
    console.error('Error in request handling:', error);
    return createErrorResponse(error instanceof Error ? error.message : 'An unexpected error occurred');
  }
});
