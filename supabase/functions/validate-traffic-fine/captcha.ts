
import { delay } from './core.ts';

/**
 * Production CAPTCHA solver implementation
 */
export async function solveCaptcha(imageUrl: string, apiKey: string): Promise<string> {
  try {
    console.log(`Attempting to solve CAPTCHA from image URL`);
    
    // First submit the CAPTCHA to 2captcha service
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
    console.log('2captcha submit response:', jsonResponse);
    
    if (!jsonResponse || jsonResponse.status !== 1 || !jsonResponse.request) {
      throw new Error(`Failed to submit CAPTCHA: ${JSON.stringify(jsonResponse)}`);
    }
    
    const requestId = jsonResponse.request;
    console.log(`CAPTCHA submitted successfully, request ID: ${requestId}`);
    
    // Wait for the CAPTCHA to be solved (polling)
    let attempts = 0;
    const maxAttempts = 30;
    while (attempts < maxAttempts) {
      await delay(5000); // Wait 5 seconds between each check
      attempts++;
      
      console.log(`Checking CAPTCHA solution, attempt ${attempts}/${maxAttempts}`);
      const resultResponse = await fetch(`https://2captcha.com/res.php?key=${apiKey}&action=get&id=${requestId}&json=1`);
      
      if (!resultResponse.ok) {
        console.error('Error response from 2captcha:', resultResponse.status, resultResponse.statusText);
        continue;
      }
      
      const resultJson = await resultResponse.json();
      console.log('2captcha result response:', resultJson);
      
      if (resultJson.status === 1) {
        console.log('CAPTCHA solved successfully:', resultJson.request);
        return resultJson.request;
      } else if (resultJson.request !== 'CAPCHA_NOT_READY') {
        throw new Error(`CAPTCHA solving failed: ${resultJson.request}`);
      }
      
      console.log(`CAPTCHA not ready yet, waiting...`);
    }
    
    throw new Error('CAPTCHA solving timeout: maximum attempts reached');
  } catch (error) {
    console.error('Error solving CAPTCHA:', error);
    throw error;
  }
}
