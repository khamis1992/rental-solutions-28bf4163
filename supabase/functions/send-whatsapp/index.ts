import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

console.log("WhatsApp Edge Function - Fixed Version")

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestBody = await req.json()
    console.log("Received request:", requestBody)
    
    // Handle test requests for service status check
    if (requestBody.test) {
      const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
      if (!accountSid) {
        console.error("TWILIO_ACCOUNT_SID not found in environment")
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Twilio secrets not configured" 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Test successful - Twilio configured" 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const { to, body, messageType, variables } = requestBody
    console.log(`Processing message: to=${to}, type=${messageType}`)

    if (!to) {
      throw new Error("Missing 'to' parameter")
    }

    if (!body && !variables) {
      throw new Error("Missing message content ('body' or 'variables')")
    }

    // Get Twilio credentials
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER');

    if (!accountSid || !authToken || !fromNumber) {
      console.error("Missing Twilio credentials")
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Twilio credentials not properly configured" 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
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

    console.log(`Sending message from ${fromNumber} to ${formattedTo}`)

    // **تعطيل القوالب مؤقتاً - إرسال رسائل نصية فقط**
    const messageBody = body || `رسالة من نظام العراف للتأجير: ${variables?.['1'] || 'إشعار جديد'}`

    // Prepare Twilio API request
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
    
    const formData = new URLSearchParams()
    formData.append('From', fromNumber)
    formData.append('To', formattedTo)
    formData.append('Body', messageBody)

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    })

    const result = await response.json()
    console.log("Twilio response:", result)
    
    if (!response.ok) {
      console.error('Twilio API error:', result)
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Twilio error: ${result.message || result.code || 'Unknown error'}`,
        details: result
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }
    
    console.log(`Message sent successfully. SID: ${result.sid}`)

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: result.sid,
      message: "Message sent successfully as text (templates disabled)"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
    
  } catch (error) {
    console.error('Error in Edge Function:', error)
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || "Internal server error",
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // Return 200 but with success: false to avoid HTTP errors
    })
  }
}) 