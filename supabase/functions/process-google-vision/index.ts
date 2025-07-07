import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface QatariIdCardData {
  fullName: string;
  nationality: string;
  idNumber: string;
  dateOfBirth: string;
  expiryDate: string;
  placeOfBirth?: string;
  arabicName?: string;
  englishName?: string;
  documentType?: string;
  issueDate?: string;
  cardImageBase64?: string;
}

// Parse Qatari ID card data from extracted text
function parseQatariIdCard(text: string): QatariIdCardData {
  console.log('🔍 Parsing Qatari ID card data...');
  
  // Clean and normalize the text
  const cleanText = cleanArabicText(text);
  const lines = cleanText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  console.log('📝 Extracted lines:', lines);
  
  // Initialize result with default values
  const result: QatariIdCardData = {
    fullName: '',
    nationality: 'قطري',
    idNumber: '',
    dateOfBirth: '',
    expiryDate: ''
  };

  // Enhanced patterns for better Arabic and data extraction
  const patterns = {
    // ID number patterns (more specific)
    idNumber: [
      /(?:رقم\s*الهوية|ID\s*No|رقم\s*البطاقة|الرقم\s*الشخصي)[\s:]*(\d{11})/i,
      /(\d{11})/g, // 11-digit number
      /(\d{8,12})/g // 8-12 digit number as fallback
    ],
    
    // Enhanced name patterns (prefer Arabic)
    arabicName: [
      /(?:الاسم|الإسم)[\s:]*([أ-ي\s]{3,80})/i,
      /^([أ-ي][أ-ي\s]{2,79})$/m, // Arabic name pattern (more flexible)
      /([أ-ي]+\s+[أ-ي]+\s+[أ-ي]+)/g // Multi-word Arabic names
    ],
    
    englishName: [
      /(?:Name)[\s:]*([A-Z][A-Z\s]{2,79})/i,
      /^([A-Z][A-Z\s]{2,79})$/m, // English name pattern
      /([A-Z]+\s+[A-Z]+\s+[A-Z]+)/g // Multi-word English names
    ],
    
    // Date patterns (enhanced)
    dateOfBirth: [
      /(?:تاريخ\s*الميلاد|Date\s*of\s*Birth|الميلاد|DOB)[\s:]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i,
      /(?:Born|الولادة)[\s:]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i
    ],
    
    expiryDate: [
      /(?:تاريخ\s*الانتهاء|Expiry\s*Date|صالح\s*حتى|Valid\s*Until|Date\s*of\s*expiry)[\s:]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i,
      /(?:ينتهي\s*في|Expires|انتهاء)[\s:]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i
    ],
    
    // Enhanced nationality patterns (extract only nationality)
    nationality: [
      /(?:الجنسية|Nationality)[\s:]*([قطري]+|Qatari)/i,
      /(?:^|\s)(قطري|قطرية|Qatari)(?:\s|$)/i
    ]
  };

  // Extract ID number
  for (const pattern of patterns.idNumber) {
    const match = cleanText.match(pattern);
    if (match && match[1] && match[1].length >= 8) {
      result.idNumber = match[1];
      console.log('✅ ID Number found:', result.idNumber);
      break;
    }
  }

  // Extract name (prefer Arabic, fallback to English)
  let nameFound = false;
  
  // Try Arabic name first
  for (const pattern of patterns.arabicName) {
    const match = cleanText.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      if (name.length > 2 && name.length < 100) {
        result.fullName = name;
        result.arabicName = name;
        console.log('✅ Arabic Name found:', result.fullName);
        nameFound = true;
        break;
      }
    }
  }
  
  // If no Arabic name found, try English name
  if (!nameFound) {
    for (const pattern of patterns.englishName) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        const name = match[1].trim();
        if (name.length > 2 && name.length < 100) {
          result.fullName = name;
          result.englishName = name;
          console.log('✅ English Name found:', result.fullName);
          nameFound = true;
          break;
        }
      }
    }
  }

  // Extract dates
  const dates = [];
  for (const pattern of patterns.dateOfBirth) {
    const matches = cleanText.match(pattern);
    if (matches) {
      dates.push(...matches);
    }
  }

  // Assign first date as DOB, second as expiry (if available)
  if (dates.length > 0) {
    result.dateOfBirth = standardizeDateFormat(dates[0]);
    console.log('✅ Date of Birth found:', result.dateOfBirth);
  }
  
  if (dates.length > 1) {
    result.expiryDate = standardizeDateFormat(dates[1]);
    console.log('✅ Expiry Date found:', result.expiryDate);
  }

  // Extract nationality (improved logic)
  let nationalityFound = false;
  for (const pattern of patterns.nationality) {
    const match = cleanText.match(pattern);
    if (match && match[1]) {
      let nationality = match[1].trim();
      
      // Clean up nationality field (remove extra data)
      nationality = nationality.replace(/[^أ-يa-zA-Z]/g, '');
      
      // Standardize nationality formats
      if (nationality.includes('قطر') || nationality.toLowerCase().includes('qatar')) {
        nationality = 'قطري';
      }
      
      // Only accept valid nationality strings (not full text dumps)
      if (nationality.length > 0 && nationality.length < 20) {
        result.nationality = nationality;
        console.log('✅ Nationality found:', result.nationality);
        nationalityFound = true;
        break;
      }
    }
  }
  
  // If nationality not found with patterns, search more broadly
  if (!nationalityFound) {
    if (cleanText.includes('قطري') || cleanText.includes('قطرية')) {
      result.nationality = 'قطري';
      console.log('✅ Nationality found via broad search:', result.nationality);
    } else if (cleanText.toLowerCase().includes('qatari')) {
      result.nationality = 'قطري';
      console.log('✅ Nationality found via English search:', result.nationality);
    }
  }

  console.log('📋 Parsed ID card data:', result);
  return result;
}

// Clean and normalize Arabic text
function cleanArabicText(text: string): string {
  return text
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    // Remove special characters but keep Arabic diacritics
    .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0020-\u007E\n]/g, ' ')
    // Normalize line breaks
    .replace(/[\r\n]+/g, '\n')
    .trim();
}

// Standardize date format to DD/MM/YYYY
function standardizeDateFormat(dateString: string): string {
  // Remove any non-digit, non-slash, non-dash characters
  const cleaned = dateString.replace(/[^\d\/\-]/g, '');
  
  // Try to parse different formats
  const parts = cleaned.split(/[\/\-]/);
  
  if (parts.length === 3) {
    let day = parts[0];
    let month = parts[1];
    let year = parts[2];
    
    // Ensure 2-digit day and month
    day = day.padStart(2, '0');
    month = month.padStart(2, '0');
    
    // Ensure 4-digit year
    if (year.length === 2) {
      const currentYear = new Date().getFullYear();
      const currentCentury = Math.floor(currentYear / 100) * 100;
      year = (parseInt(year) + currentCentury).toString();
    }
    
    return `${day}/${month}/${year}`;
  }
  
  return dateString;
}

// Calculate confidence score based on extracted data quality
function calculateConfidence(data: QatariIdCardData, rawText: string): number {
  let score = 0;
  
  // ID number validation (highest weight)
  if (data.idNumber && /^\d{11}$/.test(data.idNumber)) {
    score += 40;
  } else if (data.idNumber && /^\d{8,12}$/.test(data.idNumber)) {
    score += 25;
  }
  
  // Name validation
  if (data.fullName && data.fullName.length > 2) {
    score += 25;
  }
  
  // Date validation
  if (data.dateOfBirth && /\d{1,2}\/\d{1,2}\/\d{4}/.test(data.dateOfBirth)) {
    score += 15;
  }
  
  if (data.expiryDate && /\d{1,2}\/\d{1,2}\/\d{4}/.test(data.expiryDate)) {
    score += 10;
  }
  
  // Nationality validation
  if (data.nationality) {
    score += 10;
  }
  
  // Text quality bonus
  if (rawText.length > 100) {
    score += 5;
  }
  
  return Math.min(score, 100);
}

interface GoogleVisionRequest {
  imageBase64: string;
  saveImage?: boolean;
  maxResults?: number;
  languageHints?: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    })
  }

  try {
    const { 
      imageBase64, 
      saveImage = true,
      maxResults = 1,
      languageHints = ['ar', 'en']
    }: GoogleVisionRequest = await req.json()

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Image data is required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get Google Vision API key from environment
    const googleVisionApiKey = Deno.env.get('GOOGLE_VISION_API_KEY')
    
    if (!googleVisionApiKey) {
      console.error('❌ Google Vision API key not configured')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Google Vision API not configured' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('🔍 Processing image with Google Vision API...')

    // Clean base64 data
    const cleanImageData = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '')

    const requestPayload = {
      requests: [
        {
          image: {
            content: cleanImageData
          },
          features: [
            {
              type: 'DOCUMENT_TEXT_DETECTION',
              maxResults: maxResults
            }
          ],
          imageContext: {
            languageHints: languageHints
          }
        }
      ]
    }

    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${googleVisionApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Google Vision API error:', errorText)
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Google Vision API request failed',
          details: errorText
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const result = await response.json()
    const responseData = result.responses?.[0]
    
    if (!responseData?.textAnnotations || responseData.textAnnotations.length === 0) {
      console.log('⚠️ No text detected in image')
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'No text detected in image',
          data: null,
          confidence: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const fullText = responseData.textAnnotations[0]?.description || ''
    console.log('✅ Text extracted successfully, length:', fullText.length)

    // Parse Qatari ID card data from the extracted text
    const parsedData = parseQatariIdCard(fullText)
    const confidence = calculateConfidence(parsedData, fullText)

    return new Response(
      JSON.stringify({ 
        success: true,
        data: parsedData,
        rawText: fullText,
        confidence: confidence
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Error processing Google Vision request:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})