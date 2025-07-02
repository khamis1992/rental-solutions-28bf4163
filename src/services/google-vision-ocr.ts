// Google Vision OCR Service - Complete Implementation
// API Key: AIzaSyDerb68G9zDwHI0e9-gwHf4b3fKQmPrE_o

export interface QatariIdCardData {
  fullName: string;
  nationality: string;
  idNumber: string;
  dateOfBirth: string;
  expiryDate: string;
  placeOfBirth?: string;
  // Additional fields that might be extracted
  arabicName?: string;
  englishName?: string;
  documentType?: string;
  issueDate?: string;
  // Add image data for saving with customer
  cardImageBase64?: string;
}

export interface OcrResult {
  success: boolean;
  data?: QatariIdCardData;
  error?: string;
  confidence?: number;
  rawText?: string;
}

class GoogleVisionOcrService {
  private readonly apiKey: string;
  private readonly apiUrl = 'https://vision.googleapis.com/v1/images:annotate';

  constructor() {
    // Use the provided API key
    this.apiKey = 'AIzaSyDerb68G9zDwHI0e9-gwHf4b3fKQmPrE_o';
  }

  /**
   * Extract text from image using Google Vision API
   */
  async extractTextFromImage(imageBase64: string, saveImage: boolean = true): Promise<OcrResult> {
    try {
      console.log('🔍 Starting Google Vision OCR analysis...');
      
      // Prepare the request payload
      const requestPayload = {
        requests: [
          {
            image: {
              content: imageBase64.replace(/^data:image\/[a-z]+;base64,/, '')
            },
            features: [
              {
                type: 'TEXT_DETECTION',
                maxResults: 50
              },
              {
                type: 'DOCUMENT_TEXT_DETECTION',
                maxResults: 50
              }
            ],
            imageContext: {
              languageHints: ['ar', 'en'] // Arabic and English
            }
          }
        ]
      };

      // Make the API call
      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Google Vision API error:', errorText);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📄 Google Vision API response received');

      // Check for API errors
      if (result.responses?.[0]?.error) {
        throw new Error(`Vision API error: ${result.responses[0].error.message}`);
      }

      // Extract text from response
      const textAnnotations = result.responses?.[0]?.textAnnotations;
      if (!textAnnotations || textAnnotations.length === 0) {
        console.warn('⚠️ No text detected in image');
        return {
          success: false,
          error: 'لم يتم العثور على نص في الصورة',
          confidence: 0
        };
      }

      const fullText = textAnnotations[0]?.description || '';
      console.log('📝 Extracted text:', fullText.substring(0, 200) + '...');

      // Process the extracted text for Qatari ID card
      const extractedData = this.parseQatariIdCard(fullText);
      
      // Add image data if requested
      if (saveImage) {
        extractedData.cardImageBase64 = imageBase64;
      }
      
      return {
        success: true,
        data: extractedData,
        rawText: fullText,
        confidence: this.calculateConfidence(extractedData, fullText)
      };

    } catch (error) {
      console.error('❌ OCR extraction failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'خطأ غير معروف في استخراج النص',
        confidence: 0
      };
    }
  }

  /**
   * Parse Qatari ID card data from extracted text
   */
  private parseQatariIdCard(text: string): QatariIdCardData {
    console.log('🔍 Parsing Qatari ID card data...');
    
    // Clean and normalize the text
    const cleanText = this.cleanArabicText(text);
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
      result.dateOfBirth = this.standardizeDateFormat(dates[0]);
      console.log('✅ Date of Birth found:', result.dateOfBirth);
    }
    
    if (dates.length > 1) {
      result.expiryDate = this.standardizeDateFormat(dates[1]);
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

    // Fallback data extraction using line-by-line analysis
    if (!result.fullName || !result.idNumber) {
      this.extractFallbackData(lines, result);
    }

    console.log('📋 Parsed ID card data:', result);
    return result;
  }

  /**
   * Clean and normalize Arabic text
   */
  private cleanArabicText(text: string): string {
    return text
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      // Remove special characters but keep Arabic diacritics
      .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0020-\u007E\n]/g, ' ')
      // Normalize line breaks
      .replace(/[\r\n]+/g, '\n')
      .trim();
  }

  /**
   * Fallback data extraction method
   */
  private extractFallbackData(lines: string[], result: QatariIdCardData): void {
    console.log('🔄 Using fallback extraction method...');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for ID number (11 digits)
      if (!result.idNumber) {
        const idMatch = line.match(/\d{11}/);
        if (idMatch) {
          result.idNumber = idMatch[0];
          console.log('✅ Fallback ID found:', result.idNumber);
        }
      }
      
      // Look for name (Arabic characters)
      if (!result.fullName) {
        const arabicMatch = line.match(/^[أ-ي\s]{5,50}$/);
        const englishMatch = line.match(/^[A-Z][a-zA-Z\s]{4,49}$/);
        
        if (arabicMatch && arabicMatch[0].trim().length > 4) {
          result.fullName = arabicMatch[0].trim();
          console.log('✅ Fallback Arabic name found:', result.fullName);
        } else if (englishMatch && englishMatch[0].trim().length > 4) {
          result.fullName = englishMatch[0].trim();
          console.log('✅ Fallback English name found:', result.fullName);
        }
      }
    }
  }

  /**
   * Standardize date format to DD/MM/YYYY
   */
  private standardizeDateFormat(dateString: string): string {
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

  /**
   * Calculate confidence score based on extracted data quality
   */
  private calculateConfidence(data: QatariIdCardData, rawText: string): number {
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

  /**
   * Validate if image appears to be a Qatari ID card
   */
  async validateQatariIdCard(imageBase64: string): Promise<boolean> {
    try {
      const result = await this.extractTextFromImage(imageBase64);
      
      if (!result.success || !result.rawText) {
        return false;
      }
      
      const text = result.rawText.toLowerCase();
      
      // Check for Qatari ID indicators
      const qatariIndicators = [
        'قطر', 'qatar', 'الهوية', 'identity', 'بطاقة شخصية',
        'personal card', 'قطري', 'qatari'
      ];
      
      return qatariIndicators.some(indicator => text.includes(indicator));
      
    } catch (error) {
      console.error('❌ Validation error:', error);
      return false;
    }
  }
}

// Export singleton instance
export const googleVisionOcrService = new GoogleVisionOcrService();

// Export for direct use
export default googleVisionOcrService; 