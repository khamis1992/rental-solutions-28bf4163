
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, templateType, variables } = await req.json();

    // Create system prompt with available variables
    const systemPrompt = `You are an expert HTML template designer. 
Create a professional ${templateType} template using only HTML and CSS. 
Use the following variables in appropriate places. Each variable is in the format {{variableName}}:

${variables.map(v => `${v.name} - ${v.description}`).join('\n')}

The template should be:
1. Clean and professional looking
2. Include appropriate styling with embedded CSS
3. Have a well-organized layout
4. Be responsive
5. Only use the variables provided above
6. Return ONLY the HTML code, no explanations`;

    // Call DeepSeek API
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt || 'Generate a professional template for this document type.' }
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to generate template');
    }

    const generatedTemplate = data.choices[0].message.content;

    return new Response(JSON.stringify({ template: generatedTemplate }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating template:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
