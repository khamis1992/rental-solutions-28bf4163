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

    const { to, body, messageType } = requestBody
    console.log(`Received request to send to: ${to}, type: ${messageType}`)

    if (!to || !body) {
      throw new Error("Missing 'to' or 'body' in request.")
    }

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
    formData.append('Body', body)

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