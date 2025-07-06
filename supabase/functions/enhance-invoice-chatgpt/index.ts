import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { ocrText } = await req.json();
    
    if (!ocrText) {
      throw new Error('OCR text is required');
    }

    console.log('🧠 Processing invoice enhancement with ChatGPT...');

    // Get OpenAI API key from secrets
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      console.warn('⚠️ OpenAI API Key not found, using traditional analysis');
      return new Response(JSON.stringify({
        success: false,
        error: 'ChatGPT API Key not available - falling back to traditional analysis',
        confidence: 0,
        processingTime: 100
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const startTime = Date.now();

    // Prepare ChatGPT request
    const requestBody = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: getSystemPrompt() },
        { role: 'user', content: createAnalysisPrompt(ocrText) }
      ],
      temperature: 0.1,
      max_tokens: 1000,
      response_format: { type: 'json_object' }
    };

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`ChatGPT API Error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const processingTime = Date.now() - startTime;

    console.log(`✅ ChatGPT enhancement completed in ${processingTime}ms`);

    // Parse AI response
    const aiContent = result.choices[0].message.content;
    const usage = result.usage;

    try {
      const parsedData = JSON.parse(aiContent);
      const cleanedData = cleanAndValidateData(parsedData);
      const finalConfidence = calculateFinalConfidence(parsedData, cleanedData);

      return new Response(JSON.stringify({
        success: true,
        data: cleanedData,
        confidence: finalConfidence,
        aiAnalysis: aiContent,
        processingTime,
        usage: {
          prompt_tokens: usage.prompt_tokens,
          completion_tokens: usage.completion_tokens,
          total_tokens: usage.total_tokens,
          estimated_cost: calculateCost(usage)
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (parseError) {
      console.error('❌ Failed to parse ChatGPT response:', parseError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to parse ChatGPT response - may be invalid format',
        confidence: 0,
        processingTime
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('❌ Error in ChatGPT invoice enhancement:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      confidence: 0,
      processingTime: 1000
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function createAnalysisPrompt(ocrText: string): string {
  return `
حلل النص التالي من فاتورة عربية لشركة تأجير السيارات في قطر واستخرج البيانات المطلوبة بدقة عالية:

النص المستخرج من الفاتورة:
"${ocrText}"

المطلوب استخراج البيانات التالية بتنسيق JSON صحيح:
{
  "amount": رقم المبلغ الإجمالي النهائي (رقم فقط بدون عملة أو رموز),
  "date": تاريخ الفاتورة بتنسيق YYYY-MM-DD,
  "customerName": اسم العميل أو الشركة (نص نظيف),
  "vehiclePlate": رقم لوحة السيارة (مثل: 123456 أو ABC123),
  "invoiceNumber": رقم الفاتورة أو الإيصال (نص/رقم),
  "category": نوع الخدمة (إيجار، صيانة، وقود، غرامة، تأمين، أخرى),
  "paymentMethod": طريقة الدفع (نقداً، بطاقة ائتمان، تحويل بنكي، شيك، أخرى),
  "description": وصف مختصر وواضح للفاتورة,
  "confidence": مستوى الثقة الإجمالي من 0 إلى 100,
  "notes": أي ملاحظات مهمة أو تفاصيل إضافية
}

تعليمات مهمة جداً:
1. إذا لم تجد معلومة محددة، ضع null وليس نص فارغ
2. المبلغ هو الأهم - ابحث عن الرقم الإجمالي النهائي
3. أرقام السيارات في قطر: أرقام + أحرف أو أحرف + أرقام
4. التاريخ: قد يكون DD/MM/YYYY أو DD-MM-YYYY أو أي تنسيق آخر
5. اسم العميل: قد يكون عربي أو إنجليزي أو مختلط
6. لا تضع أي نص خارج JSON - فقط JSON صحيح
7. تأكد من أن جميع القيم منطقية ومعقولة
8. ارجع مستوى ثقة عالي فقط إذا كنت متأكد من البيانات
`;
}

function getSystemPrompt(): string {
  return `
أنت خبير متخصص في تحليل الفواتير العربية لشركات تأجير السيارات في دولة قطر.

خبراتك المتخصصة:
1. فهم عميق للغة العربية والمصطلحات المالية
2. معرفة أنماط الفواتير القطرية ودول الخليج
3. فهم أنماط أرقام السيارات القطرية (123456، ABC123، 123ABC)
4. التعامل مع العملة القطرية (QAR، ريال قطري، ر.ق)
5. تحليل التواريخ بالأنماط العربية والإنجليزية
6. التمييز بين المبالغ الجزئية والإجمالية النهائية
7. فهم طرق الدفع المختلفة في البيئة القطرية

مهامك الأساسية:
- استخراج البيانات بدقة عالية (هدف: 90-95%)
- التعامل مع النصوص المشوشة أو غير الواضحة
- فهم السياق والمعنى وليس فقط الكلمات
- تقديم تحليل ذكي ومنطقي
- إرجاع JSON صحيح دائماً

قواعد مهمة:
- لا تخمن البيانات - إذا لم تكن متأكد ضع null
- ركز على الدقة أكثر من الكمية
- المبلغ الإجمالي هو الأهم في الفاتورة
- اسم العميل ورقم السيارة مهمان للربط بالنظام

ارجع دائماً JSON صحيح ومفيد للنظام المحاسبي.
`;
}

function cleanAndValidateData(data: any): any {
  return {
    amount: parseAmount(data.amount),
    date: parseDate(data.date),
    customerName: cleanText(data.customerName),
    vehiclePlate: cleanPlateNumber(data.vehiclePlate),
    invoiceNumber: cleanText(data.invoiceNumber),
    category: validateCategory(data.category),
    paymentMethod: validatePaymentMethod(data.paymentMethod),
    description: cleanText(data.description) || 'فاتورة مسح تلقائي بـ ChatGPT',
    currency: 'QAR',
    notes: cleanText(data.notes)
  };
}

function parseAmount(amount: any): number {
  if (typeof amount === 'number') {
    return amount > 0 ? amount : 0;
  }
  
  if (typeof amount === 'string') {
    const cleanAmount = amount.replace(/[^\d.]/g, '');
    const parsed = parseFloat(cleanAmount);
    return !isNaN(parsed) && parsed > 0 ? parsed : 0;
  }
  
  return 0;
}

function parseDate(date: any): string {
  if (!date) {
    return new Date().toISOString().split('T')[0];
  }
  
  const dateStr = String(date).trim();
  
  // Date patterns
  const patterns = [
    /(\d{4})-(\d{1,2})-(\d{1,2})/, // YYYY-MM-DD
    /(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/, // DD/MM/YYYY
    /(\d{1,2})[-\/](\d{1,2})[-\/](\d{2})/, // DD/MM/YY
  ];

  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i];
    const match = dateStr.match(pattern);
    
    if (match) {
      let year: string, month: string, day: string;
      
      if (i === 0) {
        [, year, month, day] = match;
      } else {
        [, day, month, year] = match;
        if (year.length === 2) {
          year = `20${year}`;
        }
      }

      const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      
      const dateObj = new Date(formattedDate);
      if (!isNaN(dateObj.getTime())) {
        return formattedDate;
      }
    }
  }

  return new Date().toISOString().split('T')[0];
}

function cleanText(text: any): string {
  if (!text) return '';
  return String(text).trim().replace(/\s+/g, ' ').substring(0, 100);
}

function cleanPlateNumber(plate: any): string {
  if (!plate) return '';
  
  const cleaned = String(plate).trim().toUpperCase().replace(/\s+/g, ' ');
  
  if (cleaned.match(/^[A-Z0-9\s]{3,10}$/)) {
    return cleaned;
  }
  
  return cleaned.substring(0, 10);
}

function validateCategory(category: any): string {
  if (!category) return 'غير محدد';
  
  const validCategories = [
    'إيجار', 'صيانة', 'وقود', 'غرامة', 'تأمين',
    'rental', 'maintenance', 'fuel', 'fine', 'insurance'
  ];
  
  const categoryStr = String(category).toLowerCase();
  
  for (const valid of validCategories) {
    if (categoryStr.includes(valid.toLowerCase())) {
      return valid;
    }
  }
  
  return String(category).trim().substring(0, 20) || 'غير محدد';
}

function validatePaymentMethod(method: any): string {
  if (!method) return 'غير محدد';
  
  const validMethods = [
    'نقداً', 'بطاقة ائتمان', 'تحويل بنكي', 'شيك',
    'cash', 'credit card', 'bank transfer', 'check'
  ];
  
  const methodStr = String(method).toLowerCase();
  
  for (const valid of validMethods) {
    if (methodStr.includes(valid.toLowerCase())) {
      return valid;
    }
  }
  
  return String(method).trim().substring(0, 20) || 'غير محدد';
}

function calculateFinalConfidence(originalData: any, cleanedData: any): number {
  let confidence = originalData.confidence || 80;
  
  if (cleanedData.amount > 0) confidence += 5;
  if (cleanedData.customerName && cleanedData.customerName !== '') confidence += 3;
  if (cleanedData.vehiclePlate && cleanedData.vehiclePlate !== '') confidence += 3;
  if (cleanedData.date !== new Date().toISOString().split('T')[0]) confidence += 2;
  if (cleanedData.invoiceNumber && cleanedData.invoiceNumber !== '') confidence += 2;
  
  return Math.min(Math.max(confidence, 70), 98);
}

function calculateCost(usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number }): number {
  const inputCost = usage.prompt_tokens * 0.00015 / 1000; // $0.00015 per 1K tokens for gpt-4o-mini input
  const outputCost = usage.completion_tokens * 0.0006 / 1000; // $0.0006 per 1K tokens for gpt-4o-mini output
  return inputCost + outputCost;
}