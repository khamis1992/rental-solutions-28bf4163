import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

console.log("Production WhatsApp sender function initializing...")

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestBody = await req.json()
    
    // Handle test requests for service status check
    if (requestBody.test) {
      const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
      if (!accountSid) {
        throw new Error('Twilio secrets not configured in the function environment.');
      }
      return new Response(JSON.stringify({ success: true, message: "Test successful" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const { to, body, messageType, variables } = requestBody
    console.log(`Received request to send to: ${to}, type: ${messageType}`)

    if (!to) {
      throw new Error("Missing 'to' in request.")
    }

    // --- Template-based sending ---
    const templateSids = {
      'payment_reminder': 'HX9096bf6d24b0c82817f99b3af0803d95',
      // TODO: Add SIDs for 'overdue_payment' and 'payment_received' when approved
    };

    const contentSid = templateSids[messageType];

    if (messageType !== 'general' && !contentSid) {
      throw new Error(`Message template for type '${messageType}' is not defined.`);
    }

    if (contentSid && !variables) {
      throw new Error(`Variables are required for template message type '${messageType}'.`);
    }
    // --- End of template logic ---


    // Get credentials from server-side environment variables (secrets)
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER');
    console.log("Using credentials from Supabase function secrets");

    if (!accountSid || !authToken || !fromNumber) {
      console.error("Twilio secrets not found in Supabase function environment.");
      throw new Error('Twilio secrets not configured in the function environment. Please set them in the Supabase dashboard.');
    }

    // Format phone number for WhatsApp
    let formattedTo = to
    if (!to.startsWith('whatsapp:')) {
      const cleanPhone = to.replace(/[^\d+]/g, '')
      if (cleanPhone.startsWith('+')) {
        formattedTo = `whatsapp:${cleanPhone}`
      } else {
        formattedTo = `whatsapp:+974${cleanPhone}`
      }
    }

    console.log(`Attempting to send message from ${fromNumber} to ${formattedTo}`)

    // Use Twilio REST API directly
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
    
    const formData = new URLSearchParams()
    formData.append('From', fromNumber)
    formData.append('To', formattedTo)

    // Use Content API for templates, or Body for general messages
    if (contentSid) {
      console.log(`Sending with Template SID: ${contentSid}`);
      formData.append('ContentSid', contentSid);
      formData.append('ContentVariables', JSON.stringify(variables));
    } else {
      console.log("Sending with freeform body.");
      if (!body) throw new Error("Missing 'body' for general message.");
      formData.append('Body', body);
    }

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    })

    const result = await response.json()
    
    if (!response.ok) {
      console.error('Twilio API error:', result)
      throw new Error(`Twilio API error: ${result.message || 'Unknown error'}`)
    }
    
    console.log(`Message sent successfully. SID: ${result.sid}`)

    return new Response(JSON.stringify({ success: true, messageId: result.sid }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
    
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
}) 