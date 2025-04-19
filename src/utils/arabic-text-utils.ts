
import { DeepSeekAI } from 'deepseek-ai';

// Initialize DeepSeek AI client
const deepseek = new DeepSeekAI({
  apiKey: process.env.DEEPSEEK_API_KEY
});

export async function processArabicText(text: string): Promise<string> {
  try {
    const response = await deepseek.processText({
      text,
      options: {
        fixEncoding: true,
        normalizeArabic: true,
        fixDiacritics: true
      }
    });
    
    return response.processedText;
  } catch (error) {
    console.error('Error processing Arabic text:', error);
    return text; // Return original text if processing fails
  }
}

export async function validateArabicRendering(text: string): Promise<boolean> {
  try {
    const response = await deepseek.validateText({
      text,
      language: 'ar'
    });
    
    return response.isValid;
  } catch (error) {
    console.error('Error validating Arabic text:', error);
    return true; // Assume valid if validation fails
  }
}
