import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

console.log("WhatsApp Edge Function - Production Ready Version")

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestBody = await req.json()
    console.log("Received request:", JSON.stringify(requestBody, null, 2))
    
    // Handle test requests for service status check
    if (requestBody.test) {
      const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
      if (!accountSid) {
        console.error("TWILIO_ACCOUNT_SID not found in environment")
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Twilio secrets not configured",
          setup_required: true
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: "WhatsApp service is configured and ready",
        account_sid_configured: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const { to, body, messageType = 'general', variables } = requestBody
    console.log(`Processing WhatsApp message: to=${to}, type=${messageType}`)

    // Validate required parameters
    if (!to) {
      throw new Error("Missing 'to' parameter")
    }

    if (!body && !variables) {
      throw new Error("Missing message content ('body' or 'variables')")
    }

    // Get Twilio credentials from Supabase Function Secrets
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER');

    console.log("Checking Twilio credentials...")
    console.log("Account SID configured:", !!accountSid)
    console.log("Auth Token configured:", !!authToken)
    console.log("WhatsApp Number configured:", !!fromNumber)

    if (!accountSid || !authToken || !fromNumber) {
      const missingSecrets = [];
      if (!accountSid) missingSecrets.push('TWILIO_ACCOUNT_SID');
      if (!authToken) missingSecrets.push('TWILIO_AUTH_TOKEN');
      if (!fromNumber) missingSecrets.push('TWILIO_WHATSAPP_NUMBER');
      
      console.error("Missing Twilio secrets:", missingSecrets.join(', '))
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Twilio credentials not properly configured",
        missing_secrets: missingSecrets,
        setup_required: true
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
      } else if (cleanPhone.startsWith('974')) {
        formattedTo = `whatsapp:+${cleanPhone}`
      } else {
        formattedTo = `whatsapp:+974${cleanPhone}`
      }
    }

    console.log(`Sending WhatsApp message from ${fromNumber} to ${formattedTo}`)

    // Create message body
    let messageBody = body;
    if (!messageBody && variables) {
      // Create Arabic message based on message type
      switch (messageType) {
        case 'payment_reminder':
          messageBody = `السلام عليكم،\n\nتذكير بسداد دفعة الإيجار:\n- المبلغ: ${variables['1'] || 'غير محدد'}\n- التاريخ المستحق: ${variables['2'] || 'غير محدد'}\n\nشكراً لكم\nشركة العراف للتأجير`;
          break;
        case 'monthly_reminder':
          messageBody = `السلام عليكم،\n\nتذكير شهري بدفعة الإيجار:\n- المبلغ المستحق: ${variables['1'] || 'غير محدد'}\n- تاريخ الاستحقاق: ${variables['2'] || 'غير محدد'}\n\nيرجى التواصل معنا لأي استفسارات\nشركة العراف للتأجير`;
          break;
        case 'late_payment_notice':
          messageBody = `السلام عليكم،\n\nإشعار تأخير سداد:\n- المبلغ المتأخر: ${variables['1'] || 'غير محدد'}\n- أيام التأخير: ${variables['2'] || 'غير محدد'}\n- الغرامة: ${variables['3'] || 'غير محدد'}\n\nيرجى السداد في أقرب وقت\nشركة العراف للتأجير`;
          break;
        case 'scheduled_report':
          messageBody = `📊 تقرير مجدول جديد\n\nاسم التقرير: ${variables['1'] || 'غير محدد'}\nالنوع: ${variables['2'] || 'غير محدد'}\nتاريخ الإنشاء: ${variables['3'] || 'غير محدد'}\n\nشركة العراف للتأجير`;
          break;
        default:
          messageBody = variables['1'] || 'رسالة من نظام العراف للتأجير';
      }
    }

    // Prepare Twilio API request
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
    
    const formData = new URLSearchParams()
    formData.append('From', fromNumber)
    formData.append('To', formattedTo)
    formData.append('Body', messageBody)

    console.log("Sending request to Twilio API...")
    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    })

    const result = await response.json()
    console.log("Twilio API response:", JSON.stringify(result, null, 2))
    
    if (!response.ok) {
      console.error('Twilio API error:', result)
      
      // Handle specific Twilio errors
      let errorMessage = 'Unknown Twilio error';
      if (result.code === 20003) {
        errorMessage = 'Authentication failed - please check your Twilio credentials';
      } else if (result.code === 21211) {
        errorMessage = 'Invalid phone number format';
      } else if (result.code === 21608) {
        errorMessage = 'WhatsApp number not configured or verified';
      } else if (result.message) {
        errorMessage = result.message;
      }
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Twilio error: ${errorMessage}`,
        twilio_code: result.code,
        details: result,
        setup_required: result.code === 20003
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }
    
    console.log(`WhatsApp message sent successfully. SID: ${result.sid}`)

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: result.sid,
      message: "WhatsApp message sent successfully",
      to: formattedTo,
      type: messageType
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
    
  } catch (error) {
    console.error('Error in WhatsApp Edge Function:', error)
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || "Internal server error",
      timestamp: new Date().toISOString(),
      function: 'send-whatsapp'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // Return 200 but with success: false to avoid HTTP errors
    })
  }
}) 