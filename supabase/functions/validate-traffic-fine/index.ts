
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// We'll use an alternative approach without deno_dom to avoid the installation issues

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Simple HTML parsing function since we can't use deno_dom
function extractTextBetween(html: string, startMarker: string, endMarker: string): string {
  const startIndex = html.indexOf(startMarker);
  if (startIndex === -1) return '';
  
  const contentStartIndex = startIndex + startMarker.length;
  const endIndex = html.indexOf(endMarker, contentStartIndex);
  if (endIndex === -1) return '';
  
  return html.substring(contentStartIndex, endIndex).trim();
}

// External CAPTCHA solving service integration
async function solveCaptcha(imageUrl: string, apiKey: string): Promise<string> {
  try {
    console.log(`Attempting to solve CAPTCHA from image URL: ${imageUrl}`);
    
    // Implementation for a popular CAPTCHA solving service (2Captcha as an example)
    // Note: This is a simplified version and would need to be completed with actual service details
    const response = await fetch('https://2captcha.com/in.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        key: apiKey,
        method: 'base64',
        body: imageUrl.replace(/^data:image\/\w+;base64,/, ''),
        json: '1',
      }),
    });
    
    const jsonResponse = await response.json();
    if (!jsonResponse || !jsonResponse.request) {
      throw new Error('Failed to submit CAPTCHA');
    }
    
    const requestId = jsonResponse.request;
    console.log(`CAPTCHA submitted, request ID: ${requestId}`);
    
    // Wait for the CAPTCHA to be solved (polling)
    let attempts = 0;
    const maxAttempts = 30;
    while (attempts < maxAttempts) {
      await delay(5000); // Wait 5 seconds between each check
      attempts++;
      
      const resultResponse = await fetch(`https://2captcha.com/res.php?key=${apiKey}&action=get&id=${requestId}&json=1`);
      const resultJson = await resultResponse.json();
      
      if (resultJson.status === 1) {
        console.log('CAPTCHA solved successfully');
        return resultJson.request;
      } else if (resultJson.request !== 'CAPCHA_NOT_READY') {
        throw new Error(`CAPTCHA solving failed: ${resultJson.request}`);
      }
      
      console.log(`Waiting for CAPTCHA solution, attempt ${attempts}/${maxAttempts}`);
    }
    
    throw new Error('CAPTCHA solving timeout');
  } catch (error) {
    console.error('Error solving CAPTCHA:', error);
    throw error;
  }
}

// Web scraping logic for MOI website
async function scrapeTrafficFine(licensePlate: string) {
  console.log(`Starting web scraping for license plate: ${licensePlate}`);
  
  try {
    // Set isDev to false to use the real MOI system
    const isDev = false; // Changed to false to use real implementation
    
    if (isDev) {
      // Simulate API delay
      await delay(2000);
      
      // Deterministic result based on license plate for testing
      const hasEvenDigits = licensePlate.split('').filter(char => !isNaN(parseInt(char)))
        .reduce((sum, digit) => sum + parseInt(digit), 0) % 2 === 0;
        
      console.log(`Completed validation for ${licensePlate} with result: ${hasEvenDigits ? 'Fine found' : 'No fine found'}`);
      
      return {
        licensePlate,
        validationDate: new Date(),
        validationSource: 'MOI Traffic System (Simulated)',
        hasFine: hasEvenDigits,
        details: hasEvenDigits 
          ? 'Fine found in the system according to MOI website' 
          : 'No fines found for this vehicle in MOI system'
      };
    } else {
      // PRODUCTION IMPLEMENTATION
      console.log("Starting actual MOI website request");
      
      // 1. Initial request to get the session and CSRF tokens
      const initialResponse = await fetch('https://fees2.moi.gov.qa/moipay/inquiry/violation', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!initialResponse.ok) {
        throw new Error(`Failed to access MOI website: ${initialResponse.status} ${initialResponse.statusText}`);
      }
      
      const html = await initialResponse.text();
      console.log("Initial request successful, extracting tokens");
      
      // 2. Extract cookies from the response
      const cookies = initialResponse.headers.get('set-cookie')?.split(',') || [];
      
      // 3. Extract CSRF token from the HTML
      const csrfToken = extractTextBetween(html, 'name="_csrf" value="', '"');
      
      if (!csrfToken) {
        throw new Error("Could not find CSRF token in the response");
      }
      
      console.log("Found CSRF token, preparing form submission");
      
      // 4. Prepare form data for submission
      const formData = new URLSearchParams();
      formData.append('country', 'قطر'); // Qatar
      formData.append('plateType', 'ليموزين'); // Limousine
      formData.append('licensePlate', licensePlate);
      formData.append('ownerType', 'قيد منشأة'); // Establishment
      formData.append('ownerNumber', '17 2015 86');
      formData.append('_csrf', csrfToken);
      
      // 5. Handle CAPTCHA if required
      try {
        const captchaImage = extractTextBetween(html, 'captcha-image" src="', '"');
        if (captchaImage) {
          console.log("CAPTCHA detected, attempting to solve");
          
          // Get the full CAPTCHA image URL if it's a relative path
          const captchaUrl = captchaImage.startsWith('http') 
            ? captchaImage 
            : `https://fees2.moi.gov.qa${captchaImage}`;
          
          // Retrieve the CAPTCHA image
          const captchaResponse = await fetch(captchaUrl, {
            headers: {
              'Cookie': cookies.join('; '),
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });
          
          if (!captchaResponse.ok) {
            throw new Error(`Failed to fetch CAPTCHA image: ${captchaResponse.status}`);
          }
          
          // Convert the CAPTCHA image to Base64
          const captchaBuffer = await captchaResponse.arrayBuffer();
          const captchaBase64 = btoa(String.fromCharCode(...new Uint8Array(captchaBuffer)));
          const captchaDataUrl = `data:image/jpeg;base64,${captchaBase64}`;
          
          // Use CAPTCHA solving service
          // Note: You would need to set up the CAPTCHA API key in your Supabase secrets
          // Get CAPTCHA API key from environment
          const captchaApiKey = Deno.env.get("CAPTCHA_API_KEY") || "";
          if (!captchaApiKey) {
            throw new Error("CAPTCHA API key not configured in environment");
          }
          
          const captchaSolution = await solveCaptcha(captchaDataUrl, captchaApiKey);
          formData.append('captcha', captchaSolution);
          
          console.log("CAPTCHA solved, proceeding with form submission");
        }
      } catch (captchaError) {
        console.error("Error processing CAPTCHA:", captchaError);
        throw new Error(`CAPTCHA processing failed: ${captchaError.message}`);
      }
      
      // 6. Submit form to search for violations
      console.log("Submitting search request");
      const response = await fetch('https://fees2.moi.gov.qa/moipay/inquiry/violation/search', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': cookies.join('; '),
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Referer': 'https://fees2.moi.gov.qa/moipay/inquiry/violation'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Form submission failed: ${response.status} ${response.statusText}`);
      }
      
      // 7. Parse the response to determine if fine exists
      const responseHtml = await response.text();
      console.log("Search completed, analyzing results");
      
      // Look for indicators of existing fines in the response
      const hasFine = responseHtml.includes('القيمة الاجمالية') || // Total amount in Arabic
                      responseHtml.includes('Total Amount') ||
                      responseHtml.includes('رقم المخالفة') || // Violation number in Arabic
                      responseHtml.includes('Violation Number');
                      
      // Extract fine details if available
      let details = 'No fines found for this vehicle in MOI system';
      
      if (hasFine) {
        try {
          // Extract fine amount
          const amountText = extractTextBetween(responseHtml, 'القيمة الاجمالية', '</td>');
          const violationDate = extractTextBetween(responseHtml, 'تاريخ المخالفة', '</td>');
          
          details = `Fine found: Amount: ${amountText || 'Unknown'}, Date: ${violationDate || 'Unknown'}`;
        } catch (detailsError) {
          console.error("Error extracting fine details:", detailsError);
          details = 'Fine found in the system, but details could not be extracted';
        }
      }
      
      console.log(`Completed validation for ${licensePlate} with result: ${hasFine ? 'Fine found' : 'No fine found'}`);
      
      return {
        licensePlate,
        validationDate: new Date(),
        validationSource: 'MOI Traffic System',
        hasFine,
        details
      };
    }
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
