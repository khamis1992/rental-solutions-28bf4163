
import { ValidationResult, extractTextBetween } from './core.ts';
import { solveCaptcha } from './captcha.ts';

/**
 * Production implementation of traffic fine validation
 * This contains the actual web scraping logic for the production system
 */
export async function productionTrafficFineValidation(licensePlate: string): Promise<ValidationResult> {
  console.log(`[PROD] Starting web scraping for license plate: ${licensePlate}`);
  
  try {
    // Check if we have the required API key for captcha
    const captchaApiKey = Deno.env.get("CAPTCHA_API_KEY");
    if (!captchaApiKey) {
      console.error("CAPTCHA_API_KEY not configured in Supabase secrets");
      throw new Error("Missing CAPTCHA_API_KEY configuration in environment");
    }
    
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
        console.log("CAPTCHA detected:", captchaImage);
        
        // Get the full CAPTCHA image URL if it's a relative path
        const captchaUrl = captchaImage.startsWith('http') 
          ? captchaImage 
          : `https://fees2.moi.gov.qa${captchaImage}`;
        
        console.log("Full CAPTCHA URL:", captchaUrl);
        
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
        
        console.log("CAPTCHA image converted to base64, length:", captchaBase64.length);
        
        // Use CAPTCHA solving service
        console.log("Sending CAPTCHA to 2Captcha service");
        const captchaSolution = await solveCaptcha(captchaDataUrl, captchaApiKey);
        formData.append('captcha', captchaSolution);
        
        console.log("CAPTCHA solved successfully:", captchaSolution);
      }
    } catch (captchaError) {
      console.error("Error processing CAPTCHA:", captchaError);
      throw new Error(`CAPTCHA processing failed: ${captchaError.message}`);
    }
    
    // 6. Submit form to search for violations
    console.log("Submitting search request to MOI website");
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
        const amountText = extractTextBetween(responseHtml, 'القيمة الاجمالية', '</td>').trim();
        const violationDate = extractTextBetween(responseHtml, 'تاريخ المخالفة', '</td>').trim();
        const violationNumber = extractTextBetween(responseHtml, 'رقم المخالفة', '</td>').trim();
        
        details = `Fine found: Amount: ${amountText || 'Unknown'}, Date: ${violationDate || 'Unknown'}, Reference: ${violationNumber || 'Unknown'}`;
        console.log("Fine details extracted:", details);
      } catch (detailsError) {
        console.error("Error extracting fine details:", detailsError);
        details = 'Fine found in the system, but details could not be extracted';
      }
    }
    
    console.log(`[PROD] Completed validation for ${licensePlate} with result: ${hasFine ? 'Fine found' : 'No fine found'}`);
    
    return {
      licensePlate,
      validationDate: new Date(),
      validationSource: 'MOI Traffic System',
      hasFine,
      details,
      environment: 'production'
    };
  } catch (error) {
    console.error('[PROD] Error during web scraping:', error);
    throw new Error(`Web scraping failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
