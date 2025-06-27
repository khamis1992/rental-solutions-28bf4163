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

    const { to, body, messageType, variables, mediaUrl } = requestBody
    console.log(`Received request to send to: ${to}, type: ${messageType}`)

    if (!to) {
      throw new Error("Missing 'to' in request.")
    }

    // --- Template-based sending ---
    // ⚠️ يجب تحديث معرفات القوالب التالية بالمعرفات الفعلية المعتمدة من Twilio
    const templateSids = {
      'payment_reminder': 'HX9096bf6d24b0c82817f99b3af0803d95', // تذكير دفعة شهرية ✅ معتمد ويعمل
      'monthly_reminder': 'HX_MONTHLY_REMINDER_SID', // تذكير دفعة شهرية (28 من كل شهر) - يحتاج SID فعلي
      'delay_penalty': 'HX_DELAY_PENALTY_SID', // إنذار غرامة تأخير (1 من كل شهر) - يحتاج SID فعلي
      'final_warning': 'HX_FINAL_WARNING_SID', // إنذار نهائي قانوني - يحتاج SID فعلي
      'legal_action': 'HX_LEGAL_ACTION_SID', // إنذار إجراء قانوني (24 ساعة) - يحتاج SID فعلي
      'manager_report': 'HX_MANAGER_REPORT_SID', // تقرير يومي للمدير العام - يحتاج SID فعلي
      'report_with_pdf': 'HX_REPORT_PDF_SID', // قالب جديد للتقارير مع PDF - يحتاج SID فعلي
      'scheduled_report': null, // التقارير المجدولة - إرسال نص عادي
      'instant_report': null, // التقارير الفورية - إرسال نص عادي
      'daily_summary': null, // الملخص اليومي - إرسال نص عادي
      'report_failure': null, // تنبيه فشل التقرير - إرسال نص عادي
      // Legacy templates
      'overdue_payment': 'HX_OVERDUE_PAYMENT_SID',
      'payment_received': 'HX_PAYMENT_RECEIVED_SID'
    };

    const contentSid = templateSids[messageType];
    
    if (messageType !== 'general' && contentSid === undefined) {
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
      
      // إضافة ملف PDF إذا كان متوفراً
      if (mediaUrl) {
        console.log(`Adding media attachment: ${mediaUrl}`);
        formData.append('MediaUrl', mediaUrl);
      }
    } else {
      console.log("Sending with freeform body (for reports and general messages).");
      if (!body) throw new Error("Missing 'body' for general message.");
      formData.append('Body', body);
      
      // إضافة ملف PDF للرسائل النصية أيضاً
      if (mediaUrl) {
        console.log(`Adding media attachment to text message: ${mediaUrl}`);
        formData.append('MediaUrl', mediaUrl);
      }
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
      
      // التعامل مع خطأ 63016 (قالب مرفوض أو غير معتمد)
      if (result.code === 63016) {
        console.log('Template error 63016 detected, falling back to text message...');
        
        // إعادة المحاولة كرسالة نصية عادية
        const fallbackFormData = new URLSearchParams()
        fallbackFormData.append('From', fromNumber)
        fallbackFormData.append('To', formattedTo)
        fallbackFormData.append('Body', body || `تقرير جديد متاح: ${variables?.['1'] || 'غير محدد'}`)
        
        if (mediaUrl) {
          fallbackFormData.append('MediaUrl', mediaUrl);
        }
        
        const fallbackResponse = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: fallbackFormData,
        })
        
        const fallbackResult = await fallbackResponse.json()
        
        if (!fallbackResponse.ok) {
          throw new Error(`Fallback message also failed: ${fallbackResult.message || 'Unknown error'}`)
        }
        
        console.log(`Fallback message sent successfully. SID: ${fallbackResult.sid}`)
        
        return new Response(JSON.stringify({ 
          success: true, 
          messageId: fallbackResult.sid, 
          fallback: true,
          message: 'Template failed, sent as text message with media'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }
      
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