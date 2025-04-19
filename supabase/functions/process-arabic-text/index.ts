
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessArabicTextRequest {
  text: string;
  context?: string; // Optional context about the document
}

interface ProcessedTextResponse {
  processedText: string;
  success: boolean;
  correctedChars?: number;
  errorMessage?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, context = "PDF report with Arabic text" }: ProcessArabicTextRequest = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          errorMessage: "No text provided for processing" 
        } as ProcessedTextResponse),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Processing Arabic text of length ${text.length} characters`);

    // Make request to DeepSeek AI API
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are an expert in Arabic text rendering and font encoding. Your task is to identify and correct any encoding or rendering issues in Arabic text that would cause problems in PDF documents. Preserve all original meaning, just fix the encoding issues. Only return the corrected text without any explanations."
          },
          {
            role: "user",
            content: `I need to fix Arabic text rendering issues in a PDF document. Context: ${context}. Here is the text to correct: ${text}`
          }
        ],
        temperature: 0.1 // Low temperature for more deterministic results
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('DeepSeek API error:', errorData);
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const processedText = data.choices[0].message.content;
    const correctedChars = countDifferentChars(text, processedText);

    console.log(`Text processed successfully. Changed ${correctedChars} characters.`);

    return new Response(
      JSON.stringify({
        processedText,
        success: true,
        correctedChars
      } as ProcessedTextResponse),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error processing Arabic text:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        errorMessage: error.message,
        processedText: "" 
      } as ProcessedTextResponse),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Helper function to count the number of different characters between two strings
function countDifferentChars(str1: string, str2: string): number {
  const len = Math.min(str1.length, str2.length);
  let diffCount = 0;
  
  for (let i = 0; i < len; i++) {
    if (str1[i] !== str2[i]) {
      diffCount++;
    }
  }
  
  // Add the difference in length if any
  diffCount += Math.abs(str1.length - str2.length);
  
  return diffCount;
}
